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
  (function () {
    const track = document.querySelector('.carousel-track');
    if (!track) return;  // not on this page
    const slides = Array.from(track.children);
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const slideWidth = slides[0].getBoundingClientRect().width;
    let currentIndex = 0, autoTimer;

    // Position slides
    slides.forEach((slide, i) => {
      slide.style.left = `${slideWidth * i}px`;
    });

    const moveTo = index => {
      track.style.transform = `translateX(-${slideWidth * index}px)`;
      currentIndex = index;
    };

    // Prev/Next handlers
    prevBtn.addEventListener('click', () => {
      moveTo((currentIndex === 0) ? slides.length - 1 : currentIndex - 1);
      resetAuto();
    });
    nextBtn.addEventListener('click', () => {
      moveTo((currentIndex + 1) % slides.length);
      resetAuto();
    });

    // Auto-rotate
    const startAuto = () => {
      autoTimer = setInterval(() => nextBtn.click(), 5000);
    };
    const resetAuto = () => {
      clearInterval(autoTimer);
      startAuto();
    };

    moveTo(0);
    startAuto();
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
});
