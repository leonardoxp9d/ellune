const accordion = document.querySelector(".faq-accordion");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (accordion) {
  const items = [...accordion.querySelectorAll(".faq-item")];

  function close(item, immediate = false) {
    const trigger = item.querySelector(".faq-trigger");
    const answer = item.querySelector(".faq-answer");
    if (!trigger || !answer) return;
    item.dataset.open = "false";
    trigger.setAttribute("aria-expanded", "false");
    answer.setAttribute("aria-hidden", "true");
    answer.inert = true;
    if (immediate || reducedMotion.matches) {
      answer.style.height = "0px";
      answer.hidden = true;
      return;
    }
    answer.style.height = `${answer.scrollHeight}px`;
    answer.getBoundingClientRect();
    requestAnimationFrame(() => {
      answer.style.height = "0px";
    });
    answer.addEventListener(
      "transitionend",
      () => {
        if (item.dataset.open === "false") answer.hidden = true;
      },
      { once: true },
    );
  }

  function open(item) {
    const trigger = item.querySelector(".faq-trigger");
    const answer = item.querySelector(".faq-answer");
    if (!trigger || !answer) return;
    item.dataset.open = "true";
    trigger.setAttribute("aria-expanded", "true");
    answer.setAttribute("aria-hidden", "false");
    answer.inert = false;
    answer.hidden = false;
    answer.style.height = reducedMotion.matches ? "auto" : "0px";
    if (!reducedMotion.matches) {
      requestAnimationFrame(() => {
        answer.style.height = `${answer.scrollHeight}px`;
      });
      answer.addEventListener(
        "transitionend",
        () => {
          if (item.dataset.open === "true") answer.style.height = "auto";
        },
        { once: true },
      );
    }
  }

  items.forEach((item) => close(item, true));
  accordion.addEventListener("click", (event) => {
    const trigger = event.target.closest(".faq-trigger");
    if (!trigger || !accordion.contains(trigger)) return;
    const item = trigger.closest(".faq-item");
    if (item.dataset.open === "true") close(item);
    else open(item);
  });
}
