// Service Worker - background.js
// Manages state, stores captured content grouped by course/module,
// and handles Markdown export optimised for NotebookLM.

/**
 * Converts a course name into a filename-safe slug.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Builds a NotebookLM-friendly Markdown string for a single course.
 *
 * Structure:
 *   # Course Name
 *   ## Module: <module name>
 *   **Type:** <type> | **Captured at:** <date>
 *   <content>
 *   ---
 */
function buildCourseMarkdown(courseName, modules) {
  const entries = Object.values(modules);
  if (entries.length === 0) return '';

  const lines = [`# ${courseName}\n`];

  entries.forEach((mod, i) => {
    lines.push(`## Module: ${mod.moduleName}`);
    lines.push(`**Type:** ${mod.moduleType} | **Captured at:** ${mod.capturedAt || 'N/A'}\n`);
    lines.push(mod.content);
    if (i < entries.length - 1) lines.push('\n---\n');
  });

  return lines.join('\n');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  // --- Toggle capture state ---
  if (message.type === 'toggleCapture') {
    const isCapturing = message.isCapturing;
    chrome.storage.local.set({ isCapturing }, () => {
      if (isCapturing) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'startCapture' });
          }
        });
      }
      sendResponse({ success: true, isCapturing });
    });
    return true;
  }

  // --- Save Moodle base URL ---
  if (message.type === 'setMoodleBaseUrl') {
    const url = (message.url || '').replace(/\/+$/, '');
    chrome.storage.local.set({ moodleBaseUrl: url }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // --- Store captured content (course → module) ---
  if (message.type === 'contentCaptured') {
    const p = message.payload;
    chrome.storage.local.get(['courses'], (data) => {
      const courses = data.courses || {};

      if (!courses[p.courseId]) {
        courses[p.courseId] = { name: p.courseName, modules: {} };
      }

      // Deduplicate by URL
      if (courses[p.courseId].modules[p.url]) {
        sendResponse({ success: true, skipped: true });
        return;
      }

      courses[p.courseId].modules[p.url] = {
        moduleName: p.moduleName,
        moduleType: p.moduleType,
        content: p.content,
        capturedAt: p.capturedAt,
      };

      chrome.storage.local.set({ courses }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // --- Export a single course as Markdown ---
  if (message.type === 'exportCourse') {
    chrome.storage.local.get(['courses'], (data) => {
      const courses = data.courses || {};
      const course = courses[message.courseId];
      if (!course || Object.keys(course.modules).length === 0) {
        sendResponse({ success: false, error: 'No content captured for this course.' });
        return;
      }

      const markdown = buildCourseMarkdown(course.name, course.modules);
      const filename = `${slugify(course.name)}.md`;
      const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);

      chrome.downloads.download({ url: dataUrl, filename, saveAs: true });
      sendResponse({ success: true });
    });
    return true;
  }

  // --- Export all courses (one file each) ---
  if (message.type === 'exportAll') {
    chrome.storage.local.get(['courses'], (data) => {
      const courses = data.courses || {};
      const ids = Object.keys(courses);
      if (ids.length === 0) {
        sendResponse({ success: false, error: 'No courses captured.' });
        return;
      }

      ids.forEach((id) => {
        const c = courses[id];
        if (Object.keys(c.modules).length === 0) return;
        const markdown = buildCourseMarkdown(c.name, c.modules);
        const filename = `${slugify(c.name)}.md`;
        const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
        chrome.downloads.download({ url: dataUrl, filename, saveAs: false });
      });

      sendResponse({ success: true, count: ids.length });
    });
    return true;
  }

  // --- Clear a single course ---
  if (message.type === 'clearCourse') {
    chrome.storage.local.get(['courses'], (data) => {
      const courses = data.courses || {};
      delete courses[message.courseId];
      chrome.storage.local.set({ courses }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // --- Clear all data ---
  if (message.type === 'clearAll') {
    chrome.storage.local.set({ courses: {}, isCapturing: false }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Initialise default state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['moodleBaseUrl'], (data) => {
    chrome.storage.local.set({
      isCapturing: false,
      courses: {},
      moodleBaseUrl: data.moodleBaseUrl || '',
    });
  });
});
