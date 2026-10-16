const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const nativeTouch = matchMedia("(max-width: 767px), (hover: none) and (pointer: coarse)");
let lenis = null;
let lenisImport = null;
let ready = false;

async function syncScroller() {
  if (!ready || reducedMotion.matches || nativeTouch.matches) {
    lenis?.destroy();
    lenis = null;
    return;
  }
  if (lenis) return;

  lenisImport ??= import("./vendor/lenis.js").catch(() => null);
  const module = await lenisImport;
  if (!module || !ready || reducedMotion.matches || nativeTouch.matches || lenis)
    return;

  lenis = new module.default({
    duration: 1.2,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    syncTouch: false,
    autoRaf: true,
    prevent: (node) => node.hasAttribute("data-lenis-prevent"),
  });
}

export function scrollToSection(target, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { immediate });
  } else if (target instanceof Element) {
    target.scrollIntoView({
      behavior: immediate || reducedMotion.matches ? "instant" : "smooth",
      block: "start",
    });
  }
}

function targetFromHash(hash) {
  if (!hash || hash === "#") return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

document.addEventListener("click", (event) => {
  if (event.defaultPrevented) return;
  const link = event.target instanceof Element
    ? event.target.closest('a[href^="#"]')
    : null;
  if (
    !link ||
    link.closest("#site-mobile-menu") ||
    link.closest(".clinic-footer-navigation") ||
    event.button !== 0 ||
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) return;

  const hash = link.getAttribute("href");
  const target = targetFromHash(hash);
  if (!target) return;

  event.preventDefault();
  if (location.hash !== hash) history.pushState(null, "", hash);
  scrollToSection(target);
}, true);

window.addEventListener("popstate", () => {
  const target = targetFromHash(location.hash);
  if (target) requestAnimationFrame(() => scrollToSection(target, true));
});

window.addEventListener("clinic:preloader-finished", () => {
  ready = true;
  syncScroller();
}, { once: true });
if (!document.documentElement.classList.contains("site-loading")) {
  ready = true;
  syncScroller();
}
reducedMotion.addEventListener("change", syncScroller);
nativeTouch.addEventListener("change", syncScroller);
window.addEventListener("pagehide", () => {
  lenis?.destroy();
  lenis = null;
});
window.addEventListener("pageshow", () => {
  if (ready) syncScroller();
});
