import { scrollToSection } from "./smooth-scroll.js";

(() => {
  let closingTimer;
  const mobile = window.matchMedia("(max-width: 1099px)");
  const elements = () => ({
    header: document.querySelector(".site-header"),
    toggle: document.querySelector(".site-header .site-menu-toggle"),
    menu: document.querySelector("#site-mobile-menu"),
  });
  let progressFrame = 0;
  let motionFrame = 0;
  let previousScroll = Math.max(0, scrollY);
  const updateProgress = () => {
    progressFrame = 0;
    const page = document.documentElement;
    const scrollable = page.scrollHeight - page.clientHeight;
    const fraction =
      scrollable > 0
        ? Math.max(0, Math.min(1, window.scrollY / scrollable))
        : 0;
    const bar = document.querySelector(
      ".site-header > .header-progress > .header-progress-bar",
    );
    if (bar) bar.style.transform = `scaleX(${fraction})`;
  };
  const scheduleProgress = () => {
    if (!progressFrame)
      progressFrame = window.requestAnimationFrame(updateProgress);
  };

  const setHeaderVisible = (header, visible) => {
    if (header.dataset.visible === String(visible)) return;
    header.dataset.visible = String(visible);
    header.setAttribute("aria-hidden", String(!visible));
  };
  const updateHeaderMotion = () => {
    motionFrame = 0;
    const { header } = elements();
    if (!header) return;
    const currentScroll = Math.max(0, scrollY);
    if (Math.abs(currentScroll - previousScroll) > 2)
      delete header.dataset.keyboard;
    header.dataset.top = String(currentScroll <= 2);
    setHeaderVisible(header, true);
    previousScroll = currentScroll;
  };
  const scheduleHeaderMotion = () => {
    if (!motionFrame) motionFrame = requestAnimationFrame(updateHeaderMotion);
  };
  const prepareHeader = () => {
    const header = elements().header;
    if (!header) return;
    if (header.hasAttribute("inert")) header.removeAttribute("inert");
    if (header.getAttribute("aria-hidden") !== "false")
      header.setAttribute("aria-hidden", "false");
    setHeaderVisible(header, true);

    if (!header.querySelector(":scope > .header-progress")) {
      const track = document.createElement("div");
      track.className = "header-progress";
      track.setAttribute("aria-hidden", "true");
      const bar = document.createElement("div");
      bar.className = "header-progress-bar";
      track.append(bar);
      header.append(track);
      scheduleProgress();
    }
  };
  prepareHeader();
  scheduleHeaderMotion();
  window.addEventListener("scroll", scheduleHeaderMotion, { passive: true });
  window.addEventListener("resize", () => {
    scheduleHeaderMotion();
  }, { passive: true });
  window.addEventListener("load", () => {
    scheduleHeaderMotion();
  }, { once: true });
  document.addEventListener("focusin", (event) => {
    if (event.target instanceof Element && event.target.closest(".site-header")) {
      setHeaderVisible(elements().header, true);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const header = elements().header;
      if (header) {
        header.dataset.keyboard = "true";
        setHeaderVisible(header, true);
      }
    }
  });
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });
  if ("ResizeObserver" in window)
    new ResizeObserver(scheduleProgress).observe(document.body);
  scheduleProgress();
  const syncHeight = () => {
    const { header, menu } = elements();
    if (!header || !menu) return;
    menu.style.setProperty(
      "--menu-header-height",
      `${header.getBoundingClientRect().height / 10}rem`,
    );
  };
  const close = () => {
    const { header, toggle, menu } = elements();
    if (!header || !toggle || !menu) return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    delete header.dataset.menuOpen;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    scheduleHeaderMotion();
    menu.dataset.menuState = "closed";
    menu.inert = true;
    window.clearTimeout(closingTimer);
    closingTimer = window.setTimeout(() => {
      const currentMenu = elements().menu;
      if (currentMenu?.dataset.menuState === "closed")
        currentMenu.removeAttribute("open");
    }, 420);
  };
  const open = () => {
    if (!mobile.matches) return;
    const { header, toggle, menu } = elements();
    if (!header || !toggle || !menu) return;
    window.clearTimeout(closingTimer);
    syncHeight();
    header.dataset.menuOpen = "true";
    menu.setAttribute("open", "");
    menu.dataset.menuState = "closed";
    menu.inert = false;
    menu.getBoundingClientRect();
    menu.dataset.menuState = "open";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    setHeaderVisible(header, true);
  };

  const initial = elements();
  if (!initial.toggle || !initial.menu) return;
  initial.menu.inert = true;
  initial.menu.removeAttribute("open");
  initial.toggle.setAttribute("aria-expanded", "false");

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".site-header .site-menu-toggle")) {
        event.preventDefault();
        event.stopPropagation();
        const { toggle } = elements();
        if (!toggle) return;
        if (toggle.getAttribute("aria-expanded") === "true") close();
        else open();
        return;
      }
      const mobileLink = target.closest('#site-mobile-menu a[href^="#"]');
      if (mobileLink) {
        const hash = mobileLink.getAttribute("href");
        const destination = hash && document.getElementById(hash.slice(1));
        if (destination) {
          event.preventDefault();
          if (location.hash !== hash) history.pushState(null, "", hash);
          scrollToSection(destination);
        }
        close();
        return;
      }
      if (target.closest("#site-mobile-menu .site-menu-close")) {
        close();
        return;
      }
      if (
        !target.closest("#site-mobile-menu") &&
        elements().toggle?.getAttribute("aria-expanded") === "true"
      )
        close();
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const { toggle } = elements();
      if (!toggle) return;
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        event.preventDefault();
        close();
        toggle.focus();
      }
    },
    true,
  );

  window.addEventListener(
    "resize",
    () => {
      syncHeight();
      if (!mobile.matches) close();
    },
    { passive: true },
  );
})();
