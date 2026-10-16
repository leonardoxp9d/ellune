(function () {
  const root = document.documentElement;
  window.__clinicPreloaderDone = false;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const startedAt = performance.now();
  const minimumVisibleTime = reducedMotion ? 0 : 900;
  let closing = false;
  let animationsReleased = false;

  const overlay = document.createElement("div");
  overlay.className = "site-preloader";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", "Carregando Clínica Luana Cabral");
  overlay.innerHTML =
    '<img class="site-preloader__logo" src="/images/logo.webp" width="933" height="700" alt=""><span class="site-preloader__line" aria-hidden="true"></span><span class="site-preloader__name">ESTÉTICA AVANÇADA & DERMATOLOGIA</span>';

  root.classList.add("site-loading", "site-hero-cascade");
  root.setAttribute("aria-busy", "true");
  document.body.append(overlay);
  root.classList.add("site-preloader-ready");

  function releaseAnimations() {
    if (animationsReleased) return;
    animationsReleased = true;
    root.classList.add("site-animations-released");
    window.__clinicPreloaderDone = true;
    requestAnimationFrame(function () {
      window.dispatchEvent(new Event("clinic:preloader-complete"));
    });
  }

  function finish() {
    if (closing) return;
    closing = true;
    const remaining = Math.max(
      0,
      minimumVisibleTime - (performance.now() - startedAt),
    );

    window.setTimeout(function () {
      overlay.classList.add("is-leaving");
      window.setTimeout(releaseAnimations, reducedMotion ? 0 : 200);
      window.setTimeout(
        function () {
          releaseAnimations();
          overlay.remove();
          root.classList.remove(
            "site-loading",
            "site-preloader-ready",
            "site-animations-released",
          );
          root.removeAttribute("aria-busy");
          window.dispatchEvent(new Event("clinic:preloader-finished"));
        },
        reducedMotion ? 250 : 600,
      );
    }, remaining);
  }

  function whenHeroIsReady() {
    const images = document.querySelectorAll(
      ".hero-background-new, .hero-profile-new",
    );
    const decoded = [...images].map((image) =>
      image.decode ? image.decode().catch(() => {}) : Promise.resolve(),
    );
    Promise.race([
      Promise.all(decoded),
      new Promise((resolve) => window.setTimeout(resolve, 1800)),
    ]).then(finish);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenHeroIsReady, { once: true });
  } else {
    whenHeroIsReady();
  }
  window.setTimeout(finish, 2500);
})();
