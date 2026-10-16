const cards = [
  ...document.querySelectorAll("#resultados .results-card.comparison-card"),
];

for (const card of cards) {
  const frame = card.querySelector(".comparison-frame");
  const range = card.querySelector(".comparison-range");
  if (!frame || !range) continue;
  range.addEventListener("input", () => {
    const before = Number(range.value);
    frame.style.setProperty("--comparison-position", `${before}%`);
    range.setAttribute(
      "aria-valuetext",
      `${before}% before, ${100 - before}% after`,
    );
  });
}

function revealResults() {
  if (
    !("IntersectionObserver" in window) ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.1 },
  );

  cards.forEach((card, index) => {
    card.style.setProperty("--comparison-delay", `${index * 90}ms`);
    if (card.getBoundingClientRect().bottom <= 0) card.classList.add("is-visible");
    else observer.observe(card);
  });

  let frame = 0;
  const catchUp = () => {
    frame = 0;
    for (const card of cards) {
      if (!card.classList.contains("is-visible") && card.getBoundingClientRect().bottom <= 0) {
        card.classList.add("is-visible");
        observer.unobserve(card);
      }
    }
  };
  addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(catchUp);
  }, { passive: true });
}

if (window.__clinicPreloaderDone) revealResults();
else
  window.addEventListener("clinic:preloader-complete", revealResults, {
    once: true,
  });
