// Service Worker - background.js
// Manages state, stores captured content grouped by course/module,
// and handles Markdown export optimised for NotebookLM.

const SNAPSHOT_KEY = 'courseSnapshots';
const MAX_SNAPSHOTS = 5;
let captureWriteChain = Promise.resolve();

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(data);
    });
  });
}

function storageSet(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function setCoursesWithVerification(courses) {
  await storageSet({ courses });
  const check = await storageGet(['courses']);
  const saved = check.courses;
  if (!saved || typeof saved !== 'object') {
    throw new Error('Failed to verify saved content.');
  }

  const expectedCount = Object.keys(courses).length;
  const actualCount = Object.keys(saved).length;
  if (expectedCount !== actualCount) {
    throw new Error('Saved content validation failed.');
  }
}

function getSnapshotMeta(snapshot) {
  const courses = snapshot.courses || {};
  const courseCount = Object.keys(courses).length;
  const moduleCount = Object.values(courses)
    .reduce((sum, c) => sum + Object.keys(c.modules || {}).length, 0);
  return { courseCount, moduleCount };
}

async function createSnapshot(label, courses) {
  const store = await storageGet([SNAPSHOT_KEY]);
  const list = Array.isArray(store[SNAPSHOT_KEY]) ? store[SNAPSHOT_KEY] : [];
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    createdAt: new Date().toISOString(),
    courses,
  };

  const next = [...list, snapshot].slice(-MAX_SNAPSHOTS);
  await storageSet({ [SNAPSHOT_KEY]: next });
  return snapshot;
}

async function restoreLastSnapshot() {
  const store = await storageGet([SNAPSHOT_KEY]);
  const list = Array.isArray(store[SNAPSHOT_KEY]) ? store[SNAPSHOT_KEY] : [];
  if (list.length === 0) {
    throw new Error('No snapshot available for recovery.');
  }

  const last = list[list.length - 1];
  const snapshotCourses = last.courses && typeof last.courses === 'object'
    ? last.courses
    : {};
  await setCoursesWithVerification(snapshotCourses);
  updateBadgeFromStorage();
  return { restoredAt: last.createdAt, ...getSnapshotMeta(last) };
}

function enqueueCaptureWrite(work) {
  captureWriteChain = captureWriteChain.then(work, work);
  return captureWriteChain;
}

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
    lines.push(`**Type:** ${mod.moduleType} | **Captured at:** ${getModuleCapturedAt(mod)}\n`);
    lines.push(getModuleContent(mod));
    if (i < entries.length - 1) lines.push('\n---\n');
  });

  return lines.join('\n');
}

/**
 * Downloads text content using a data: URL.
 * Uses encodeURIComponent to safely encode the content.
 * Returns a Promise that resolves on success or rejects on failure.
 */
function downloadText(content, filename, mimeType = 'text/plain;charset=utf-8', saveAs = true) {
  return new Promise((resolve, reject) => {
    if (!chrome.downloads || typeof chrome.downloads.download !== 'function') {
      reject('Downloads API is not available in this extension context.');
      return;
    }

    const base64 = btoa(unescape(encodeURIComponent(content)));
    const url = `data:${mimeType};base64,` + base64;
    chrome.downloads.download({ url, filename, saveAs }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(downloadId);
      }
    });
  });
}

/**
 * Merges new content into existing content without duplicating paragraphs.
 * Splits both texts into blocks (separated by double newline), then appends
 * only blocks from `newContent` that don't already appear in `existing`.
 */
function mergeContent(existing, newContent) {
  if (!existing) return newContent;
  if (!newContent) return existing;

  const existingBlocks = existing.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const newBlocks = newContent.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const existingSet = new Set(existingBlocks);

  const additions = newBlocks.filter((b) => !existingSet.has(b));
  if (additions.length === 0) return existing;

  return existing + '\n\n' + additions.join('\n\n');
}

/**
 * Returns true if the module uses the sub-page storage format (lessons).
 */
function hasSubPages(mod) {
  return mod && typeof mod.subPages === 'object' && mod.subPages !== null;
}

/**
 * Migrates a legacy lesson module (flat content string + _capturedUrls)
 * to the new subPages format. Non-lesson modules are returned as-is.
 */
function migrateLegacyModule(mod) {
  if (hasSubPages(mod)) return mod;
  if (mod.moduleType !== 'lesson') return mod;

  // Best-effort migration: put all existing content under a single '_legacy' sub-page
  // since we can't retroactively split the concatenated string by pageid.
  const migrated = {
    moduleName: mod.moduleName,
    moduleType: mod.moduleType,
    subPages: {
      _legacy: {
        content: mod.content || '',
        capturedAt: mod.capturedAt || null,
        order: 0,
      },
    },
  };
  // Carry over captured URLs so old pages aren't re-merged into _legacy
  if (mod._capturedUrls) {
    migrated._legacyCapturedUrls = mod._capturedUrls;
  }
  return migrated;
}

