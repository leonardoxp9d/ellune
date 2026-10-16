(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function setupCarousel(section) {
    const viewport = section.querySelector(".slider-container");
    const track = section.querySelector(".swiper-wrapper");
    const slides = [...section.querySelectorAll(".swiper-slide")];
    const pagination = section.querySelector(".swiper-pagination");
    let index = 0;
    let pointerStart = null;
    let baseOffset = 0;
    let visible = 1;
    let autoplayTimer;
    let autoDirection = 1;
    let hovered = false;
    let focused = false;
    let inView = false;

    function scheduleAutoplay() {
      clearTimeout(autoplayTimer);
      if (
        !section.isConnected ||
        reducedMotion.matches ||
        hovered ||
        focused ||
        !inView ||
        document.hidden
      )
        return;
      autoplayTimer = setTimeout(() => {
        const maxIndex = Math.max(0, slides.length - visible);
        if (index >= maxIndex) autoDirection = -1;
        else if (index <= 0) autoDirection = 1;
        goTo(index + autoDirection);
      }, 5200);
    }

    function update() {
      visible = innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1;
      const maxIndex = Math.max(0, slides.length - visible);
      index = Math.min(index, maxIndex);
      baseOffset = slides[index]?.offsetLeft || 0;
      track.style.transform = `translate3d(${-baseOffset}px,0,0)`;
      slides.forEach((slide, i) =>
        slide.setAttribute(
          "aria-hidden",
          String(i < index || i >= index + visible),
        ),
      );
      const needed = maxIndex + 1;
      if (pagination.children.length !== needed) {
        pagination.replaceChildren(
          ...Array.from({ length: needed }, (_, i) => {
            const button = document.createElement("button");
            button.type = "button";
            button.setAttribute(
              "aria-label",
              `Mostrar grupo de depoimentos ${i + 1}`,
            );
            button.addEventListener("click", () => goTo(i));
            return button;
          }),
        );
      }
      [...pagination.children].forEach((button, i) => {
        button.setAttribute("aria-current", String(i === index));
        button.dataset.distance = String(Math.min(Math.abs(i - index), 2));
      });
    }

    function goTo(next) {
      const maxIndex = Math.max(0, slides.length - visible);
      index = next < 0 ? maxIndex : next > maxIndex ? 0 : next;
      update();
      scheduleAutoplay();
    }

    section
      .querySelector(".swiper-button-prev")
      .addEventListener("click", () => goTo(index - 1));
    section
      .querySelector(".swiper-button-next")
      .addEventListener("click", () => goTo(index + 1));
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    track.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      clearTimeout(autoplayTimer);
      pointerStart = { x: event.clientX, id: event.pointerId };
      track.classList.add("is-dragging");
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointermove", (event) => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const delta = event.clientX - pointerStart.x;
      track.style.transform = `translate3d(${-(baseOffset - delta)}px,0,0)`;
    });
    function finishDrag(event) {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const delta = event.clientX - pointerStart.x;
      pointerStart = null;
      track.classList.remove("is-dragging");
      if (Math.abs(delta) > 45) goTo(index + (delta < 0 ? 1 : -1));
      else {
        update();
        scheduleAutoplay();
      }
    }
    track.addEventListener("pointerup", finishDrag);
    track.addEventListener("pointercancel", finishDrag);
    section
      .querySelector(".swiper-viewport")
      .addEventListener("mouseenter", () => {
        hovered = true;
        clearTimeout(autoplayTimer);
      });
    section
      .querySelector(".swiper-viewport")
      .addEventListener("mouseleave", () => {
        hovered = false;
        scheduleAutoplay();
      });
    viewport.addEventListener("focusin", () => {
      focused = true;
      clearTimeout(autoplayTimer);
    });
    viewport.addEventListener("focusout", () => {
      focused = viewport.contains(document.activeElement);
      scheduleAutoplay();
    });
    document.addEventListener("visibilitychange", scheduleAutoplay);
    reducedMotion.addEventListener("change", scheduleAutoplay);
    new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        scheduleAutoplay();
      },
      { threshold: 0.15 },
    ).observe(section);
    addEventListener("resize", update, { passive: true });
    update();
    return section;
  }

  const section = document.getElementById("depoimentos");
  if (section) setupCarousel(section);
})();
