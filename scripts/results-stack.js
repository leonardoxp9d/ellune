(() => {
  const media = matchMedia("(max-width: 766.98px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let grid;
  let cards = [];
  let naturalTops = [];
  let heights = [];
  let scrollFrame = 0;

  const clamp = (value) => Math.max(0, Math.min(1, value));

  function update() {
    scrollFrame = 0;
    if (!media.matches || reducedMotion.matches || !cards.length) return;
    const stickyTop = parseFloat(getComputedStyle(cards[0]).top) || 80;
    const position = scrollY + stickyTop;
    cards.forEach((card, index) => {
      const progress =
        index === cards.length - 1
          ? 0
          : clamp((position - naturalTops[index]) / heights[index]);
      card.style.setProperty(
        "--results-stack-scale",
        String(1 - progress * 0.1),
      );
      card.style.setProperty(
        "--results-stack-brightness",
        String(1 - progress * 0.5),
      );
      card.style.zIndex = String(index + 1);
    });
  }

  function scheduleUpdate() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
  }

  function measure() {
    const currentGrid = document.querySelector("#resultados .results-grid");
    grid = currentGrid;
    if (!grid) return;
    cards = [...grid.querySelectorAll(".results-card.comparison-card")];
    cards.forEach((card) => {
      card.style.position = "static";
      card.style.setProperty("--results-stack-scale", "1");
      card.style.setProperty("--results-stack-brightness", "1");
    });
    if (media.matches && !reducedMotion.matches) {
      naturalTops = cards.map(
        (card) => card.getBoundingClientRect().top + scrollY,
      );
      heights = cards.map((card) => Math.max(card.offsetHeight, 1));
    }
    cards.forEach((card) => {
      card.style.position = "";
      card.style.zIndex = "";
    });
    scheduleUpdate();
  }

  measure();
  addEventListener("load", measure, { once: true });
  addEventListener("resize", measure, { passive: true });
  addEventListener("scroll", scheduleUpdate, { passive: true });
  media.addEventListener("change", measure);
  reducedMotion.addEventListener("change", measure);
})();
