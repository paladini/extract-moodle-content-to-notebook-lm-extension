// Popup UI logic - popup.js
// Controls the extension popup: URL config, capture toggle, course list, export/clear.

const $url = document.getElementById('moodle-url');
const $saveUrl = document.getElementById('btn-save-url');
const $urlValidation = document.getElementById('url-validation');
const $capture = document.getElementById('btn-capture');
const $captureHint = document.getElementById('capture-hint');
const $dot = document.getElementById('status-dot');
const $statusText = document.getElementById('status-text');
const $statusInfo = document.getElementById('status-info');
const $courseList = document.getElementById('course-list');
const $exportAll = document.getElementById('btn-export-all');
const $clearAll = document.getElementById('btn-clear-all');
const $toastContainer = document.getElementById('toast-container');
const $confirmOverlay = document.getElementById('confirm-overlay');
const $confirmMsg = document.getElementById('confirm-msg');
const $confirmYes = document.getElementById('btn-confirm-yes');
const $confirmNo = document.getElementById('btn-confirm-no');
const $storageWarning = document.getElementById('storage-warning');

// ─── Helpers ───

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function countModules(courses) {
  return Object.values(courses).reduce((sum, c) => sum + Object.keys(c.modules).length, 0);
}

// ─── Toast notifications ───

function showToast(message, type = 'info', duration = 2500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  $toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.2s ease-in forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ─── Confirmation dialog ───

let _confirmResolve = null;

function showConfirm(message) {
  return new Promise((resolve) => {
    $confirmMsg.textContent = message;
    $confirmOverlay.classList.add('active');
    _confirmResolve = resolve;
  });
}

$confirmYes.addEventListener('click', () => {
  $confirmOverlay.classList.remove('active');
  if (_confirmResolve) _confirmResolve(true);
  _confirmResolve = null;
});

$confirmNo.addEventListener('click', () => {
  $confirmOverlay.classList.remove('active');
  if (_confirmResolve) _confirmResolve(false);
  _confirmResolve = null;
});

// ─── URL validation ───

function validateUrl(raw) {
  let url = raw.trim().replace(/\/+$/, '');
  if (!url) return { valid: false, error: 'Please enter a URL.' };
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.')) {
      return { valid: false, error: 'Invalid hostname.' };
    }
    return { valid: true, url: parsed.origin + parsed.pathname.replace(/\/+$/, '') };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

function showUrlMessage(text, type) {
  $urlValidation.textContent = text;
  $urlValidation.className = `validation-msg ${type}`;
  if (type === 'success') {
    setTimeout(() => { $urlValidation.textContent = ''; }, 2000);
  }
}

// ─── Storage quota check ───

function checkStorageQuota() {
  chrome.storage.local.getBytesInUse(null, (bytes) => {
    const limit = 10 * 1024 * 1024;
    const pct = Math.round((bytes / limit) * 100);
    if (pct >= 80) {
      $storageWarning.textContent = `Storage ${pct}% full (${(bytes / 1024 / 1024).toFixed(1)} MB / 10 MB). Export and clear courses to free space.`;
      $storageWarning.classList.add('visible');
    } else {
      $storageWarning.classList.remove('visible');
    }
  });
}

// ─── Badge ───

function updateBadge(isCapturing, courses) {
  if (!chrome.action) return;
  if (isCapturing) {
    const total = countModules(courses);
    chrome.action.setBadgeText({ text: total > 0 ? String(total) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#4ecca3' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Capture UI ───

function setCaptureUI(isCapturing, hasMoodleUrl) {
  $dot.className = `status-dot ${isCapturing ? 'capturing' : 'idle'}`;
  $statusText.textContent = isCapturing ? 'Capturing...' : 'Idle';
  $capture.textContent = isCapturing ? 'Stop Capture' : 'Start Capture';
  $capture.classList.toggle('active', isCapturing);
  $capture.disabled = !hasMoodleUrl;
  $captureHint.textContent = hasMoodleUrl ? '' : 'Set your Moodle URL above to enable capture.';
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
    const moduleEntries = Object.values(c.modules);
    const previewHtml = moduleEntries.map((mod) => {
      const snippet = escapeHtml((mod.content || '').substring(0, 200));
      return `<div class="preview-module">
        <div class="preview-module-name">${escapeHtml(mod.moduleName)}</div>
        <div class="preview-module-content">${snippet}${mod.content.length > 200 ? '...' : ''}</div>
      </div>`;
    }).join('');
    return `
      <div class="course-item-wrapper">
        <div class="course-item">
          <span class="course-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
          <span class="course-badge">${n} module${n !== 1 ? 's' : ''}</span>
          <div class="course-actions">
            <button class="btn-preview-course" data-id="${id}" title="Preview content">Preview</button>
            <button class="btn-export-course" data-id="${id}">Export</button>
            <button class="btn-clear-course" data-id="${id}" data-name="${escapeHtml(c.name)}">Clear</button>
          </div>
        </div>
        <div class="course-preview" data-preview-id="${id}">${previewHtml}</div>
      </div>`;
  }).join('');

  $courseList.querySelectorAll('.btn-preview-course').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = $courseList.querySelector(`.course-preview[data-preview-id="${btn.dataset.id}"]`);
      if (panel) panel.classList.toggle('open');
    });
  });

  $courseList.querySelectorAll('.btn-export-course').forEach((btn) => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'exportCourse', courseId: btn.dataset.id }, (resp) => {
        if (resp && resp.success) {
          showToast('Course exported successfully.', 'success');
        } else {
          showToast(resp?.error || 'Export failed.', 'error');
        }
      });
    });
  });

  $courseList.querySelectorAll('.btn-clear-course').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name || 'this course';
      const ok = await showConfirm(`Delete all captured data for "${name}"?`);
      if (!ok) return;
      chrome.runtime.sendMessage({ type: 'clearCourse', courseId: btn.dataset.id }, () => {
        showToast('Course cleared.', 'info');
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
    const hasMoodleUrl = !!data.moodleBaseUrl;
    $url.value = data.moodleBaseUrl || '';
    setCaptureUI(!!data.isCapturing, hasMoodleUrl);
    renderCourses(data.courses || {});
    updateBadge(!!data.isCapturing, data.courses || {});
    checkStorageQuota();
  });
}

