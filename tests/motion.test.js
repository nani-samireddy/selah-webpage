import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../src/motion.js", import.meta.url),
  "utf8",
).replace("export function animateWorkspace", "function animateWorkspace");
function setup(reduced = false) {
  const frames = [],
    animations = [],
    listeners = new Map();
  const preference = {
    matches: reduced,
    addEventListener(type, callback) {
      this.changed = callback;
    },
  };
  function element(top = 1200) {
    const classes = new Set();
    return {
      dataset: {},
      offsetTop: 700,
      offsetHeight: 600,
      classList: {
        add: (value) => classes.add(value),
        remove: (value) => classes.delete(value),
        contains: (value) => classes.has(value),
        toggle: (value, active) =>
          active ? classes.add(value) : classes.delete(value),
      },
      style: {
        removeProperty(property) {
          delete this[property];
        },
      },
      getBoundingClientRect: () => ({ top, height: 250, bottom: top + 250 }),
      animate() {
        const animation = {
          finished: new Promise(() => {}),
          cancelled: false,
          cancel() {
            this.cancelled = true;
          },
        };
        animations.push(animation);
        return animation;
      },
    };
  }
  const header = element(0),
    product = element(),
    hero = element(0),
    lyric = element(),
    offscreen = element();
  const elements = {
    ".site-header": header,
    ".hero-product": product,
    ".hero-copy": hero,
    ".lyric-example": lyric,
  };
  let observer;
  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.elements = [];
      observer = this;
    }
    observe(item) {
      this.elements.push(item);
    }
    unobserve(item) {
      this.elements = this.elements.filter((value) => value !== item);
    }
    disconnect() {
      this.elements = [];
    }
  }
  const window = {
    IntersectionObserver: Observer,
    innerHeight: 800,
    scrollY: 0,
    matchMedia: (query) =>
      query.includes("prefers-reduced-motion")
        ? preference
        : { matches: false },
    addEventListener: (type, callback, options) =>
      listeners.set(type, { callback, options }),
  };
  const document = {
    querySelector: (selector) => elements[selector],
    querySelectorAll: (selector) => {
      if (selector === ".reveal-wait")
        return offscreen.classList.contains("reveal-wait") ? [offscreen] : [];
      if (selector === ".hero-copy > *") return [hero];
      return selector.startsWith(".connection-section >") ? [offscreen] : [];
    },
  };
  runInNewContext(source, {
    window,
    document,
    IntersectionObserver: Observer,
    requestAnimationFrame: (callback) => frames.push(callback),
    console,
  });
  return {
    frames,
    animations,
    listeners,
    preference,
    window,
    header,
    product,
    hero,
    offscreen,
    observer,
    flush() {
      frames.splice(0).forEach((callback) => callback());
    },
  };
}

test("reduced motion keeps content visible and skips entrance and scroll transforms", () => {
  const page = setup(true);
  page.flush();
  assert.equal(page.offscreen.classList.contains("reveal-wait"), false);
  assert.equal(page.animations.length, 0);
  assert.equal(page.product.style.transform, undefined);
  page.window.scrollY = 100;
  page.listeners.get("scroll").callback();
  page.flush();
  assert.equal(page.header.classList.contains("is-scrolled"), true);
});

test("enabling reduced motion cancels active animation and releases waiting content", () => {
  const page = setup();
  page.flush();
  assert.equal(page.offscreen.classList.contains("reveal-wait"), true);
  assert.ok(page.animations.length > 0);
  page.preference.matches = true;
  page.preference.changed();
  page.flush();
  assert.equal(page.offscreen.classList.contains("reveal-wait"), false);
  assert.equal(page.product.style.transform, undefined);
  assert.equal(page.hero.style.translate, undefined);
  assert.ok(page.animations.every((animation) => animation.cancelled));
});

test("scroll work is passive and coalesced into one frame", () => {
  const page = setup();
  page.flush();
  assert.equal(page.listeners.get("scroll").options.passive, true);
  for (let count = 0; count < 12; count++)
    page.listeners.get("scroll").callback();
  assert.equal(page.frames.length, 1);
  assert.equal(page.listeners.has("wheel"), false);
  assert.equal(page.listeners.has("touchmove"), false);
});

test("an entering section is revealed once and stops being observed", () => {
  const page = setup();
  page.observer.callback([{ target: page.offscreen, isIntersecting: true }]);
  assert.equal(page.offscreen.classList.contains("reveal-wait"), false);
  assert.equal(page.offscreen.dataset.revealed, "true");
  assert.equal(page.observer.elements.length, 0);
});
