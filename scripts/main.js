import "./faq.js";
import { scrollToSection } from "./smooth-scroll.js";
import "./navigation.js";
import "./section-navigation.js";
import "./testimonials.js";
import "./results.js";
import "./results-stack.js";
import "./treatments-stack.js";
import "./interface.js";
import "./booking.js";
import "./reveal.js";

// Dynamic sections are inserted before load; reapply deep links after layout settles.
if (location.hash) {
  const restoreAnchor = () => {
    const target = document.getElementById(
      decodeURIComponent(location.hash.slice(1)),
    );
    if (target)
      requestAnimationFrame(() =>
        scrollToSection(target, true),
      );
  };
  if (document.readyState === "complete") restoreAnchor();
  else window.addEventListener("load", restoreAnchor, { once: true });
  window.addEventListener("clinic:preloader-finished", restoreAnchor, {
    once: true,
  });
}