/**
 * Composes the final content string for a module, handling both
 * the subPages format (lessons) and the flat content format.
 */
function getModuleContent(mod) {
  if (hasSubPages(mod)) {
    const pages = Object.values(mod.subPages)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return pages.map((p) => p.content).filter(Boolean).join('\n\n---\n\n');
  }
  return mod.content || '';
}

/**
 * Returns the latest capturedAt timestamp for a module.
 */
function getModuleCapturedAt(mod) {
  if (hasSubPages(mod)) {
    const pages = Object.values(mod.subPages);
    if (pages.length === 0) return 'N/A';
    return pages.reduce((latest, p) =>
      (p.capturedAt || '') > (latest || '') ? p.capturedAt : latest, null) || 'N/A';
  }
  return mod.capturedAt || 'N/A';
}

/**
 * Updates the extension badge with the total module count.
 */
function updateBadgeFromStorage() {
  chrome.storage.local.get(['isCapturing', 'courses'], (data) => {
    if (!chrome.action) return;
    if (data.isCapturing) {
      const courses = data.courses || {};
      const total = Object.values(courses).reduce((sum, c) => sum + Object.keys(c.modules).length, 0);
      chrome.action.setBadgeText({ text: total > 0 ? String(total) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#4ecca3' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  // --- Store captured content (course → module) ---
  if (message.type === 'contentCaptured') {
    enqueueCaptureWrite(async () => {
      const p = message.payload;
      const moduleKey = p.normalizedUrl || p.url;
      const isLesson = p.pageId !== null && p.pageId !== undefined;
      const data = await storageGet(['courses']);
      const courses = data.courses || {};

      if (!courses[p.courseId]) {
        courses[p.courseId] = { name: p.courseName, modules: {} };
      } else if (p.courseName !== 'Unknown Course' && courses[p.courseId].name === 'Unknown Course') {
        courses[p.courseId].name = p.courseName;
      }

      let mod = courses[p.courseId].modules[moduleKey];

      if (isLesson) {
        // --- Lesson sub-page storage ---
        if (mod) {
          mod = migrateLegacyModule(mod);
          courses[p.courseId].modules[moduleKey] = mod;
        }

        if (!mod) {
          // First sub-page of a new lesson
          courses[p.courseId].modules[moduleKey] = {
            moduleName: p.moduleName,
            moduleType: p.moduleType,
            subPages: {
              [p.pageId]: { content: p.content, capturedAt: p.capturedAt, order: 0 },
            },
          };
        } else {
          const existingPage = mod.subPages[p.pageId];
          if (existingPage) {
            // Sub-page already captured — merge only new content blocks
            existingPage.content = mergeContent(existingPage.content, p.content);
            existingPage.capturedAt = p.capturedAt;
          } else {
            // New sub-page — determine next order value
            const maxOrder = Object.values(mod.subPages)
              .reduce((m, sp) => Math.max(m, sp.order || 0), -1);
            mod.subPages[p.pageId] = {
              content: p.content,
              capturedAt: p.capturedAt,
              order: maxOrder + 1,
            };
          }
        }
      } else {
        // --- Non-lesson module (simple storage) ---
        if (mod && mod._capturedUrls && mod._capturedUrls.includes(p.url)) {
          sendResponse({ success: true, skipped: true });
          return;
        }
        if (mod) {
          mod.content += '\n\n---\n\n' + p.content;
          mod.capturedAt = p.capturedAt;
          if (!mod._capturedUrls) mod._capturedUrls = [];
          mod._capturedUrls.push(p.url);
        } else {
          courses[p.courseId].modules[moduleKey] = {
            moduleName: p.moduleName,
            moduleType: p.moduleType,
            content: p.content,
            capturedAt: p.capturedAt,
            _capturedUrls: [p.url],
          };
        }
      }

      await setCoursesWithVerification(courses);
      updateBadgeFromStorage();
      sendResponse({ success: true });
    }).catch((err) => {
      sendResponse({ success: false, error: String(err.message || err) });
    });
    return true;
  }

  // --- Export a single course as Markdown ---
  if (message.type === 'exportCourse') {
    chrome.storage.local.get(['courses'], async (data) => {
      try {
        const courses = data.courses || {};
        const course = courses[message.courseId];
        if (!course || Object.keys(course.modules).length === 0) {
          sendResponse({ success: false, error: 'No content captured for this course.' });
          return;
        }
        const markdown = buildCourseMarkdown(course.name, course.modules);
        const filename = `${slugify(course.name)}.md`;
        await downloadText(markdown, filename, 'text/markdown;charset=utf-8', true);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    });
    return true;
  }

  // --- Export all courses (one file each) ---
  if (message.type === 'exportAll') {
    chrome.storage.local.get(['courses'], async (data) => {
      try {
        const courses = data.courses || {};
        const ids = Object.keys(courses);
        if (ids.length === 0) {
          sendResponse({ success: false, error: 'No courses captured.' });
          return;
        }
        let exported = 0;
        for (const id of ids) {
          const c = courses[id];
          if (Object.keys(c.modules).length === 0) continue;
          const markdown = buildCourseMarkdown(c.name, c.modules);
          const filename = `${slugify(c.name)}.md`;
          await downloadText(markdown, filename, 'text/markdown;charset=utf-8', false);
          exported++;
        }
        sendResponse({ success: true, count: exported });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
    });
    return true;
  }

  // --- Clear a single course ---
  if (message.type === 'clearCourse') {
    (async () => {
      try {
        const data = await storageGet(['courses']);
        const courses = data.courses || {};
        await createSnapshot('before-clear-course', courses);
        delete courses[message.courseId];
        await setCoursesWithVerification(courses);
        updateBadgeFromStorage();
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }

  // --- Clear all data ---
  if (message.type === 'clearAll') {
    (async () => {
      try {
        const data = await storageGet(['courses']);
        const courses = data.courses || {};
        await createSnapshot('before-clear-all', courses);
        await storageSet({ courses: {}, isCapturing: false });
        updateBadgeFromStorage();
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }

  // --- Export raw backup JSON ---
  if (message.type === 'exportBackup') {
    (async () => {
      try {
        const data = await storageGet(['courses', 'moodleBaseUrl', 'isCapturing', SNAPSHOT_KEY]);
        const payload = {
          version: 1,
          exportedAt: new Date().toISOString(),
          moodleBaseUrl: data.moodleBaseUrl || '',
          isCapturing: !!data.isCapturing,
          courses: data.courses || {},
          snapshots: Array.isArray(data[SNAPSHOT_KEY]) ? data[SNAPSHOT_KEY] : [],
        };

        const json = JSON.stringify(payload, null, 2);
        const dateTag = new Date().toISOString().split('T')[0];
        await downloadText(json, `moodle-backup-${dateTag}.json`, 'application/json;charset=utf-8', true);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }

  // --- Import backup JSON ---
  if (message.type === 'importBackup') {
    (async () => {
      try {
        const raw = message.backupJson;
        if (!raw || typeof raw !== 'string') {
          throw new Error('Invalid backup file.');
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.courses !== 'object') {
          throw new Error('Backup file is missing courses data.');
        }

        const current = await storageGet(['courses']);
        await createSnapshot('before-import-backup', current.courses || {});
        await setCoursesWithVerification(parsed.courses || {});
        await storageSet({
          moodleBaseUrl: parsed.moodleBaseUrl || '',
          isCapturing: !!parsed.isCapturing,
        });
        updateBadgeFromStorage();
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }

  // --- Restore latest snapshot ---
  if (message.type === 'restoreLastSnapshot') {
    (async () => {
      try {
        const result = await restoreLastSnapshot();
        sendResponse({ success: true, ...result });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }

  // --- Snapshot status ---
  if (message.type === 'getSnapshotStatus') {
    (async () => {
      try {
        const data = await storageGet([SNAPSHOT_KEY]);
        const list = Array.isArray(data[SNAPSHOT_KEY]) ? data[SNAPSHOT_KEY] : [];
        const last = list.length > 0 ? list[list.length - 1] : null;
        sendResponse({
          success: true,
          count: list.length,
          lastCreatedAt: last ? last.createdAt : null,
        });
      } catch (err) {
        sendResponse({ success: false, error: String(err.message || err) });
      }
    })();
    return true;
  }
});

// Inject content script into all existing tabs when isCapturing becomes true
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.isCapturing) return;
  if (!changes.isCapturing.newValue) return;

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ['content.js'],
        },
        (result) => {
          if (chrome.runtime.lastError) {
            console.debug(`Failed to inject in tab ${tab.id}:`, chrome.runtime.lastError.message);
          }
        }
      );
    });
  });
});

// Inject content script into new tabs if capture mode is enabled
chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get(['isCapturing'], (data) => {
    if (data.isCapturing) {
      setTimeout(() => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ['content.js'],
          },
          (result) => {
            if (chrome.runtime.lastError) {
              console.debug(`Failed to inject in new tab ${tab.id}:`, chrome.runtime.lastError.message);
            }
          }
        );
      }, 100);
    }
  });
});

// Initialise default state on install — merge, never overwrite existing data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['moodleBaseUrl', 'isCapturing', 'courses'], (data) => {
    const defaults = {};
    if (data.moodleBaseUrl === undefined) defaults.moodleBaseUrl = '';
    if (data.isCapturing === undefined) defaults.isCapturing = false;
    if (data.courses === undefined) defaults.courses = {};
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});
