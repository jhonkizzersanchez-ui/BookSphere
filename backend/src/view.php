<?php

declare(strict_types=1);

/* ---------- Escaping, URLs, redirects ---------- */

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Builds an app URL that respects base_path. Null query values are dropped. */
function url(string $path = '/', array $query = []): string
{
    $query = array_filter($query, fn ($value) => $value !== null && $value !== '' && $value !== []);
    $base = rtrim(appConfig()['base_path'], '/');
    return $base.'/'.ltrim($path, '/').($query ? '?'.http_build_query($query) : '');
}

function asset(string $file): string
{
    return url('assets/'.$file);
}

function redirect(string $path, array $query = []): never
{
    header('Location: '.url($path, $query), true, 303);
    exit;
}

/** The current request path without base_path, e.g. "/catalog". */
function currentPath(): string
{
    return $GLOBALS['booksphere_path'] ?? '/';
}

/**
 * URL of the current page with some query parameters changed.
 * Pass null to remove a parameter. Example: queryWith(['tab' => 'history']).
 */
function queryWith(array $changes): string
{
    $query = array_merge($_GET, $changes);
    return url(currentPath(), $query);
}

/** Reads a string query parameter. */
function queryString(string $key, string $default = ''): string
{
    $value = $_GET[$key] ?? $default;
    return is_string($value) ? trim($value) : $default;
}

/** Reads an array query parameter such as genre[]=Fantasy&genre[]=Comedy. */
function queryList(string $key): array
{
    $value = $_GET[$key] ?? [];
    return array_values(array_filter(is_array($value) ? $value : [$value], 'is_string'));
}

/** Adds or removes $item from a list, for toggle-style filter links. */
function toggleItem(array $list, string $item): array
{
    return in_array($item, $list, true) ? array_values(array_diff($list, [$item])) : [...$list, $item];
}

/* ---------- Sessions: CSRF and flash data ---------- */

function csrfField(): string
{
    return '<input type="hidden" name="_csrf" value="'.e($_SESSION['csrf']).'">';
}

function validFormCsrf(): bool
{
    $token = $_POST['_csrf'] ?? '';
    return is_string($token) && hash_equals($_SESSION['csrf'], $token);
}

/** Queues a toast to show on the next page load. Types: success, info, warning. */
function flashToast(string $message, string $type = 'success'): void
{
    $_SESSION['toasts'][] = ['message' => $message, 'type' => $type];
}

function takeToasts(): array
{
    $toasts = $_SESSION['toasts'] ?? [];
    unset($_SESSION['toasts']);
    return $toasts;
}

function setFlash(string $key, mixed $value): void
{
    $_SESSION['flash'][$key] = $value;
}

function takeFlash(string $key): mixed
{
    $value = $_SESSION['flash'][$key] ?? null;
    unset($_SESSION['flash'][$key]);
    return $value;
}

/** HTML attributes that make a button show a toast when clicked (handled by assets/app.js). */
function toastAttrs(string $message, string $type = 'success'): string
{
    return ' data-toast="'.e($message).'" data-toast-type="'.e($type).'"';
}

/* ---------- Rendering ---------- */

/** Renders backend/views/{$view}.php with $vars as local variables and returns the HTML. */
function render(string $view, array $vars = []): string
{
    extract($vars, EXTR_SKIP);
    ob_start();
    try {
        require dirname(__DIR__).'/views/'.$view.'.php';
    } catch (Throwable $error) {
        ob_end_clean();
        throw $error;
    }
    return (string) ob_get_clean();
}

function sendHtml(string $html, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    echo $html;
    exit;
}

/** Signed-in page: the view is wrapped in the navbar/sidebar shell. $active is the nav key to highlight. */
function appPage(string $view, array $user, string $active, string $title, array $vars = []): never
{
    $content = render($view, ['user' => $user] + $vars);
    sendHtml(render('layout', ['user' => $user, 'active' => $active, 'title' => $title, 'content' => $content]));
}

/** Signed-out page (login, sign-up, password recovery): no app shell. */
function guestPage(string $view, string $title, array $vars = [], int $status = 200): never
{
    $content = render($view, $vars);
    sendHtml(render('guest', ['title' => $title, 'content' => $content]), $status);
}

/* ---------- Shared UI pieces (ported from the React components) ---------- */

const BALOO = "font-family: 'Baloo 2', sans-serif;";

