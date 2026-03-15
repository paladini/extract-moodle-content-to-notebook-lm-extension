// Popup UI logic - popup.js
// Controls the extension popup: URL config, capture toggle, course list, export/clear.

const $url = document.getElementById('moodle-url');
const $saveUrl = document.getElementById('btn-save-url');
const $capture = document.getElementById('btn-capture');
const $dot = document.getElementById('status-dot');
const $statusText = document.getElementById('status-text');
const $statusInfo = document.getElementById('status-info');
const $courseList = document.getElementById('course-list');
const $exportAll = document.getElementById('btn-export-all');
const $clearAll = document.getElementById('btn-clear-all');

// ─── Helpers ───

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function countModules(courses) {
  return Object.values(courses).reduce((sum, c) => sum + Object.keys(c.modules).length, 0);
}

function setCaptureUI(isCapturing) {
  $dot.className = `status-dot ${isCapturing ? 'capturing' : 'idle'}`;
  $statusText.textContent = isCapturing ? 'Capturing...' : 'Idle';
  $capture.textContent = isCapturing ? 'Stop Capture' : 'Start Capture';
  $capture.classList.toggle('active', isCapturing);
}

// ─── Render course list ───

function renderCourses(courses) {
  const ids = Object.keys(courses);

  if (ids.length === 0) {
    $courseList.innerHTML = '<div class="empty-state">No courses captured yet.</div>';
    $exportAll.disabled = true;
    $clearAll.disabled = true;
    return;
  }

  $exportAll.disabled = false;
  $clearAll.disabled = false;

  $courseList.innerHTML = ids.map((id) => {
    const c = courses[id];
    const n = Object.keys(c.modules).length;
    return `
      <div class="course-item">
        <span class="course-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="course-badge">${n} module${n !== 1 ? 's' : ''}</span>
        <div class="course-actions">
          <button class="btn-export-course" data-id="${id}">Export</button>
          <button class="btn-clear-course" data-id="${id}">Clear</button>
        </div>
      </div>`;
  }).join('');

  $courseList.querySelectorAll('.btn-export-course').forEach((btn) => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'exportCourse', courseId: btn.dataset.id });
    });
  });

  $courseList.querySelectorAll('.btn-clear-course').forEach((btn) => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'clearCourse', courseId: btn.dataset.id }, () => {
        refreshUI();
      });
    });
  });

  const total = countModules(courses);
  $statusInfo.textContent = `${total} module${total !== 1 ? 's' : ''} total`;
}

// ─── Refresh full UI from storage ───

function refreshUI() {
  chrome.storage.local.get(['moodleBaseUrl', 'isCapturing', 'courses'], (data) => {
    $url.value = data.moodleBaseUrl || '';
    $capture.disabled = !data.moodleBaseUrl;
    setCaptureUI(!!data.isCapturing);
    renderCourses(data.courses || {});
  });
}

// ─── Event listeners ───

$saveUrl.addEventListener('click', () => {
  const url = $url.value.trim().replace(/\/+$/, '');
  if (!url) return;
  chrome.storage.local.set({ moodleBaseUrl: url }, () => {
    refreshUI();
  });
});

$capture.addEventListener('click', () => {
  chrome.storage.local.get(['isCapturing'], (data) => {
    const newState = !data.isCapturing;
    chrome.storage.local.set({ isCapturing: newState }, () => {
      setCaptureUI(newState);
      if (newState) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { type: 'startCapture' }).catch(() => {
              // Content script not injected yet — inject and run capture
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
              }).catch(() => {});
            });
          }
        });
      }
    });
  });
});

$exportAll.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'exportAll' });
});

$clearAll.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'clearAll' }, () => {
    refreshUI();
  });
});

// ─── Init ───
refreshUI();
