// Content script - content.js
// Extracts structured content from Moodle pages for NotebookLM export.

/**
 * Detects whether the current page is a Moodle page by checking for
 * common Moodle DOM signatures. Intentionally broad to support different
 * Moodle themes and versions without being brittle.
 */
function isMoodlePage() {
  const body = document.body;
  if (!body) return false;

  const signals = [
    () => body.id === 'page-wrapper' || body.classList.contains('path-mod') || body.classList.contains('path-course'),
    () => !!document.querySelector('#region-main, #page-content, .course-content'),
    () => !!document.querySelector('nav.breadcrumb, ol.breadcrumb, .breadcrumb-nav'),
    () => !!document.querySelector('footer#page-footer, .logininfo'),
  ];

  return signals.filter((fn) => fn()).length >= 2;
}

/**
 * Extracts course information from the Moodle breadcrumb.
 * The breadcrumb typically follows: Home > Course Name > Section > Activity.
 * Returns best-effort course name and ID; falls back gracefully.
 */
function extractCourseInfo() {
  const crumbs = document.querySelectorAll(
    'nav.breadcrumb li a, ol.breadcrumb li a, .breadcrumb-nav li a, nav[aria-label] ol li a'
  );

  let courseName = 'Unknown Course';
  let courseId = 'unknown';

  for (const crumb of crumbs) {
    const href = crumb.getAttribute('href') || '';
    const match = href.match(/\/course\/view\.php\?id=(\d+)/);
    if (match) {
      courseName = crumb.getAttribute('title')
        || crumb.textContent.trim()
        || courseName;
      courseId = match[1];
      break;
    }
  }

  return { courseName, courseId };
}

/**
 * Extracts module name and type from the current page.
 * Module type comes from the URL path (/mod/<type>/...).
 * Module name comes from the page heading or document title.
 */
function extractModuleInfo() {
  const url = window.location.href;

  const typeMatch = url.match(/\/mod\/(\w+)\//);
  const moduleType = typeMatch ? typeMatch[1] : 'page';

  // Prefer the last breadcrumb item (the current activity/module name)
  const lastCrumb = document.querySelector(
    'ol.breadcrumb li:last-child a, nav.breadcrumb li:last-child a, .breadcrumb-item:last-child a'
  );
  const heading = document.querySelector('.page-header-headings h1');

  const moduleName = (lastCrumb && lastCrumb.textContent.trim())
    || (heading && heading.textContent.trim())
    || document.title.replace(/:.+$/, '').trim()
    || 'Unnamed Module';

  return { moduleName, moduleType };
}

/**
 * Extracts the main text content from the Moodle page.
 * Keeps extraction generic to work across themes and content types.
 */
function extractContent() {
  const root = document.querySelector(
    '[role="main"], #region-main, .course-content, #page-content'
  ) || document.body;

  const parts = [];

  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const level = parseInt(el.tagName[1], 10);
    const text = el.textContent.trim();
    if (text) parts.push(`${'#'.repeat(level)} ${text}`);
  });

  root.querySelectorAll('p, .no-overflow, .text_to_html, .activity-description, .contentwithoutlink').forEach((el) => {
    const text = el.textContent.trim();
    if (text && text.length > 5) parts.push(text);
  });

  root.querySelectorAll('ul, ol').forEach((list) => {
    const ordered = list.tagName === 'OL';
    list.querySelectorAll(':scope > li').forEach((li, i) => {
      const text = li.textContent.trim();
      if (text) parts.push(ordered ? `${i + 1}. ${text}` : `- ${text}`);
    });
  });

  const videos = [];
  root.querySelectorAll('iframe[src], video source[src], a[href]').forEach((el) => {
    const src = el.getAttribute('src') || el.getAttribute('href') || '';
    if (/youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm/i.test(src)) {
      videos.push(src);
    }
  });
  if (videos.length > 0) {
    parts.push('\n### Videos');
    videos.forEach((v) => parts.push(`- [Video](${v})`));
  }

  const resources = [];
  root.querySelectorAll('a[href]').forEach((el) => {
    const href = el.getAttribute('href') || '';
    const text = el.textContent.trim();
    if (/\.pdf|\.docx?|\.pptx?|\.xlsx?|pluginfile\.php/i.test(href) && text) {
      resources.push({ text, href });
    }
  });
  if (resources.length > 0) {
    parts.push('\n### Resources');
    resources.forEach((r) => parts.push(`- [${r.text}](${r.href})`));
  }

  const deduped = parts.filter((line, i) => i === 0 || line !== parts[i - 1]);
  return deduped.join('\n\n');
}

/**
 * Main capture routine. Validates context, extracts structured data,
 * and sends it to the background service worker for storage.
 */
function capture() {
  if (!isMoodlePage()) return;

  chrome.storage.local.get(['moodleBaseUrl', 'isCapturing'], (data) => {
    if (!data.isCapturing) return;
    if (!data.moodleBaseUrl) return;

    const baseUrl = data.moodleBaseUrl.replace(/\/+$/, '');
    if (!window.location.href.startsWith(baseUrl)) return;

    const { courseName, courseId } = extractCourseInfo();
    const { moduleName, moduleType } = extractModuleInfo();
    const content = extractContent();

    if (!content || content.length < 20) return;

    const payload = {
      courseName,
      courseId,
      moduleName,
      moduleType,
      content,
      url: window.location.href,
      capturedAt: new Date().toISOString(),
    };

    chrome.runtime.sendMessage({ type: 'contentCaptured', payload });
  });
}

// Auto-capture on page load
capture();

// Respond to manual capture trigger from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'startCapture') {
    capture();
    sendResponse({ success: true });
    return true;
  }
});
