document.addEventListener('DOMContentLoaded', () => {
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0.1 });
  fadeEls.forEach((el) => fadeObserver.observe(el));

  document.querySelectorAll('.more-info').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const isOpen = button.getAttribute('aria-expanded') === 'true';

      if (!panel) return;

      panel.hidden = isOpen;
      button.setAttribute('aria-expanded', String(!isOpen));
      button.textContent = isOpen ? 'Show more info' : 'Hide info';
    });
  });

  (function initCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const track = carousel.querySelector('.carousel-track');
      const container = carousel.querySelector('.carousel-track-container');
      const prevBtn = carousel.querySelector('.carousel-btn.prev');
      const nextBtn = carousel.querySelector('.carousel-btn.next');

      if (!track || !container) return;

      const slides = Array.from(track.children);
      if (!slides.length) return;

      let slideWidth = container.getBoundingClientRect().width;
      let currentIndex = 0;
      let autoTimer = null;
      const autoMs = Number(carousel.getAttribute('data-auto') || 0);

      function moveTo(index, animate = true) {
        const clamped = (index + slides.length) % slides.length;
        if (!animate) track.style.transition = 'none';
        track.style.transform = `translateX(-${slideWidth * clamped}px)`;
        if (!animate) {
          void track.offsetWidth;
          track.style.transition = '';
        }
        currentIndex = clamped;
      }

      function layout() {
        slideWidth = container.getBoundingClientRect().width;
        slides.forEach((slide, i) => {
          slide.style.minWidth = `${slideWidth}px`;
          slide.style.left = `${slideWidth * i}px`;
        });
        moveTo(currentIndex, false);
      }

      function next() {
        moveTo(currentIndex + 1);
      }

      function prev() {
        moveTo(currentIndex - 1);
      }

      function stopAuto() {
        if (autoTimer) clearInterval(autoTimer);
      }

      function startAuto() {
        if (!autoMs) return;
        stopAuto();
        autoTimer = setInterval(next, autoMs);
      }

      function resetAuto() {
        if (!autoMs) return;
        stopAuto();
        startAuto();
      }

      prevBtn?.addEventListener('click', () => {
        prev();
        resetAuto();
      });

      nextBtn?.addEventListener('click', () => {
        next();
        resetAuto();
      });

      [prevBtn, nextBtn].forEach((btn) => {
        btn?.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowLeft') {
            prev();
            resetAuto();
          }
          if (event.key === 'ArrowRight') {
            next();
            resetAuto();
          }
        });
      });

      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);
      carousel.addEventListener('focusin', stopAuto);
      carousel.addEventListener('focusout', startAuto);
      window.addEventListener('resize', layout);

      layout();
      startAuto();
    });
  })();

  (function initContactForm() {
    const form = document.getElementById('contact-form');
    const fileInput = document.getElementById('file');
    const fileList = document.querySelector('.file-list');
    const feedback = document.getElementById('form-feedback');
    const submitBtn = document.getElementById('contact-submit');

    if (!form || !fileInput || !fileList || !feedback || !submitBtn) return;

    const maxFiles = Number(form.dataset.maxFiles || 5);
    const maxFileSizeBytes = Number(form.dataset.maxFileSizeMb || 5) * 1024 * 1024;
    const maxTotalSizeBytes = Number(form.dataset.maxTotalSizeMb || 15) * 1024 * 1024;
    const maxImageDimension = 2200;
    const initialImageQuality = 0.9;
    const minimumImageQuality = 0.68;
    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    const imageMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const dt = new DataTransfer();

    function formatBytes(bytes) {
      if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function setFeedback(message, variant) {
      feedback.hidden = false;
      feedback.classList.remove('is-success', 'is-error');
      feedback.classList.add(variant === 'success' ? 'is-success' : 'is-error');
      feedback.innerHTML = `<p>${message}</p>`;
    }

    function clearFeedback() {
      feedback.hidden = true;
      feedback.classList.remove('is-success', 'is-error');
      feedback.innerHTML = '';
    }

    function getTotalSize(files) {
      return Array.from(files).reduce((sum, file) => sum + file.size, 0);
    }

    function isAllowedFile(file) {
      const lowerName = file.name.toLowerCase();
      return allowedMimeTypes.has(file.type) || allowedExtensions.some((ext) => lowerName.endsWith(ext));
    }

    function isImageFile(file) {
      return imageMimeTypes.has(file.type);
    }

    function syncFiles() {
      fileInput.files = dt.files;
    }

    function renderFiles() {
      fileList.innerHTML = '';

      Array.from(dt.files).forEach((file, index) => {
        const pill = document.createElement('div');
        pill.className = 'file-item';

        const name = document.createElement('span');
        name.textContent = `${file.name} (${formatBytes(file.size)})`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-file';
        btn.setAttribute('aria-label', `Remove ${file.name}`);
        btn.textContent = 'x';
        btn.addEventListener('click', () => {
          dt.items.remove(index);
          syncFiles();
          renderFiles();
          clearFeedback();
        });

        pill.append(name, btn);
        fileList.append(pill);
      });
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`"${file.name}" could not be read.`));
        reader.readAsDataURL(file);
      });
    }

    function loadImage(file) {
      return readFileAsDataUrl(file).then((src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ img, src });
        img.onerror = () => reject(new Error(`"${file.name}" could not be processed as an image.`));
        img.src = src;
      }));
    }

    function canvasToBlob(canvas, quality) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Image compression failed.'));
        }, 'image/jpeg', quality);
      });
    }

    async function compressImage(file) {
      const { img } = await loadImage(file);
      const scale = Math.min(1, maxImageDimension / Math.max(img.width, img.height));
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Image compression is not supported in this browser.');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      let low = minimumImageQuality;
      let high = initialImageQuality;
      let bestBlob = await canvasToBlob(canvas, high);

      if (bestBlob.size > maxFileSizeBytes) {
        for (let i = 0; i < 7; i += 1) {
          const mid = (low + high) / 2;
          const candidate = await canvasToBlob(canvas, mid);

          if (candidate.size <= maxFileSizeBytes) {
            bestBlob = candidate;
            low = mid;
          } else {
            high = mid;
          }
        }
      }

      if (bestBlob.size > maxFileSizeBytes) {
        throw new Error(`"${file.name}" is still above ${form.dataset.maxFileSizeMb} MB after compression.`);
      }

      const baseName = file.name.replace(/\.[^.]+$/, '');
      return new File([bestBlob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    }

    async function normalizeFile(file) {
      if (!isImageFile(file)) {
        return file;
      }

      if (file.size <= maxFileSizeBytes) {
        return file;
      }

      return compressImage(file);
    }

    fileInput.addEventListener('change', async (event) => {
      clearFeedback();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Preparing files...';

      try {
        const selectedFiles = Array.from(event.target.files || []);
        if (!selectedFiles.length) return;

        const combinedFiles = Array.from(dt.files);

        for (const file of selectedFiles) {
          if (!isAllowedFile(file)) {
            setFeedback(`"${file.name}" is not an accepted file type. Use PDF, JPG, JPEG, PNG, or WEBP.`, 'error');
            continue;
          }

          if (combinedFiles.length >= maxFiles) {
            setFeedback(`You can upload up to ${maxFiles} files per submission.`, 'error');
            break;
          }

          const processedFile = await normalizeFile(file);
          if (processedFile.size > maxFileSizeBytes) {
            setFeedback(`"${processedFile.name}" exceeds the ${form.dataset.maxFileSizeMb} MB per-file limit.`, 'error');
            continue;
          }

          combinedFiles.push(processedFile);
        }

        if (getTotalSize(combinedFiles) > maxTotalSizeBytes) {
          setFeedback(`The selected files exceed the ${form.dataset.maxTotalSizeMb} MB total upload limit.`, 'error');
          return;
        }

        dt.items.clear();
        combinedFiles.forEach((file) => dt.items.add(file));
        syncFiles();
        renderFiles();
      } catch (error) {
        setFeedback(error.message || 'One or more files could not be prepared for upload.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        event.target.value = '';
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFeedback();

      if (!form.reportValidity()) {
        setFeedback('Please complete all required fields before sending your message.', 'error');
        return;
      }

      const endpoint = form.getAttribute('action');
      if (!endpoint) {
        setFeedback('The contact form endpoint has not been configured yet.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: {
            Accept: 'application/json',
          },
        });

        let payload = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          payload = await response.json();
        }

        if (!response.ok) {
          throw new Error(payload?.message || 'Your message could not be sent. Please try again later.');
        }

        form.reset();
        dt.items.clear();
        syncFiles();
        renderFiles();
        setFeedback('Thanks for reaching out. Your message has been sent successfully.', 'success');
      } catch (error) {
        setFeedback(error.message || 'Your message could not be sent. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  })();

  (function initHeroRotator() {
    const heroImg =
      document.getElementById('hero-rotator') ||
      document.querySelector('.hero .hero-img');

    if (!heroImg) return;

    const heroImages = [
      'images/home-page/hero.JPEG',
      'images/home-page/photo-10.JPEG',
      'images/home-page/photo-15.JPEG',
      'images/home-page/photo-29.JPEG',
      'images/home-page/photo-60.JPEG',
      'images/home-page/photo-137.JPEG',
      'images/home-page/photo-141.JPEG',
      'images/home-page/photo-144.JPEG',
    ];

    if (heroImages.length <= 1) return;

    let index = 0;
    heroImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    setInterval(() => {
      index = (index + 1) % heroImages.length;
      heroImg.src = heroImages[index];
    }, 3500);
  })();
});
