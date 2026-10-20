(function () {
  "use strict";

  const bookingSelector =
    ".site-booking-button, .hero-cta, #avaliacao-tratamentos .treatments-booking, .clinic-footer-booking";
  const calendlyUrl =
    "https://calendly.com/leo-dev-agendamento/agendamento?hide_event_type_details=1&hide_gdpr_banner=1&background_color=fcf7f3&text_color=30221f&primary_color=89503d";
  const calendlyScriptUrl =
    "https://assets.calendly.com/assets/external/widget.js";
  // Preview only. Production branding must be managed in the Calendly account.
  const previewBrandMask = ["localhost", "127.0.0.1", "[::1]"].includes(
    window.location.hostname,
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    step: 1,
    scheduled: false,
  };
  let dialog;
  let opener;
  let closeTimer;
  let calendlyScriptPromise;
  let calendarStarted = false;
  let calendarGeneration = 0;
  let calendarTimer;
  let calendarReady = false;

  function stepsMarkup() {
    const labels = ["Horários", "Seus dados", "Confirmação"];
    return (
      '<ol class="clinic-booking-steps" aria-label="Etapa ' + state.step + ' de 3">' +
      labels.map(function (label, index) {
        const number = index + 1;
        const status = number < state.step ? "is-complete" : number === state.step ? "is-current" : "";
        return '<li class="' + status + '"' +
          (number === state.step ? ' aria-current="step"' : "") +
          '><span class="clinic-booking-step-number" aria-hidden="true">' + number +
          "</span><span>" + label + "</span></li>";
      }).join("") + "</ol>"
    );
  }

  function panelsMarkup() {
    return (
      // One persistent widget spans both the slot selection and contact details steps.
      '<section class="clinic-booking-panel" data-step="1 2" aria-label="Calendário de agendamento">' +
      '<p class="clinic-booking-calendar-status" role="status" aria-live="polite">Carregando horários disponíveis…</p>' +
      '<div class="clinic-booking-calendar-frame">' +
      '<div class="calendly-inline-widget clinic-booking-calendar" id="clinic-booking-calendly" data-auto-load="false" data-url="' + calendlyUrl + '" aria-busy="true"></div>' +
      '<span class="clinic-booking-calendar-brand-mask" aria-hidden="true"' +
      (previewBrandMask ? "" : " hidden") + '></span></div>' +
      '<div class="clinic-booking-calendar-fallback" role="alert" hidden><p>Não foi possível exibir os horários. Tente novamente ou abra o Calendly para concluir seu agendamento.</p>' +
      '<div class="clinic-booking-actions"><button class="clinic-booking-secondary" type="button" data-booking-calendar-retry>Tentar novamente</button>' +
      '<a class="clinic-booking-primary" data-booking-calendar-link href="' + calendlyUrl + '" target="_blank" rel="noopener noreferrer">Abrir Calendly<span class="clinic-booking-sr-only"> em outra aba</span></a></div></div>' +
      '</section>' +
      '<section class="clinic-booking-panel clinic-booking-confirmation" data-step="3" aria-label="Orientações após o agendamento" hidden>' +
      '<div class="clinic-booking-confirmation-cards">' +
      '<div class="clinic-booking-confirmation-card">' +
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="9" width="38" height="30" rx="4"/><path d="m6 11 18 15 18-15"/></svg>' +
      '<div><h3>E-mail de confirmação</h3><p>Verifique sua caixa de entrada e a pasta de spam.</p></div></div>' +
      '<div class="clinic-booking-confirmation-card">' +
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="9" width="34" height="33" rx="4"/><path d="M7 20h34M16 5v10M32 5v10"/></svg>' +
      '<div><h3>Detalhes do agendamento</h3><p>Confira a data, o horário, o endereço e as orientações no e-mail.</p></div></div>' +
      '<div class="clinic-booking-confirmation-card">' +
      '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 35h32c-5-5-5-8-5-15a11 11 0 0 0-22 0c0 7 0 10-5 15ZM20 40a4 4 0 0 0 8 0M22 9V7a2 2 0 0 1 4 0v2"/></svg>' +
      '<div><h3>Remarcação ou cancelamento</h3><p>Precisa alterar seu horário? Utilize as opções disponíveis no e-mail de confirmação.</p></div></div></div>' +
      '<div class="clinic-booking-confirmation-footer"><p>Agradecemos a sua confiança. Será um prazer receber você! ' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></p>' +
      '<button class="clinic-booking-primary" type="button" data-booking-close>Concluir</button></div></section>'
    );
  }

  function render(focusSelector) {
    const confirmed = state.step === 3;
    dialog.classList.toggle("is-calendly-step", state.step < 3);
    dialog.classList.toggle("is-confirmation-step", confirmed);
    dialog.querySelector("#clinic-booking-title").textContent = confirmed ? "Tudo certo!" : "Vamos cuidar de você?";
    dialog.querySelector("#clinic-booking-description").textContent = confirmed
      ? "Seu agendamento foi concluído com sucesso."
      : state.step === 2
      ? "Confira seu horário e preencha seus dados para concluir sua avaliação."
      : "Escolha um horário e informe seus dados para sua avaliação.";
    dialog.querySelectorAll("[data-booking-success]").forEach(function (element) {
      element.hidden = !confirmed;
    });
    dialog.querySelector(".clinic-booking-steps-slot").innerHTML = stepsMarkup();
    dialog.querySelectorAll("[data-step]").forEach(function (panel) {
      panel.hidden = !panel.dataset.step.split(" ").includes(String(state.step));
    });
    if (focusSelector) {
      dialog.querySelector(".clinic-booking-scroll").scrollTop = 0;
      dialog.querySelector(focusSelector)?.focus({ preventScroll: true });
    }
  }

  function clearCalendar() {
    calendarGeneration += 1;
    window.clearTimeout(calendarTimer);
    calendarStarted = false;
    calendarReady = false;
    const container = dialog.querySelector("#clinic-booking-calendly");
    container.replaceChildren();
    container.style.removeProperty("height");
  }

  function resetState() {
    state.step = 1;
    state.scheduled = false;
    dialog.querySelector(".clinic-booking-scroll").scrollTop = 0;
    clearCalendar();
  }

  function loadCalendly() {
    if (window.Calendly?.initInlineWidget) return Promise.resolve();
    if (calendlyScriptPromise) return calendlyScriptPromise;
    calendlyScriptPromise = new Promise(function (resolve, reject) {
      let script = document.querySelector('script[src="' + calendlyScriptUrl + '"]');
      const existing = Boolean(script);
      if (!script) {
        script = document.createElement("script");
        script.src = calendlyScriptUrl;
        script.async = true;
      }
      const timeout = window.setTimeout(fail, 15000);
      function cleanup() {
        window.clearTimeout(timeout);
        script.removeEventListener("load", loaded);
        script.removeEventListener("error", fail);
      }
      function loaded() {
        if (!window.Calendly?.initInlineWidget) return fail();
        cleanup();
        resolve();
      }
      function fail() {
        cleanup();
        script.remove();
        reject(new Error("Calendly indisponível"));
      }
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", fail, { once: true });
      if (!existing) document.head.append(script);
    }).catch(function (error) {
      calendlyScriptPromise = null;
      throw error;
    });
    return calendlyScriptPromise;
  }

  function setCalendarStatus(status) {
    const container = dialog.querySelector("#clinic-booking-calendly");
    container.hidden = status === "error";
    container.setAttribute("aria-busy", String(status === "loading"));
    dialog.querySelector(".clinic-booking-calendar-status").hidden = status !== "loading";
    dialog.querySelector(".clinic-booking-calendar-fallback").hidden = status !== "error";
  }

  async function initializeCalendly(force) {
    if (!dialog?.open || state.scheduled) return;
    if (!force && calendarStarted) return;
    clearCalendar();
    calendarStarted = true;
    state.step = 1;
    render();
    const generation = calendarGeneration;
    const container = dialog.querySelector("#clinic-booking-calendly");
    setCalendarStatus("loading");
    try {
      await loadCalendly();
      if (generation !== calendarGeneration || !dialog.open) return;
      window.Calendly.initInlineWidget({ url: calendlyUrl, parentElement: container });
      const iframe = container.querySelector("iframe");
      if (!iframe) throw new Error("Calendly não inicializado");
      iframe.title = "Calendly — selecionar data e horário para avaliação";
      iframe.addEventListener("error", function () {
        if (generation !== calendarGeneration || calendarReady) return;
        window.clearTimeout(calendarTimer);
        setCalendarStatus("error");
      }, { once: true });
      calendarTimer = window.setTimeout(function () {
        if (generation === calendarGeneration && !calendarReady) setCalendarStatus("error");
      }, 20000);
    } catch (error) {
      if (generation === calendarGeneration) setCalendarStatus("error");
    }
  }

  function ensureDialog() {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "clinic-booking-dialog";
      dialog.className = "clinic-booking-dialog";
      dialog.setAttribute("aria-labelledby", "clinic-booking-title");
      dialog.setAttribute("aria-describedby", "clinic-booking-description");
      dialog.setAttribute("data-lenis-prevent", "true");
      dialog.innerHTML =
        '<div class="clinic-booking-scroll"><button class="clinic-booking-close" type="button" aria-label="Fechar agendamento" data-booking-close>×</button>' +
        '<p class="clinic-booking-eyebrow">SEU MOMENTO DE CUIDADO</p>' +
        '<h2 id="clinic-booking-title" tabindex="-1">Vamos cuidar de você?</h2>' +
        '<p class="clinic-booking-intro" id="clinic-booking-description">Escolha um horário e informe seus dados para sua avaliação.</p>' +
        '<p class="clinic-booking-success-note" data-booking-success hidden>Em instantes, você receberá no seu e-mail todas as informações da sua avaliação, incluindo data, horário e endereço.</p>' +
        '<svg class="clinic-booking-success-icon" viewBox="0 0 180 160" aria-hidden="true" data-booking-success hidden>' +
        '<circle cx="85" cy="80" r="61"/><path d="m61 83 16 17 36-40" class="clinic-booking-success-check"/>' +
        '<path d="m17 44-10-6M28 30l-5-9M159 70l10-4M161 91l11 1M154 111l9 6"/></svg>' +
        '<div class="clinic-booking-steps-slot" aria-live="polite"></div><div class="clinic-booking-content">' + panelsMarkup() + '</div></div>';
      dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeFlow();
      });
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeFlow();
      });
    }
    if (!dialog.isConnected) document.body.append(dialog);
  }

  function openFlow(trigger) {
    ensureDialog();
    window.clearTimeout(closeTimer);
    dialog.classList.remove("is-closing");
    if (dialog.open) return;
    opener = trigger;
    annotateTrigger(trigger);
    resetState();
    render();
    const mobileMenu = document.querySelector("#site-mobile-menu");
    if (mobileMenu?.open) {
      const closeButton = mobileMenu.querySelector(".site-menu-close");
      if (closeButton) closeButton.click();
      else mobileMenu.close();
    }
    dialog.showModal();
    document.documentElement.classList.add("clinic-booking-open");
    dialog.querySelector("#clinic-booking-title").focus({ preventScroll: true });
    initializeCalendly();
  }

  function closeFlow() {
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    closeTimer = window.setTimeout(function () {
      dialog.close();
      dialog.classList.remove("is-closing");
      clearCalendar();
      document.documentElement.classList.remove("clinic-booking-open");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 180);
  }

  function annotateTrigger(trigger) {
    trigger.setAttribute("aria-haspopup", "dialog");
  }

  if (window.__clinicPreloaderDone) {
    document.querySelectorAll(bookingSelector).forEach(annotateTrigger);
  } else {
    window.addEventListener("clinic:preloader-complete", function () {
      document.querySelectorAll(bookingSelector).forEach(annotateTrigger);
    }, { once: true });
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest(bookingSelector);
    if (trigger && !trigger.closest(".clinic-booking-dialog")) {
      event.preventDefault();
      event.stopPropagation();
      openFlow(trigger);
      return;
    }
    if (!dialog?.open || !dialog.contains(event.target)) return;
    if (event.target.closest("[data-booking-close]")) closeFlow();
    else if (event.target.closest("[data-booking-calendar-retry]") && !state.scheduled) {
      initializeCalendly(true);
    }
  }, true);

  window.addEventListener("message", function (event) {
    if (!dialog?.open || state.scheduled) return;
    const iframe = dialog.querySelector("#clinic-booking-calendly iframe");
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== "https://calendly.com") return;
    const name = event.data?.event;
    if (!["calendly.profile_page_viewed", "calendly.event_type_viewed", "calendly.date_and_time_selected", "calendly.page_height", "calendly.event_scheduled"].includes(name)) return;
    calendarReady = true;
    window.clearTimeout(calendarTimer);
    setCalendarStatus("ready");
    if (name === "calendly.page_height") {
      const height = Number.parseFloat(event.data.payload?.height);
      if (Number.isFinite(height) && height >= 320 && height <= 4000) {
        dialog.querySelector("#clinic-booking-calendly").style.height = Math.ceil(height) + "px";
      }
    }
    if (name === "calendly.event_scheduled") {
      state.scheduled = true;
      state.step = 3;
      render("#clinic-booking-title");
    } else if (name === "calendly.date_and_time_selected" && state.step !== 2) {
      // Calendly exposes slot selection, not a separate Next-button click event.
      // Update only the parent UI, preserving the iframe, its focus and form data.
      state.step = 2;
      render();
    } else if ((name === "calendly.event_type_viewed" || name === "calendly.profile_page_viewed") && state.step !== 1) {
      state.step = 1;
      render();
    }
  });
})();
