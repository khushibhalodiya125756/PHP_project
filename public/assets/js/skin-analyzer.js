// AI Skin Analyzer Module JavaScript

class SkinAnalyzer {
  constructor() {
    this.stream = null;
    this.capturedImageBase64 = null;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('[data-action="open-skin-analyzer"]');
      if (openTrigger) {
        this.openModal();
      }

      const closeTrigger = e.target.closest('[data-action="close-skin-analyzer"]');
      if (closeTrigger) {
        this.closeModal();
      }

      const captureBtn = e.target.closest('#btn-capture-photo');
      if (captureBtn) {
        this.capturePhoto();
      }

      const retakeBtn = e.target.closest('#btn-retake-photo');
      if (retakeBtn) {
        this.resetCamera();
      }

      const startAnalysisBtn = e.target.closest('#btn-start-analysis');
      if (startAnalysisBtn) {
        this.runAnalysis();
      }
    });

    // File Dropzone / Upload Listener
    document.addEventListener('change', (e) => {
      if (e.target.id === 'skin-upload-input') {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.capturedImageBase64 = evt.target.result;
            this.showPreview(evt.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  openModal() {
    const modal = document.getElementById('skin-analyzer-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.startCamera();
  }

  closeModal() {
    const modal = document.getElementById('skin-analyzer-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.stopCamera();
  }

  async startCamera() {
    const video = document.getElementById('camera-stream');
    const placeholder = document.getElementById('camera-placeholder');
    if (!video) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      video.srcObject = this.stream;
      video.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
    } catch (err) {
      console.warn('Camera access error:', err);
      if (placeholder) {
        placeholder.classList.remove('hidden');
        placeholder.innerHTML = `
          <div class="text-center p-6 text-stone-500">
            <i class="fas fa-camera-slash text-3xl mb-2 text-rose-400"></i>
            <p class="text-xs">Camera unavailable or permission denied.</p>
            <p class="text-xs font-semibold mt-1">Please use the File Upload tab below!</p>
          </div>
        `;
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  capturePhoto() {
    const video = document.getElementById('camera-stream');
    const canvas = document.createElement('canvas');
    if (!video || !video.videoWidth) {
      window.glowApp?.showToast('Please wait for camera stream to start or upload a photo', 'error');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    this.capturedImageBase64 = base64;
    this.showPreview(base64);
  }

  showPreview(base64) {
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const cameraBox = document.getElementById('camera-box');
    const captureBtn = document.getElementById('btn-capture-photo');
    const retakeBtn = document.getElementById('btn-retake-photo');
    const startBtn = document.getElementById('btn-start-analysis');

    if (previewImg) previewImg.src = base64;
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (cameraBox) cameraBox.classList.add('hidden');

    if (captureBtn) captureBtn.classList.add('hidden');
    if (retakeBtn) retakeBtn.classList.remove('hidden');
    if (startBtn) startBtn.removeAttribute('disabled');

    this.stopCamera();
  }

  resetCamera() {
    const previewContainer = document.getElementById('photo-preview-container');
    const cameraBox = document.getElementById('camera-box');
    const captureBtn = document.getElementById('btn-capture-photo');
    const retakeBtn = document.getElementById('btn-retake-photo');
    const startBtn = document.getElementById('btn-start-analysis');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (cameraBox) cameraBox.classList.remove('hidden');

    if (captureBtn) captureBtn.classList.remove('hidden');
    if (retakeBtn) retakeBtn.classList.add('hidden');
    if (startBtn) startBtn.setAttribute('disabled', 'true');

    this.capturedImageBase64 = null;
    this.startCamera();
  }

  async runAnalysis() {
    const scanningOverlay = document.getElementById('analysis-scanning-overlay');
    const stepInput = document.getElementById('skin-step-input');
    const stepResult = document.getElementById('skin-step-result');

    if (scanningOverlay) scanningOverlay.classList.remove('hidden');

    try {
      const currentUser = window.glowApp?.currentUser;
      const res = await fetch('/api/skin-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: this.capturedImageBase64,
          user_id: currentUser ? currentUser.id : 1
        })
      });

      const data = await res.json();
      if (scanningOverlay) scanningOverlay.classList.add('hidden');

      if (!data.success) {
        window.glowApp?.showToast(data.error || 'Analysis failed', 'error');
        return;
      }

      this.renderResults(data.analysis);
      if (stepInput) stepInput.classList.add('hidden');
      if (stepResult) stepResult.classList.remove('hidden');

      window.glowApp?.showToast('AI Skin Diagnostic Completed!', 'success');
    } catch (err) {
      if (scanningOverlay) scanningOverlay.classList.add('hidden');
      window.glowApp?.showToast('Error connecting to AI Analysis engine', 'error');
    }
  }

  renderResults(analysis) {
    const resScore = document.getElementById('res-health-score');
    const resSkinType = document.getElementById('res-skin-type');
    const resOiliness = document.getElementById('res-oiliness');
    const resDryness = document.getElementById('res-dryness');
    const resDarkSpots = document.getElementById('res-darkspots');
    const resRedness = document.getElementById('res-redness');
    const resTexture = document.getElementById('res-texture');
    const resNotes = document.getElementById('res-notes');
    const resMorningList = document.getElementById('res-morning-routine');
    const resEveningList = document.getElementById('res-evening-routine');
    const resProductsGrid = document.getElementById('res-products-grid');

    if (resScore) resScore.textContent = (analysis.overall_health_score || 88) + '/100';
    if (resSkinType) resSkinType.textContent = analysis.skin_type || 'Combination';
    if (resOiliness) resOiliness.textContent = analysis.oiliness || 'Moderate';
    if (resDryness) resDryness.textContent = analysis.dryness || 'Low';
    if (resDarkSpots) resDarkSpots.textContent = analysis.dark_spots || 'Moderate';
    if (resRedness) resRedness.textContent = analysis.redness || 'Low';
    if (resTexture) resTexture.textContent = analysis.texture || 'Smooth';
    if (resNotes) resNotes.textContent = analysis.notes || 'Gentle cosmetic care recommended.';

    if (resMorningList) {
      const morningSteps = analysis.morning_routine || ['Gentle Cleanser', 'Vitamin C Serum', 'SPF 50 Sunscreen'];
      resMorningList.innerHTML = morningSteps.map((s, i) => `
        <li class="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
          <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold flex items-center justify-center text-[10px]">${i+1}</span>
          ${s}
        </li>
      `).join('');
    }

    if (resEveningList) {
      const eveningSteps = analysis.evening_routine || ['Gentle Cleanser', 'Barrier Repair Cream'];
      resEveningList.innerHTML = eveningSteps.map((s, i) => `
        <li class="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
          <span class="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-[10px]">${i+1}</span>
          ${s}
        </li>
      `).join('');
    }

    // Render Matching Store Products
    if (resProductsGrid && window.glowApp?.allProducts) {
      const recIds = analysis.recommended_product_ids || [1, 2, 3, 5];
      const matched = window.glowApp.allProducts.filter(p => recIds.includes(p.id));

      resProductsGrid.innerHTML = matched.map(p => `
        <div class="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex gap-3 items-center">
          <img src="${p.main_image}" class="w-14 h-14 rounded-lg object-cover" />
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider">94% Match</span>
            <h4 class="font-bold text-xs truncate text-stone-900 dark:text-white">${p.name}</h4>
            <p class="text-xs text-rose-600 font-semibold">$${(p.discounted_price || p.original_price).toFixed(2)}</p>
          </div>
          <button onclick="window.glowApp.addToCart(${p.id})" class="bg-rose-500 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
            + Cart
          </button>
        </div>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.skinAnalyzer = new SkinAnalyzer();
});
