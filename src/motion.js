const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 700px)");
const easeOut = "cubic-bezier(.22, 1, .36, 1)";
const runningAnimations = new Set();

function animate(element, keyframes, options = {}) {
  if (reducedMotion.matches || !element.animate) return;
  const animation = element.animate(keyframes, {
    duration: 850,
    easing: easeOut,
    ...options,
  });
  runningAnimations.add(animation);
  animation.finished
    .catch(() => {})
    .finally(() => runningAnimations.delete(animation));
}

// Content is visible by default; only JavaScript-enhanced, offscreen content waits.
const revealGroups = [
  [
    ".connection-section > .eyebrow, .connection-section > h2, .connection-section > .section-description",
    100,
  ],
  [".content-types > div", 110],
  [".section-heading > div, .section-heading > p", 100],
  [".workspace-tabs, .workspace-panel", 80],
  [".feature-card", 100],
  [".live-showcase", 0],
  [".live-benefits > div", 100],
  [
    ".closing-icon, .closing > .eyebrow, .closing > h2, .closing > p, .closing-actions",
    70,
  ],
  [".faq-section > div:first-child, .faq-list details", 60],
  [".footer-top, .footer-wordmark, .footer-bottom", 90],
];
let observer;
function observeReveals() {
  observer?.disconnect();
  document
    .querySelectorAll(".reveal-wait")
    .forEach((element) => element.classList.remove("reveal-wait"));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.remove("reveal-wait");
        target.dataset.revealed = "true";
        animate(
          target,
          [
            {
              opacity: 0,
              transform: `translateY(${mobile.matches ? 18 : 32}px)`,
            },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { delay: Number(target.dataset.revealDelay || 0), fill: "backwards" },
        );
        observer.unobserve(target);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -6% 0px" },
  );
  revealGroups.forEach(([selector, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (element.dataset.revealed) return;
      // Anchor destinations already in view remain readable immediately.
      if (element.getBoundingClientRect().top < window.innerHeight * 0.94)
        return;
      element.dataset.revealDelay = String(
        (index % 4) * (mobile.matches ? stagger * 0.5 : stagger),
      );
      element.classList.add("reveal-wait");
      observer.observe(element);
    });
  });
}

const header = document.querySelector(".site-header");
const product = document.querySelector(".hero-product");
const heroCopy = document.querySelector(".hero-copy");
const lyricExample = document.querySelector(".lyric-example");
let scheduled = false;
const clamp = (value) => Math.min(1, Math.max(0, value));
function renderScroll() {
  scheduled = false;
  header.classList.toggle("is-scrolled", window.scrollY > 32);
  if (reducedMotion.matches) return;
  const viewport = window.innerHeight;
  // The effect follows native page scrolling; wheel and touch input stay native.
  const progress = clamp(
    (window.scrollY + viewport - product.offsetTop) / (viewport * 0.8),
  );
  product.style.transform = mobile.matches
    ? `scale(${0.98 + progress * 0.02})`
    : `perspective(1400px) translateY(${(1 - progress) * 20}px) rotateX(${(1 - progress) * 6}deg) scale(${0.94 + progress * 0.06})`;
  const heroProgress = clamp(
    window.scrollY / (heroCopy.offsetTop + heroCopy.offsetHeight),
  );
  heroCopy.style.translate = `0 ${heroProgress * (mobile.matches ? 0 : 38)}px`;
  const lyricRect = lyricExample.getBoundingClientRect();
  if (!mobile.matches && lyricRect.top < viewport && lyricRect.bottom > 0) {
    const position =
      (lyricRect.top + lyricRect.height / 2 - viewport / 2) / viewport;
    lyricExample.style.translate = `0 ${position * -22}px`;
  }
}
function scheduleScroll() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(renderScroll);
}
window.addEventListener("scroll", scheduleScroll, { passive: true });
window.addEventListener("resize", scheduleScroll, { passive: true });
window.addEventListener("pageshow", scheduleScroll);
reducedMotion.addEventListener("change", () => {
  runningAnimations.forEach((animation) => animation.cancel());
  product.style.removeProperty("transform");
  heroCopy.style.removeProperty("translate");
  lyricExample.style.removeProperty("translate");
  observeReveals();
  scheduleScroll();
});

observeReveals();
scheduleScroll();
if (!reducedMotion.matches && window.scrollY < 100) {
  document.querySelectorAll(".hero-copy > *").forEach((element, index) => {
    animate(
      element,
      [
        { opacity: 0, translate: "0 24px", filter: "blur(3px)" },
        { opacity: 1, translate: "0 0", filter: "blur(0)" },
      ],
      { duration: 900, delay: 80 + index * 80, fill: "backwards" },
    );
  });
}

export function animateWorkspace() {
  const elements = [
    document.querySelector(".workspace-copy"),
    document.querySelector(".workspace-shot"),
  ];
  elements.forEach((element, index) => {
    element.getAnimations?.().forEach((animation) => animation.cancel());
    animate(
      element,
      [
        { opacity: 0.35, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 500, delay: index * 65 },
    );
  });
}