function roleOptions(): array
{
    return [
        'student' => ['id' => 'student', 'label' => 'Student', 'emoji' => '🎒', 'description' => 'Find books, track reading, earn badges', 'color' => '#2A9D8F', 'bg' => '#E8F5F3'],
        'teacher' => ['id' => 'teacher', 'label' => 'Teacher', 'emoji' => '✏️', 'description' => 'Monitor class reading & build lists', 'color' => '#4361EE', 'bg' => '#EEF0FD'],
        'librarian' => ['id' => 'librarian', 'label' => 'Librarian', 'emoji' => '🗂️', 'description' => 'Manage the collection & reports', 'color' => '#9B5DE5', 'bg' => '#F3EEFF'],
    ];
}

function roleAccent(string $role): string
{
    return roleOptions()[$role]['color'] ?? '#2A9D8F';
}

function initials(string $name): string
{
    $parts = array_slice(array_values(array_filter(explode(' ', $name), fn ($part) => $part !== '')), 0, 2);
    return implode('', array_map(fn ($part) => mb_substr($part, 0, 1), $parts));
}

/** Formats a Y-m-d date. Default "Mar 31"; use 'M j, Y' for "Mar 31, 2024", 'l, F j' for "Saturday, March 23". */
function fmtDate(string $date, string $format = 'M j'): string
{
    return (new DateTimeImmutable($date))->format($format);
}

/** "Grades 6-8" → "Gr 6-8" */
function shortLevel(string $level): string
{
    return str_replace('Grades ', 'Gr ', $level);
}

/** Generated book cover. Sizes: xs, sm, md, lg, xl. */
function bookCover(array $book, string $size = 'md', string $class = ''): string
{
    $sizes = [
        'xs' => ['w-10 h-14', 'text-[7px]', 'text-[6px]'],
        'sm' => ['w-16 h-24', 'text-[9px]', 'text-[8px]'],
        'md' => ['w-24 h-36', 'text-xs', 'text-[9px]'],
        'lg' => ['w-36 h-52', 'text-sm', 'text-xs'],
        'xl' => ['w-48 h-72', 'text-base', 'text-sm'],
    ];
    [$wrapper, $title, $author] = $sizes[$size];
    $series = isset($book['series'])
        ? '<div class="absolute top-2 right-2 bg-white/20 rounded px-1"><span class="'.$author.' text-white font-semibold leading-tight block">Series</span></div>'
        : '';
    return '<div class="'.$wrapper.' '.e($class).' rounded-lg flex-shrink-0 relative overflow-hidden shadow-md" style="background: linear-gradient(145deg, '.e($book['coverColor']).' 0%, '.e($book['coverAccent']).' 100%)">'
        .'<div class="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>'
        .'<div class="absolute top-1/4 right-[-20%] w-3/4 aspect-square rounded-full opacity-10" style="background: white"></div>'
        .$series
        .'<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent pt-6">'
        .'<p class="'.$author.' text-white/70 font-medium leading-tight mb-0.5 truncate">'.e($book['author']).'</p>'
        .'<p class="'.$title.' text-white font-bold leading-tight line-clamp-2" style="'.BALOO.'">'.e($book['title']).'</p>'
        .'</div></div>';
}

/** Five stars, filled up to round($rating). */
function stars(float $rating, string $sizeClass = 'text-xs'): string
{
    $html = '<div class="flex gap-0.5">';
    for ($star = 1; $star <= 5; $star++) {
        $html .= '<span class="'.$sizeClass.'" style="color: '.($star <= round($rating) ? '#F9C74F' : '#D8E8EC').'">★</span>';
    }
    return $html.'</div>';
}

/** Compact "★ 4.7" rating. */
function ratingBadge(float $rating): string
{
    return '<div class="flex gap-0.5 items-center"><span class="text-xs" style="color: #F9C74F">★</span><span class="text-xs font-bold" style="color: #264653">'.number_format($rating, 1).'</span></div>';
}

/** Coloured reading-level pill. */
function levelBadge(string $level, bool $short = true, string $class = 'text-[9px] font-bold px-1.5 py-0.5'): string
{
    $colors = levelColors($level);
    return '<span class="'.$class.' rounded-full" style="background-color: '.$colors['bg'].'; color: '.$colors['text'].'">'.e($short ? shortLevel($level) : $level).'</span>';
}

/** Coloured genre pill (tinted background). */
function genreTag(string $genre, string $class = 'text-[9px] font-medium px-1.5 py-0.5'): string
{
    $color = genreColor($genre);
    return '<span class="'.$class.' rounded-full" style="background-color: '.$color.'18; color: '.$color.'">'.e($genre).'</span>';
}
