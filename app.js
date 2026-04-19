/* =============================================
   FaceID — App Logic
   Communicates with FastAPI backend via ngrok
   ============================================= */

// ── STATE ──────────────────────────────────────
const state = {
    serverUrl: '',
    selectedFile: null,
    capturedBlob: null,
    resultImageUrl: null,
    stream: null,
    isProcessing: false,
};

// ── INIT ───────────────────────────────────────
const HF_DEFAULT_URL = 'https://anhhuy0402-yolov8-face-recognition.hf.space';

window.addEventListener('DOMContentLoaded', () => {
    // Ưu tiên: localStorage → HF default
    const saved = localStorage.getItem('faceid_server_url') || HF_DEFAULT_URL;
    document.getElementById('serverUrl').value = saved;
    state.serverUrl = saved;
    
    // Tự động test kết nối khi load trang
    testConnection();
});

// ── SERVER CONFIG ──────────────────────────────
async function testConnection() {
    const urlInput = document.getElementById('serverUrl');
    const url = urlInput.value.trim().replace(/\/$/, '');

    if (!url) {
        toast('Vui lòng nhập URL server.', 'error');
        return;
    }

    state.serverUrl = url;
    localStorage.setItem('faceid_server_url', url);

    setStatus('loading', 'Đang kết nối...');
    const btn = document.getElementById('testBtn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Đang kiểm tra...';

    try {
        const res = await fetch(`${url}/`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': '1' },
            signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
            const data = await res.json();
            setStatus('connected', 'Đã kết nối');
            toast(`Server online: ${data.status || 'OK'}`, 'success');
        } else {
            throw new Error(`HTTP ${res.status}`);
        }
    } catch (err) {
        setStatus('error', 'Kết nối thất bại');
        toast(`Không thể kết nối: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Kiểm tra kết nối';
    }
}

function setStatus(type, text) {
    const pill = document.getElementById('statusPill');
    const label = document.getElementById('statusText');
    pill.className = 'status-pill';
    if (type === 'connected') pill.classList.add('connected');
    if (type === 'error') pill.classList.add('error');
    label.textContent = text;
}

// ── MODE SWITCH ────────────────────────────────
function switchMode(mode) {
    document.getElementById('tabUpload').classList.toggle('active', mode === 'upload');
    document.getElementById('tabCamera').classList.toggle('active', mode === 'camera');
    document.getElementById('uploadMode').style.display = mode === 'upload' ? '' : 'none';
    document.getElementById('cameraMode').style.display = mode === 'camera' ? '' : 'none';

    if (mode === 'upload') stopCamera();
    resetResultPanel();
}

// ── FILE UPLOAD ────────────────────────────────
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) loadFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropzone').classList.add('drag-over');
}

function handleDragLeave(e) {
    document.getElementById('dropzone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropzone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadFile(file);
    } else {
        toast('Vui lòng chọn file ảnh hợp lệ.', 'error');
    }
}

function loadFile(file) {
    state.selectedFile = file;
    state.capturedBlob = null;

    const reader = new FileReader();
    reader.onload = (e) => {
        showResultPanel(e.target.result);
    };
    reader.readAsDataURL(file);
    toast(`Đã chọn: ${file.name}`, 'info');
}

// ── CAMERA ─────────────────────────────────────
async function startCamera() {
    try {
        state.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        const video = document.getElementById('cameraFeed');
        video.srcObject = state.stream;

        document.getElementById('startCamBtn').disabled = true;
        document.getElementById('captureBtn').disabled = false;
        document.getElementById('stopCamBtn').disabled = false;
        toast('Camera đã bật', 'success');
    } catch (err) {
        toast(`Không thể truy cập camera: ${err.message}`, 'error');
    }
}

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(t => t.stop());
        state.stream = null;
    }
    const video = document.getElementById('cameraFeed');
    video.srcObject = null;

    document.getElementById('startCamBtn').disabled = false;
    document.getElementById('captureBtn').disabled = true;
    document.getElementById('stopCamBtn').disabled = true;
}

function captureFrame() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('cameraCanvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
        state.capturedBlob = blob;
        state.selectedFile = null;

        const url = URL.createObjectURL(blob);
        showResultPanel(url);
        toast('Đã chụp ảnh!', 'success');
    }, 'image/jpeg', 0.95);
}

// ── RESULT PANEL ───────────────────────────────
function showResultPanel(previewUrl) {
    const panel = document.getElementById('resultPanel');
    panel.style.display = '';

    document.getElementById('inputPreview').src = previewUrl;

    // Reset output
    document.getElementById('outputPreview').style.display = 'none';
    document.getElementById('outputPreview').src = '';
    document.getElementById('processingPlaceholder').style.display = 'flex';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    const fill = document.getElementById('arrowFill');
    fill.style.height = '0%';

    state.resultImageUrl = null;

    // Scroll to result panel
    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function resetResultPanel() {
    const panel = document.getElementById('resultPanel');
    panel.style.display = 'none';
    state.selectedFile = null;
    state.capturedBlob = null;
    state.resultImageUrl = null;

    document.getElementById('fileInput').value = '';
}

function resetAll() {
    resetResultPanel();
    stopCamera();
}

// ── SUBMIT TO API ──────────────────────────────
async function submitImage() {
    if (state.isProcessing) return;

    const url = (document.getElementById('serverUrl').value.trim() || state.serverUrl).replace(/\/$/, '');
    if (!url) {
        toast('Vui lòng nhập URL server trước.', 'error');
        return;
    }
    state.serverUrl = url;

    if (!state.selectedFile && !state.capturedBlob) {
        toast('Chưa có ảnh để nhận diện.', 'error');
        return;
    }

    state.isProcessing = true;

    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Đang xử lý...';

    // Reset output area
    document.getElementById('outputPreview').style.display = 'none';
    document.getElementById('processingPlaceholder').style.display = 'flex';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    const fill = document.getElementById('arrowFill');
    fill.style.height = '0%';

    const startTime = Date.now();

    try {
        const formData = new FormData();
        const blob = state.selectedFile || state.capturedBlob;
        const filename = state.selectedFile ? state.selectedFile.name : 'capture.jpg';
        formData.append('file', blob, filename);

        // Animate arrow
        setTimeout(() => { fill.style.height = '40%'; }, 200);

        const res = await fetch(`${url}/predict_image`, {
            method: 'POST',
            headers: {},
            body: formData,
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Server error ${res.status}: ${errText}`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        // Complete arrow
        fill.style.height = '100%';

        const resultBlob = await res.blob();
        const resultUrl = URL.createObjectURL(resultBlob);

        // Show result
        const outputImg = document.getElementById('outputPreview');
        outputImg.src = resultUrl;
        outputImg.style.display = 'block';
        document.getElementById('processingPlaceholder').style.display = 'none';
        state.resultImageUrl = resultUrl;

        // Stats
        document.getElementById('statTime').textContent = `${elapsed}s`;
        document.getElementById('statFaces').textContent = '—';
        document.getElementById('statStatus').textContent = 'Thành công';
        document.getElementById('statStatus').className = 'stat-value success';
        document.getElementById('statsBar').style.display = 'flex';
        document.getElementById('downloadBtn').style.display = 'inline-flex';

        setStatus('connected', 'Đã kết nối');
        toast('Nhận diện hoàn tất!', 'success');

    } catch (err) {
        fill.style.height = '0%';
        document.getElementById('processingPlaceholder').innerHTML = `
      <div style="color:var(--red);font-size:24px">✕</div>
      <p style="color:var(--red)">Xử lý thất bại</p>
    `;
        document.getElementById('statStatus').textContent = 'Lỗi';
        document.getElementById('statStatus').className = 'stat-value error';
        document.getElementById('statsBar').style.display = 'flex';

        setStatus('error', 'Lỗi kết nối');
        toast(`Lỗi: ${err.message}`, 'error');
    } finally {
        state.isProcessing = false;
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">◈</span> Nhận diện';
    }
}

// ── DOWNLOAD ───────────────────────────────────
function downloadResult() {
    if (!state.resultImageUrl) return;
    const a = document.createElement('a');
    a.href = state.resultImageUrl;
    a.download = `faceid_result_${Date.now()}.jpg`;
    a.click();
    toast('Đã tải ảnh kết quả', 'info');
}

// ── TOAST ──────────────────────────────────────
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-dot"></div><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => el.remove(), 320);
    }, 3500);
}

// ── ENTER KEY on URL input ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('serverUrl').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') testConnection();
    });
});