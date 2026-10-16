import { scrollToSection } from "./smooth-scroll.js";
const navigationTargets = [
  "#inicio",
  "#tratamentos",
  "#resultados",
  "#depoimentos",
  "#profissionais",
  "#faq",
  "#rodape",
];
const transitionTargets = [
  "#resultados",
  "#depoimentos",
  "#profissionais",
  "#faq",
];
let navigationFrame = 0;

for (const target of transitionTargets) {
  const section = document.querySelector(target);
  if (
    !section ||
    section.previousElementSibling?.classList.contains("section-transition")
  )
    continue;
  const transition = document.createElement("div");
  transition.className = "section-transition";
  transition.dataset.nextSection = target.slice(1);
  transition.setAttribute("aria-hidden", "true");
  section.before(transition);
}

function updateActiveNavigation(preferredTarget) {
  navigationFrame = 0;
  const links = document.querySelectorAll(
    '.site-desktop-navigation nav a[href^="#"], .site-mobile-navigation nav a[href^="#"]',
  );
  const headerHeight =
    document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
  const probe = scrollY + headerHeight + Math.min(innerHeight * 0.32, 280);
  let activeTarget = preferredTarget || "#inicio";

  if (!preferredTarget) {
    for (const target of navigationTargets) {
      const section = document.querySelector(target);
      if (section && section.getBoundingClientRect().top + scrollY <= probe)
        activeTarget = target;
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2)
      activeTarget = "#rodape";
  }

  for (const link of links) {
    if (link.getAttribute("href") === activeTarget)
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function scheduleActiveNavigation() {
  if (!navigationFrame)
    navigationFrame = requestAnimationFrame(() => updateActiveNavigation());
}

addEventListener("scroll", scheduleActiveNavigation, { passive: true });
addEventListener("resize", scheduleActiveNavigation, { passive: true });
addEventListener("hashchange", scheduleActiveNavigation);
document.addEventListener(
  "click",
  (event) => {
    const source =
      event.target instanceof Element
        ? event.target.closest('.clinic-footer-navigation a[href^="#"]')
        : null;
    if (
      !source ||
      (typeof event.button === "number" && event.button !== 0) ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const href = source.getAttribute("href");
    const target = href && document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    updateActiveNavigation(href);
    history.pushState(null, "", href);
    scrollToSection(target);
  },
  true,
);
scheduleActiveNavigation();
