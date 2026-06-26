export function getUploadHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bulk Upload - RadioPlay</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: #1a1b2e; color: #e0e0e0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
.container { width: 100%; max-width: 720px; }
h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; color: #fff; }
p.desc { color: #888; margin-bottom: 24px; font-size: 14px; }
#dropZone { border: 2px dashed #3a3b5e; border-radius: 12px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all .2s; background: #222340; }
#dropZone:hover, #dropZone.dragover { border-color: #6c5ce7; background: #2a2b4e; }
#dropZone.has-files { border-color: #6c5ce7; padding: 24px; }
#dropZone .icon { font-size: 48px; color: #6c5ce7; margin-bottom: 12px; }
#dropZone .main-text { font-size: 16px; color: #ccc; }
#dropZone .sub-text { font-size: 13px; color: #666; margin-top: 6px; }
#dropZone input[type=file] { display: none; }
#fileList { margin-top: 20px; display: none; }
#fileList.visible { display: block; }
.file-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #222340; border-radius: 8px; margin-bottom: 6px; border: 1px solid #2a2b4e; }
.file-item .name { flex: 1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-item .size { color: #666; font-size: 12px; margin: 0 12px; white-space: nowrap; }
.file-item .status { font-size: 12px; font-weight: 500; min-width: 60px; text-align: right; }
.file-item .status.pending { color: #888; }
.file-item .status.uploading { color: #6c5ce7; }
.file-item .status.done { color: #00b894; }
.file-item .status.skipped { color: #fdcb6e; }
.file-item .status.error { color: #e17055; }
.file-item .remove-btn { background: none; border: none; color: #e17055; cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; }
#uploadBtn { display: none; width: 100%; padding: 14px; margin-top: 20px; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background .2s; }
#uploadBtn.visible { display: block; }
#uploadBtn:hover { background: #5a4bd1; }
#uploadBtn:disabled { opacity: .5; cursor: not-allowed; }
#summary { display: none; margin-top: 20px; padding: 16px; border-radius: 8px; font-size: 14px; }
#summary.visible { display: block; }
#summary.success { background: #003d2e; border: 1px solid #00b894; color: #55efc4; }
#summary.partial { background: #3d2e00; border: 1px solid #fdcb6e; color: #ffeaa7; }
#summary.error { background: #3d0000; border: 1px solid #e17055; color: #fab1a0; }
#summary .count { font-weight: 600; font-size: 18px; }
.back-link { margin-top: 24px; }
.back-link a { color: #6c5ce7; text-decoration: none; font-size: 14px; }
.back-link a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
<h1>Upload Tracks</h1>
<p class="desc">Drag & drop audio files, or click to select. Supported: MP3, WAV, OGG, AAC, FLAC, M4A</p>

<div id="dropZone">
  <div class="icon">&#9835;</div>
  <div class="main-text">Drop audio files here</div>
  <div class="sub-text">or click to browse</div>
  <input type="file" id="fileInput" multiple accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,audio/*">
</div>

<div id="fileList"></div>

<button id="uploadBtn">Upload <span id="fileCount"></span> file(s)</button>

<div id="summary"></div>

<div class="back-link"><a href="/admin">&larr; Back to Admin</a></div>
</div>

<script>
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const fileCount = document.getElementById('fileCount');
const summary = document.getElementById('summary');
let files = [];

function formatSize(bytes) {
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderFiles() {
  if (!files.length) {
    fileList.classList.remove('visible');
    uploadBtn.classList.remove('visible');
    dropZone.classList.remove('has-files');
    return;
  }
  dropZone.classList.add('has-files');
  fileList.classList.add('visible');
  fileList.innerHTML = files.map((f, i) => {
    const statusClass = f.status || 'pending';
    const statusText = f.statusText || 'Pending';
    return '<div class="file-item" data-index="' + i + '">' +
      '<span class="name" title="' + f.file.name + '">' + f.file.name + '</span>' +
      '<span class="size">' + formatSize(f.file.size) + '</span>' +
      '<span class="status ' + statusClass + '">' + statusText + '</span>' +
      (f.status === 'pending' ? '<button class="remove-btn" onclick="removeFile(' + i + ')">&times;</button>' : '') +
    '</div>';
  }).join('');
  const pending = files.filter(f => f.status === 'pending').length;
  if (pending > 0) {
    uploadBtn.classList.add('visible');
    fileCount.textContent = pending;
    uploadBtn.disabled = false;
  } else {
    uploadBtn.disabled = true;
  }
}

function removeFile(index) {
  files.splice(index, 1);
  renderFiles();
}

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  addFiles(Array.from(e.dataTransfer.files));
});

fileInput.addEventListener('change', () => {
  addFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

function addFiles(newFiles) {
  const audioFiles = newFiles.filter(f => /^audio\//.test(f.type) ||
    /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(f.name));
  for (const f of audioFiles) {
    if (!files.some(ex => ex.file.name === f.name && ex.file.size === f.size)) {
      files.push({ file: f, status: 'pending', statusText: 'Pending' });
    }
  }
  renderFiles();
}

uploadBtn.addEventListener('click', async () => {
  const pending = files.filter(f => f.status === 'pending');
  if (!pending.length) return;

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  summary.classList.remove('visible', 'success', 'partial', 'error');

  const formData = new FormData();
  for (const p of pending) {
    formData.append('audio', p.file);
    p.status = 'uploading';
    p.statusText = 'Uploading...';
  }
  renderFiles();

  try {
    const res = await fetch('/api/tracks/bulk', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    let idx = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'uploading') {
        if (idx < data.success) {
          files[i].status = 'done';
          files[i].statusText = 'Imported';
        } else if (idx < data.success + data.skipped) {
          files[i].status = 'skipped';
          files[i].statusText = 'Duplicate';
        } else {
          const errIdx = idx - data.success - data.skipped;
          files[i].status = 'error';
          files[i].statusText = 'Error';
        }
        idx++;
      }
    }
    renderFiles();

    const total = data.success + data.skipped + data.errors.length;
    let cls = 'success';
    let msg = '<span class="count">' + data.success + '</span> file(s) imported successfully';
    if (data.skipped > 0) { cls = 'partial'; msg += ', <span class="count">' + data.skipped + '</span> skipped (duplicates)'; }
    if (data.errors.length > 0) { cls = 'partial'; msg += ', <span class="count">' + data.errors.length + '</span> error(s)'; }
    if (data.errors.length === total) cls = 'error';
    summary.className = 'visible ' + cls;
    summary.innerHTML = msg;
  } catch (err) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'uploading') {
        files[i].status = 'error';
        files[i].statusText = 'Error';
      }
    }
    renderFiles();
    summary.className = 'visible error';
    summary.innerHTML = 'Upload failed: ' + err.message;
  }

  uploadBtn.textContent = 'Done';
});
</script>
</body>
</html>`;
}
