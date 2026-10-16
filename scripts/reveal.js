(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const watched = new WeakSet();
  const pending = new Set();
  let revealObserver;
  let catchUpFrame = 0;

  const groups = [
    ["#tratamentos .treatments-header", 0],
    ["#tratamentos .procedure-card", 80, true],
    ["#tratamentos .treatments-evaluation", 0],
    ["#resultados .results-header", 0],
    ["#resultados .results-action", 0],
    ["#depoimentos .testimonials-heading", 0],
    ["#depoimentos .testimonial", 75],
    ["#profissionais .professional-photo-reveal", 0],
    ["#profissionais .professional-quote", 0],
    [
      "#profissionais .professional-eyebrow, #profissionais .professional-name, #profissionais .professional-role, #profissionais .professional-specialty, #profissionais .professional-description",
      65,
    ],
    ["#profissionais .professional-detail", 90],
    ["#profissionais .professional-action", 0],
    ["#duvidas-frequentes .faq-editorial", 0],
    ["#duvidas-frequentes .faq-item", 75],
    ["#duvidas-frequentes .faq-contact", 0],
  ];

  function animateParts(root, selector, from, delay = 0, duration = 700) {
    if (reducedMotion.matches || !Element.prototype.animate) return;
    root.querySelectorAll(selector).forEach((element, index) => {
      const animation = element.animate(
        [from, { opacity: 1, transform: "none" }],
        {
          duration,
          delay: delay + index * 85,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "both",
        },
      );
      animation.onfinish = () => animation.cancel();
    });
  }

  function revealDetails(element) {
    if (element.matches("#tratamentos .treatments-header")) {
      animateParts(element, ".treatments-eyebrow", { opacity: 0, transform: "translateY(8px)" }, 80, 550);
      animateParts(element, ".treatments-title-first, .treatments-title-gold", { opacity: 1, transform: "translateY(105%)" }, 180, 820);
      animateParts(element, ".treatments-subtitle", { opacity: 0, transform: "translateY(16px)" }, 500);
    } else if (element.matches("#tratamentos .procedure-card")) {
      animateParts(element, ".procedure-image-reveal", { opacity: 1, transform: "translateY(100%)" }, 70, 850);
      animateParts(element, ".procedure-number, .procedure-title, .procedure-detail", { opacity: 0, transform: "translateY(12px)" }, 200, 650);
      animateParts(element, ".procedure-rule-reveal", { opacity: 1, transform: "scaleX(0)" }, 260, 650);
    } else if (element.matches("#tratamentos .treatments-evaluation")) {
      animateParts(element, ".treatments-evaluation-frame, .treatments-evaluation-side", { opacity: 0, transform: "scaleX(.94)" }, 60, 800);
      animateParts(element, ".treatments-evaluation-title, .treatments-evaluation-description", { opacity: 0, transform: "translateY(14px)" }, 210, 670);
      animateParts(element, ".treatments-booking", { opacity: 0, transform: "translateY(10px)" }, 390, 720);
    } else if (element.matches("#resultados .results-header")) {
      animateParts(element, ".results-eyebrow, .results-title, .results-subtitle", { opacity: 0, transform: "translateY(22px)" }, 50, 780);
    } else if (element.matches("#duvidas-frequentes .faq-editorial")) {
      animateParts(element, ".faq-eyebrow, .faq-avatar", { opacity: 0, transform: "translateY(12px)" }, 90, 690);
      animateParts(element, ".faq-title-ink, .faq-title-gold", { opacity: 1, transform: "translateY(105%)" }, 220, 860);
      animateParts(element, ".faq-intro, .faq-count", { opacity: 0, transform: "translateY(12px)" }, 510, 720);
    } else if (element.matches("#duvidas-frequentes .faq-item")) {
      animateParts(element, ".faq-number, .faq-question, .faq-toggle", { opacity: 0, transform: "translateY(10px)" }, 100, 650);
      animateParts(element, ".faq-rule, .faq-tick", { opacity: 1, transform: "scaleX(0)" }, 70, 710);
    } else if (element.matches("#duvidas-frequentes .faq-contact")) {
      animateParts(element, ".faq-contact-rule", { opacity: 1, transform: "scaleX(0)" }, 80, 770);
      animateParts(element, ".faq-contact-title, .faq-contact-copy p, .faq-contact-action", { opacity: 0, transform: "translateY(12px)" }, 210, 690);
    }
  }

  function reveal(element, animate = true) {
    if (element.classList.contains("is-visible")) return;
    element.classList.add("is-visible");
    revealObserver?.unobserve(element);
    pending.delete(element);
    if (animate) revealDetails(element);
  }

  function catchUp() {
    catchUpFrame = 0;
    for (const element of pending) {
      if (element.getBoundingClientRect().bottom <= 0) reveal(element, false);
    }
  }

  function scheduleCatchUp() {
    if (!catchUpFrame) catchUpFrame = requestAnimationFrame(catchUp);
  }

  function mount() {
    const items = groups.flatMap(([selector, stagger, opacityOnly]) =>
      [...document.querySelectorAll(selector)].map((element, index) => [
        element,
        Math.min(index * stagger, 390),
        opacityOnly,
      ]),
    );
    if (!items.length) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("pm-reveal-ready");
      items.forEach(([element]) => reveal(element));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
      );
    }

    items.forEach(([element, delay, opacityOnly]) => {
      if (watched.has(element)) return;
      watched.add(element);
      element.style.setProperty("--pm-reveal-delay", `${delay}ms`);
      element.classList.add(opacityOnly ? "pm-reveal-opacity" : "pm-reveal");
      if (element.getBoundingClientRect().bottom <= 0) reveal(element, false);
      else {
        pending.add(element);
        revealObserver.observe(element);
      }
    });
    document.documentElement.classList.add("pm-reveal-ready");
    scheduleCatchUp();
  }

  function start() {
    mount();
  }

  if (window.__clinicPreloaderDone === true) start();
  else
    window.addEventListener("clinic:preloader-complete", start, { once: true });
  addEventListener("scroll", scheduleCatchUp, { passive: true });
  addEventListener("resize", scheduleCatchUp, { passive: true });
})();
