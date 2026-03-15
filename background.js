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

  // --- Store captured content (course → module) ---
  if (message.type === 'contentCaptured') {
    const p = message.payload;
    const moduleKey = p.normalizedUrl || p.url;
    chrome.storage.local.get(['courses'], (data) => {
      const courses = data.courses || {};

      if (!courses[p.courseId]) {
        courses[p.courseId] = { name: p.courseName, modules: {} };
      }

      const existing = courses[p.courseId].modules[moduleKey];

      // Deduplicate by exact URL within the same module key
      if (existing && existing._capturedUrls && existing._capturedUrls.includes(p.url)) {
        sendResponse({ success: true, skipped: true });
        return;
      }

      if (existing) {
        // Append new sub-page content to existing module
        existing.content += '\n\n---\n\n' + p.content;
        existing.capturedAt = p.capturedAt;
        if (!existing._capturedUrls) existing._capturedUrls = [];
        existing._capturedUrls.push(p.url);
      } else {
        courses[p.courseId].modules[moduleKey] = {
          moduleName: p.moduleName,
          moduleType: p.moduleType,
          content: p.content,
          capturedAt: p.capturedAt,
          _capturedUrls: [p.url],
        };
      }

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

// Initialise default state on install — merge, never overwrite existing data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['moodleBaseUrl', 'courses', 'isCapturing'], (data) => {
    const defaults = {};
    if (data.moodleBaseUrl === undefined) defaults.moodleBaseUrl = '';
    if (data.courses === undefined) defaults.courses = {};
    if (data.isCapturing === undefined) defaults.isCapturing = false;
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});
