// main.js

document.addEventListener('DOMContentLoaded', () => {
  // ────────────────────────────────────────────
  // 1) Fade-In / Fade-Out on Scroll
  // ────────────────────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // ────────────────────────────────────────────
  // 2) “Show more info” / “Hide info” Toggle
  // ────────────────────────────────────────────
  document.querySelectorAll('.more-info').forEach(button => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      panel.hidden = isOpen;
      button.setAttribute('aria-expanded', String(!isOpen));
      button.textContent = isOpen ? 'Show more info' : 'Hide info';
    });
  });

  // ────────────────────────────────────────────
  // 3) Services Carousel (auto-rotating, Prev/Next)
  // ────────────────────────────────────────────
  // ────────────────────────────────────────────
  // 3) Carousels (home services + per-project)
  //    - supports multiple instances
  //    - auto-rotate per carousel via data-auto (ms)
  // ────────────────────────────────────────────
  (function () {
    const carousels = document.querySelectorAll('.carousel');
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      const prevBtn = carousel.querySelector('.carousel-btn.prev');
      const nextBtn = carousel.querySelector('.carousel-btn.next');

      if (!slides.length) return;

      let slideWidth = carousel.querySelector('.carousel-track-container').getBoundingClientRect().width;
      let currentIndex = 0;
      let autoTimer = null;
      const autoMs = Number(carousel.getAttribute('data-auto') || 0);

      // Position slides side-by-side
      function layout() {
        slideWidth = carousel.querySelector('.carousel-track-container').getBoundingClientRect().width;
        slides.forEach((slide, i) => {
          slide.style.minWidth = `${slideWidth}px`;
          slide.style.left = `${slideWidth * i}px`;
        });
        moveTo(currentIndex, false);
      }

      function moveTo(index, animate = true) {
        const clamped = (index + slides.length) % slides.length;
        if (!animate) track.style.transition = 'none';
        track.style.transform = `translateX(-${slideWidth * clamped}px)`;
        if (!animate) {
          // force reflow then restore transition
          void track.offsetWidth;
          track.style.transition = '';
        }
        currentIndex = clamped;
      }

      function next() { moveTo(currentIndex + 1); }
      function prev() { moveTo(currentIndex - 1); }

      // Buttons
      prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });
      nextBtn?.addEventListener('click', () => { next(); resetAuto(); });

      // Keyboard (when buttons focused)
      [prevBtn, nextBtn].forEach(btn => {
        btn?.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') { prev(); resetAuto(); }
          if (e.key === 'ArrowRight') { next(); resetAuto(); }
        });
      });

      // Auto-rotate per carousel
      function startAuto() {
        if (!autoMs) return;
        stopAuto();
        autoTimer = setInterval(next, autoMs);
      }
      function stopAuto() { if (autoTimer) clearInterval(autoTimer); }
      function resetAuto() { if (autoMs) { stopAuto(); startAuto(); } }

      // Pause auto on hover/focus (nicer UX)
      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);
      carousel.addEventListener('focusin', stopAuto);
      carousel.addEventListener('focusout', startAuto);

      // Handle resize
      window.addEventListener('resize', () => layout());

      // Init
      layout();
      startAuto();
    });
  })();

  // ──────
  // 4) File Upload: persistent add/remove using DataTransfer
  // ──────
  ; (function () {
    const fileInput = document.getElementById('file');
    const fileList = document.querySelector('.file-list');
    if (!fileInput || !fileList) return;

    // Use a single DataTransfer to store ALL the files
    const dt = new DataTransfer();

    // Render pills from dt.files
    function render() {
      fileList.innerHTML = '';
      Array.from(dt.files).forEach((file, i) => {
        const pill = document.createElement('div');
        pill.className = 'file-item';

        const name = document.createElement('span');
        name.textContent = file.name;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'remove-file';
        btn.setAttribute('aria-label', `Remove ${file.name}`);
        btn.textContent = '×';
        btn.addEventListener('click', () => {
          // Remove this file from DataTransfer
          dt.items.remove(i);
          // Update the input’s FileList
          fileInput.files = dt.files;
          // Re-render pills
          render();
        });

        pill.append(name, btn);
        fileList.append(pill);
      });
    }

    // When the user picks files, append them into dt
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        dt.items.add(file);
      });
      // Reflect back into the native input
      fileInput.files = dt.files;
      render();
      // Clear the native picker so the next time you open it, 
      // you only get newly-selected files
      e.target.value = '';
    });
  })();

  (function () {
    const btn = document.getElementById('mailto-submit');
    const feedback = document.getElementById('form-feedback');

    if (!btn) return;

    const DEST_EMAIL = ''; // change later

    btn.addEventListener('click', () => {
      const type = document.getElementById('type')?.value;
      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      const message = document.getElementById('message')?.value.trim();

      if (!type || !name || !email || !message) {
        alert('Please complete all required fields.');
        return;
      }

      const subject = `${type} - ${name}`;

      const body = `
Full Name: ${name}
Email: ${email}
Phone: ${phone || '(not provided)'}

Message:
${message}
    `.trim();

      const mailto =
        `mailto:${encodeURIComponent(DEST_EMAIL)}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;

      if (feedback) {
        feedback.hidden = false;
        feedback.innerHTML = `<p>Your email app should open now. Please attach any files manually, then press Send.</p>`;
      }
    });
  })();
});