// ─── Event listeners ───

function saveUrl() {
  const result = validateUrl($url.value);
  if (!result.valid) {
    showUrlMessage(result.error, 'error');
    return;
  }
  chrome.storage.local.set({ moodleBaseUrl: result.url }, () => {
    $url.value = result.url;
    showUrlMessage('Saved!', 'success');
    showToast('Moodle URL saved.', 'success');
    refreshUI();
  });
}

$saveUrl.addEventListener('click', saveUrl);

$url.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveUrl();
});

$capture.addEventListener('click', () => {
  chrome.storage.local.get(['isCapturing'], (data) => {
    const newState = !data.isCapturing;
    chrome.storage.local.set({ isCapturing: newState }, () => {
      refreshUI();
      if (newState) {
        showToast('Capture started. Browse your Moodle courses.', 'success');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { type: 'startCapture' }).catch(() => {
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
              }).catch((err) => {
                showToast('Could not inject into this tab. Navigate to Moodle first.', 'error');
              });
            });
          }
        });
      } else {
        showToast('Capture stopped.', 'info');
      }
    });
  });
});

$exportAll.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'exportAll' }, (resp) => {
    if (resp && resp.success) {
      showToast(`Exported ${resp.count} course(s).`, 'success');
    } else {
      showToast(resp?.error || 'Export failed.', 'error');
    }
  });
});

$clearAll.addEventListener('click', async () => {
  const ok = await showConfirm('Delete ALL captured courses? This cannot be undone.');
  if (!ok) return;
  chrome.runtime.sendMessage({ type: 'clearAll' }, () => {
    showToast('All data cleared.', 'info');
    refreshUI();
  });
});

// ─── Init ───
refreshUI();
