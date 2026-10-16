for (const selector of [
  ".hero-cta > span + svg",
  ".treatments-booking-wrap .treatments-booking-arrow",
  ".results-cta.hero-style-button > svg",
  ".faq-contact-action.treatments-booking-wrap .treatments-booking-arrow",
  ".clinic-footer-booking > .clinic-footer-arrow",
]) {
  document.querySelectorAll(selector).forEach((arrow) => arrow.remove());
}
