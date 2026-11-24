/*
 * Signed-out screens (views/auth/*): the bits of src/screens/Login.tsx state that app.js does not cover.
 * Everything still works without this file; it only keeps the page in sync while the user types.
 *
 *   form[data-login-form]  Its role radios carry data-color, data-bg, data-description, data-label-text and
 *       data-placeholder-text. Picking one updates [data-role-description], [data-role-label], the username
 *       placeholder, [data-role-submit]'s colour and [data-forgot-link]'s ?role=. (The cards use CSS has-checked.)
 *   data-error-for="field other"   Error message that disappears once one of those fields is edited. Inputs that
 *       point at it with aria-describedby lose aria-invalid and get their data-ok-class back (no red border).
 *   data-busy-spinner      On a data-busy-text submit button: shows the spinner next to the busy text.
 */
(() => {
  const loginForm = document.querySelector('form[data-login-form]');

  function syncLoginRole() {
    const radio = loginForm.querySelector('input[name="role"]:checked');
    if (!radio) return;
    const role = radio.dataset;
    const description = loginForm.querySelector('[data-role-description]');
    if (description) {
      description.textContent = role.description;
      description.style.color = role.color;
      description.style.backgroundColor = role.bg;
      description.hidden = false;
    }
    const label = loginForm.querySelector('[data-role-label]');
    if (label) label.textContent = role.labelText;
    const username = loginForm.elements.namedItem('username');
    if (username) username.placeholder = role.placeholderText;
    const submit = loginForm.querySelector('[data-role-submit]');
    if (submit) submit.style.backgroundColor = role.color;
    const forgot = loginForm.querySelector('[data-forgot-link]');
    if (forgot) {
      const link = new URL(forgot.href);
      link.searchParams.set('role', radio.value);
      forgot.href = link.href;
    }
  }

  if (loginForm) {
    loginForm.addEventListener('change', (event) => {
      if (event.target.name === 'role') syncLoginRole();
    });
    // The browser may restore a different radio than the server rendered (reload, back/forward).
    syncLoginRole();
    window.addEventListener('pageshow', syncLoginRole);
  }

  const words = (value) => (value || '').split(/\s+/).filter(Boolean);

  document.addEventListener('input', (event) => {
    const field = event.target;
    const form = field.form;
    if (!form || !field.name) return;
    form.querySelectorAll('[data-error-for]').forEach((message) => {
      if (message.hidden || !words(message.dataset.errorFor).includes(field.name)) return;
      message.hidden = true;
      if (!message.id) return;
      form.querySelectorAll('[aria-describedby]').forEach((input) => {
        const ids = words(input.getAttribute('aria-describedby'));
        if (!ids.includes(message.id)) return;
        const rest = ids.filter((id) => id !== message.id);
        if (rest.length) input.setAttribute('aria-describedby', rest.join(' '));
        else input.removeAttribute('aria-describedby');
        input.removeAttribute('aria-invalid');
        if (input.dataset.okClass) input.className = input.dataset.okClass;
      });
    });
  });

  const spinner = '<svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
    + '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.3"/>'
    + '<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

  // app.js swaps the label for data-busy-text in its document listener; this window listener runs after it.
  window.addEventListener('submit', (event) => {
    if (event.defaultPrevented) return;
    const form = event.target;
    const button = event.submitter && event.submitter.dataset.busyText ? event.submitter : form.querySelector('[data-busy-text]');
    if (!button || !('busySpinner' in button.dataset)) return;
    const content = document.createElement('span');
    content.className = 'flex items-center justify-center gap-2';
    content.innerHTML = spinner;
    content.append(button.dataset.busyText);
    button.replaceChildren(content);
  });
})();
