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
 * Normalises the current page URL for deduplication purposes.
 * Moodle lessons (/mod/lesson/) use pageid to navigate sub-pages within the
 * same activity. Stripping pageid groups all sub-pages under one module key.
 */
function normalizeModuleUrl(url) {
  try {
    const u = new URL(url);
    if (u.pathname.includes('/mod/lesson/')) {
      u.searchParams.delete('pageid');
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Returns true if the current page is a course overview / section listing page
 * (e.g. /course/view.php or /course/section.php). These pages just list
 * activities and don't contain actual lesson content worth capturing.
 */
function isCourseOverviewPage() {
  const path = window.location.pathname;
  return /\/course\/(view|section)\.php/.test(path);
}

/**
 * Selects the best content root element using priority-based lookup.
 * Prefers [role="main"] (narrowest) over #region-main (includes noise).
 */
function findContentRoot() {
  return document.querySelector('[role="main"]')
    || document.querySelector('#region-main')
    || document.querySelector('.course-content')
    || document.querySelector('#page-content')
    || document.body;
}

/**
 * Noise selectors to strip from the content root before extraction.
 * These elements contain UI chrome, navigation, metadata, and sidebar
 * content that pollutes the extracted Markdown.
 */
const NOISE_SELECTORS = [
  '.courseindex',
  '.drawer',
  '.activity-header',
  '.activity-navigation',
  '.completion-info',
  '.activity-information',
  '#page-navbar',
  '.breadcrumb',
  '.navbar',
  '.footer',
  '#page-footer',
  '.popover-region',
  '.usermenu',
  '.logininfo',
  '.learningtools-action-info',
  '[data-region="drawer"]',
  '[data-region="fixed-drawer"]',
  '.tertiary-navigation',
  '.lessonbutton',
].join(', ');

/**
 * Clones the content root and removes noise elements so that only
 * meaningful content is left for text extraction.
 */
function getCleanRoot() {
  const root = findContentRoot();
  const clone = root.cloneNode(true);
  clone.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove());
  return clone;
}

/**
 * Post-processes extracted text lines: trims whitespace, removes
 * near-empty lines, deduplicates consecutive identical lines,
 * and collapses excessive blank lines.
 */
function cleanLines(parts) {
  return parts
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 3)
    .filter((line, i, arr) => i === 0 || line !== arr[i - 1]);
}

/**
 * Extracts quiz/questionnaire content from Moodle lesson question pages.
 * Detects multichoice forms, extracts the question text, answer options,
 * and marks which answers the user selected.
 * Returns a Markdown string or empty string if no quiz is found.
 */
function extractQuizContent() {
  const root = findContentRoot();

  const parts = [];

  // --- Lesson question pages (multichoice) ---
  const answerOptions = root.querySelectorAll('.answeroption');
  if (answerOptions.length > 0) {
    const questionContainer = root.querySelector('#id_pageheadercontainer .contents .no-overflow, #id_pageheadercontainer .contents');
    if (questionContainer) {
      const questionText = questionContainer.textContent.trim();
      if (questionText) {
        parts.push('### Questão');
        parts.push(questionText);
      }
    }

    const isMultiAnswer = !!root.querySelector(
      'input[name*="_qf__lesson_display_answer_form_multichoice_multianswer"]'
    );
    const isSingleAnswer = !isMultiAnswer && !!root.querySelector(
      'input[name*="_qf__lesson_display_answer_form_multichoice_singleanswer"], .answeroption input[type="radio"]'
    );

    if (isMultiAnswer) {
      parts.push('**Tipo:** Múltipla escolha (múltiplas respostas)');
    } else if (isSingleAnswer) {
      parts.push('**Tipo:** Múltipla escolha (resposta única)');
    } else {
      parts.push('**Tipo:** Questão');
    }

    parts.push('');
    answerOptions.forEach((opt) => {
      const input = opt.querySelector('input[type="checkbox"], input[type="radio"]');
      const label = opt.querySelector('label');
      if (!label) return;
      const text = label.textContent.trim();
      if (!text) return;

      const isSelected = input && (
        input.checked
        || input.getAttribute('data-initial-value') === '1'
        || input.value === '1' && input.hasAttribute('data-initial-value')
      );
      parts.push(isSelected ? `- [x] ${text}` : `- [ ] ${text}`);
    });
  }

  // --- Lesson end-of-lesson page (score) ---
  const endHeading = root.querySelector('h2');
  if (endHeading && /fim desta li[çc][ãa]o|end of lesson/i.test(endHeading.textContent)) {
    const scoreBox = root.querySelector('.generalbox .center, .generalbox .box');
    if (scoreBox) {
      const scoreText = scoreBox.textContent.trim();
      if (scoreText) {
        parts.push('### Resultado da Lição');
        parts.push(scoreText);
      }
    }
  }

  // --- Lesson feedback/response pages ---
  const responseEl = root.querySelector('.response, .feedback, .correctanswer');
  if (responseEl) {
    const responseText = responseEl.textContent.trim();
    if (responseText) {
      parts.push('### Feedback');
      parts.push(responseText);
    }
  }

  return parts.join('\n');
}

/**
 * Extracts the main text content from the Moodle page.
 * Keeps extraction generic to work across themes and content types.
 */
function extractContent() {
  const root = getCleanRoot();

  const parts = [];

  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const level = parseInt(el.tagName[1], 10);
    const text = el.textContent.trim();
    if (text) parts.push(`${'#'.repeat(level)} ${text}`);
  });

  root.querySelectorAll('p, .no-overflow, .text_to_html, .contentwithoutlink').forEach((el) => {
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

  return cleanLines(parts).join('\n\n');
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

    // Skip course overview/section pages — they list activities, not content
    if (isCourseOverviewPage()) return;

    const { courseName, courseId } = extractCourseInfo();
    const { moduleName, moduleType } = extractModuleInfo();
    const genericContent = extractContent();
    const quizContent = extractQuizContent();

    const contentParts = [genericContent, quizContent].filter(Boolean);
    const content = contentParts.join('\n\n');

    if (!content || content.length < 20) return;

    const payload = {
      courseName,
      courseId,
      moduleName,
      moduleType,
      content,
      url: window.location.href,
      normalizedUrl: normalizeModuleUrl(window.location.href),
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

// React to capture being enabled — no message needed
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.isCapturing && changes.isCapturing.newValue === true) {
    capture();
  }
});
