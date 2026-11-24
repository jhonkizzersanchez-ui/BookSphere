/*
 * BookSphere page behaviour (replaces the React state that was only visual).
 * Everything is driven by data attributes so PHP views need no inline scripts:
 *
 *   data-toast="Message" data-toast-type="success|info|warning"
 *       Click shows a toast. "{name}" placeholders are filled from fields of the closest <form>/[data-modal].
 *   data-toggle="#id"   Click toggles the target's `hidden` attribute.
 *   data-show="#id" / data-hide="#id"   Click shows / hides the target.
 *   data-clear="#input" Click clears that input; the button hides itself while the input is empty.
 *   data-autosubmit     On an input/select: submit its form when the value changes.
 *   data-busy-text="Signing in…"   On a submit button: shown while the form submits; blocks double submits.
 *   data-confirm="Are you sure?"  On a form or submit button: asks before submitting; Cancel stops the submit.
 *   data-password-toggle="#input"  Click switches the input between password and text.
 *   data-modal          Marks a modal container (start it with the `hidden` attribute).
 *   data-modal-open="#id" data-fields='{"title":"…"}' data-texts='{"heading":"…"}'
 *       Opens the modal, fills fields by name and [data-modal-text="key"] elements by key.
 *   data-modal-close    Click closes the closest modal (after any toast on the same element).
 *   details[data-dropdown]  Closes when clicking elsewhere.
 */
(() => {
  const icons = { success: '✅', info: 'ℹ️', warning: '⚠️' };
  const colors = {
    success: { bg: '#E8F8F0', border: '#A8D8BC', text: '#1E7A50' },
    info: { bg: '#EEF0FD', border: '#B4BCEF', text: '#2B47CE' },
    warning: { bg: '#FFF3E8', border: '#F4C08A', text: '#B56120' },
  };

  function toast(message, type = 'success') {
    const container = document.getElementById('toasts');
    if (!container) return;
    const c = colors[type] || colors.success;
    const item = document.createElement('div');
    item.className = 'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto max-w-xs';
    item.style.backgroundColor = c.bg;
    item.style.borderColor = c.border;
    item.setAttribute('role', 'status');
    const icon = document.createElement('span');
    icon.className = 'text-sm flex-shrink-0';
    icon.textContent = icons[type] || icons.success;
    const text = document.createElement('p');
    text.className = 'text-xs font-semibold';
    text.style.color = c.text;
    text.textContent = message;
    item.append(icon, text);
    container.append(item);
    setTimeout(() => item.remove(), 3500);
  }
  window.BookSphere = { toast };

  const target = (selector) => (selector ? document.querySelector(selector) : null);

  function fill(message, element) {
    const scope = element.closest('form, [data-modal]');
    return message.replace(/\{(\w+)\}/g, (match, name) => {
      const field = scope && scope.querySelector(`[name="${name}"]`);
      return field ? field.value : match;
    });
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
  }

  function openModal(trigger) {
    const modal = target(trigger.dataset.modalOpen);
    if (!modal) return;
    const fields = JSON.parse(trigger.dataset.fields || '{}');
    const texts = JSON.parse(trigger.dataset.texts || '{}');
    modal.querySelectorAll('[name]').forEach((field) => {
      if (field.name in fields) field.value = fields[field.name];
      else if (field.dataset.default !== undefined) field.value = field.dataset.default;
    });
    modal.querySelectorAll('[data-modal-text]').forEach((element) => {
      const key = element.dataset.modalText;
      if (key in texts) element.textContent = texts[key];
    });
    modal.hidden = false;
    const first = modal.querySelector('input:not([type="hidden"]), select, textarea') || modal.querySelector('button');
    if (first) first.focus();
  }

  function syncClearButtons() {
    document.querySelectorAll('[data-clear]').forEach((button) => {
      const input = target(button.dataset.clear);
      if (input) button.hidden = input.value === '';
    });
  }

  document.addEventListener('click', (event) => {
    const element = event.target.closest('[data-toast], [data-toggle], [data-show], [data-hide], [data-clear], [data-password-toggle], [data-modal-open], [data-modal-close]');

    document.querySelectorAll('details[data-dropdown][open]').forEach((details) => {
      if (!details.contains(event.target)) details.open = false;
    });

    if (!element) {
      const backdrop = event.target.matches('[data-modal]') ? event.target : null;
      closeModal(backdrop);
      return;
    }
    if (element.dataset.toast) toast(fill(element.dataset.toast, element), element.dataset.toastType || 'success');
    if (element.dataset.toggle) {
      const node = target(element.dataset.toggle);
      if (node) {
        node.hidden = !node.hidden;
        document.querySelectorAll(`[data-toggle="${element.dataset.toggle}"]`).forEach((button) => button.setAttribute('aria-expanded', String(!node.hidden)));
      }
    }
    if (element.dataset.show) {
      const node = target(element.dataset.show);
      if (node) node.hidden = false;
    }
    if (element.dataset.hide) {
      const node = target(element.dataset.hide);
      if (node) node.hidden = true;
    }
    if (element.dataset.clear) {
      const input = target(element.dataset.clear);
      if (input) {
        input.value = '';
        input.focus();
      }
      syncClearButtons();
    }
    if (element.dataset.passwordToggle) {
      const input = target(element.dataset.passwordToggle);
      if (input) {
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        element.textContent = showing ? '👁️' : '🙈';
        element.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      }
    }
    if (element.dataset.modalOpen) openModal(element);
    if (element.hasAttribute('data-modal-close')) closeModal(element.closest('[data-modal]'));
  });

  document.addEventListener('input', syncClearButtons);

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-autosubmit]') && event.target.form) event.target.form.requestSubmit();
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    const confirmation = (event.submitter && event.submitter.dataset.confirm) || form.dataset.confirm;
    if (confirmation && !window.confirm(confirmation)) {
      event.preventDefault();
      return;
    }
    if (form.dataset.submitting) {
      event.preventDefault();
      return;
    }
    form.dataset.submitting = '1';
    const button = event.submitter && event.submitter.dataset.busyText ? event.submitter : form.querySelector('[data-busy-text]');
    if (button) {
      busyButtons.set(button, button.innerHTML);
      button.textContent = button.dataset.busyText;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('opacity-70', 'cursor-not-allowed');
    }
  });

  // Restore forms when the browser brings the page back from its back/forward cache.
  const busyButtons = new Map();
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('form[data-submitting]').forEach((form) => delete form.dataset.submitting);
    busyButtons.forEach((html, button) => {
      button.innerHTML = html;
      button.removeAttribute('aria-disabled');
      button.classList.remove('opacity-70', 'cursor-not-allowed');
    });
    busyButtons.clear();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelectorAll('[data-modal]:not([hidden])').forEach(closeModal);
  });

  document.addEventListener('DOMContentLoaded', () => {
    syncClearButtons();
    const flash = document.getElementById('flash-toasts');
    if (flash) JSON.parse(flash.textContent || '[]').forEach((item) => toast(item.message, item.type));
    document.querySelectorAll('[data-modal-autoopen]').forEach((trigger) => openModal(trigger));
  });
})();
