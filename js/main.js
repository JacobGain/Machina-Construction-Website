// Main JavaScript for interactive behaviors

// Grab all elements you want to fade
const fadeEls = document.querySelectorAll('.fade-in');

// Create an IntersectionObserver that toggles the 'visible' class
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element has come into view → fade in
      entry.target.classList.add('visible');
    } else {
      // Element has gone out of view → fade out
      entry.target.classList.remove('visible');
    }
  });
}, {
  threshold: 0.1  // adjust as needed (10% visible)
});

// Observe each element
fadeEls.forEach(el => observer.observe(el));

document.addEventListener('DOMContentLoaded', function () {
  // Toggle project details popup/expand on Past Projects page
  document.querySelectorAll('.more-info').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      const detailsId = button.getAttribute('aria-controls');
      const details = document.getElementById(detailsId);
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (details) {
        // Toggle the visibility of the project details
        details.hidden = expanded;
        // Update aria-expanded attribute on the button
        button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    });
  });
});

// Simple carousel for .services-carousel
(function () {
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const slideWidth = slides[0].getBoundingClientRect().width;
  let currentIndex = 0;
  let autoTimer;

  // Arrange slides next to each other
  slides.forEach((slide, i) => {
    slide.style.left = (slideWidth * i) + 'px';
  });

  const moveToSlide = (index) => {
    track.style.transform = 'translateX(-' + (slideWidth * index) + 'px)';
    currentIndex = index;
  };

  // Button handlers
  prevBtn.addEventListener('click', () => {
    const newIndex = (currentIndex === 0) ? slides.length - 1 : currentIndex - 1;
    moveToSlide(newIndex);
    resetAuto();
  });
  nextBtn.addEventListener('click', () => {
    const newIndex = (currentIndex === slides.length - 1) ? 0 : currentIndex + 1;
    moveToSlide(newIndex);
    resetAuto();
  });

  // Auto-rotate every 5 seconds
  const startAuto = () => {
    autoTimer = setInterval(() => {
      nextBtn.click();
    }, 5000);
  };
  const resetAuto = () => {
    clearInterval(autoTimer);
    startAuto();
  };

  // Initialize
  moveToSlide(0);
  startAuto();
})();
