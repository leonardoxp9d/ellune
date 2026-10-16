(function () {
  "use strict";

  const bookingSelector =
    ".site-booking-button, .hero-cta, #avaliacao-tratamentos .treatments-booking, .clinic-footer-booking";
  const phone = "5521969533698";
  const services = [
    "Avaliação individualizada",
    "Emagrecimento Personalizado",
    "Terapia Nutricional Injetável",
    "Bioimpedância e Avaliação Corporal",
    "Lipedema e Pós-operatório",
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    step: 1,
    service: services[0],
    name: "",
    date: "",
    period: "Manhã",
    consent: false,
  };
  let dialog;
  let privacyDialog;
  let opener;
  let closeTimer;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function localToday() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function displayDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = value.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function messageUrl() {
    const message = [
      "Olá, Clínica Luana Cabral! Gostaria de solicitar uma avaliação.",
      "Nome: " + state.name.trim(),
      "Interesse: " + state.service,
      "Preferência: " + displayDate(state.date) + " — " + state.period,
      "Autorizo o uso destas informações para responder à minha solicitação. Entendo que a data e o período dependem de confirmação da equipe.",
    ].join("\n");
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }

  function stepsMarkup() {
    const labels = ["Seu cuidado", "Sua preferência", "Revisão"];
    return (
      '<ol class="clinic-booking-steps" aria-label="Etapa ' +
      state.step +
      ' de 3">' +
      labels
        .map(function (label, index) {
          const number = index + 1;
          const status =
            number < state.step
              ? "is-complete"
              : number === state.step
                ? "is-current"
                : "";
          return (
            '<li class="' +
            status +
            '"' +
            (number === state.step ? ' aria-current="step"' : "") +
            '><span class="clinic-booking-step-number" aria-hidden="true">' +
            number +
            "</span><span>" +
            label +
            "</span></li>"
          );
        })
        .join("") +
      "</ol>"
    );
  }

  function stepMarkup() {
    if (state.step === 1) {
      return (
        '<div class="clinic-booking-panel" data-step="1">' +
        '<label class="clinic-booking-label" for="clinic-booking-service">Qual cuidado você procura?</label>' +
        '<select class="clinic-booking-control" id="clinic-booking-service" name="service">' +
        services
          .map(function (item) {
            return (
              '<option value="' +
              escapeHtml(item) +
              '"' +
              (item === state.service ? " selected" : "") +
              ">" +
              escapeHtml(item) +
              "</option>"
            );
          })
          .join("") +
        "</select>" +
        '<p class="clinic-booking-hint">Ainda não sabe? Escolha a avaliação. Vamos entender seus objetivos com calma.</p>' +
        '<div class="clinic-booking-actions"><button class="clinic-booking-primary" type="button" data-booking-next>Continuar</button></div>' +
        "</div>"
      );
    }

    if (state.step === 2) {
      return (
        '<div class="clinic-booking-panel" data-step="2">' +
        '<div class="clinic-booking-field"><label class="clinic-booking-label" for="clinic-booking-name">Nome e sobrenome</label>' +
        '<input class="clinic-booking-control" id="clinic-booking-name" name="name" type="text" autocomplete="name" maxlength="120" required value="' +
        escapeHtml(state.name) +
        '"></div>' +
        '<div class="clinic-booking-field"><label class="clinic-booking-label" for="clinic-booking-date">Data de preferência</label>' +
        '<input class="clinic-booking-control" id="clinic-booking-date" name="date" type="date" min="' +
        localToday() +
        '" required value="' +
        escapeHtml(state.date) +
        '"></div>' +
        '<div class="clinic-booking-field"><label class="clinic-booking-label" for="clinic-booking-period">Período</label>' +
        '<select class="clinic-booking-control" id="clinic-booking-period" name="period">' +
        ["Manhã", "Tarde", "Sem preferência"]
          .map(function (item) {
            return (
              "<option" +
              (item === state.period ? " selected" : "") +
              ">" +
              item +
              "</option>"
            );
          })
          .join("") +
        "</select></div>" +
        '<p class="clinic-booking-hint">A data é uma preferência, não uma reserva. Não informe dados de saúde neste formulário.</p>' +
        '<p class="clinic-booking-error" id="clinic-booking-error" role="alert" hidden></p>' +
        '<div class="clinic-booking-actions"><button class="clinic-booking-secondary" type="button" data-booking-back>Voltar</button>' +
        '<button class="clinic-booking-primary" type="button" data-booking-next>Continuar</button></div></div>'
      );
    }

    return (
      '<div class="clinic-booking-panel" data-step="3">' +
      '<dl class="clinic-booking-summary">' +
      "<div><dt>Seu nome</dt><dd>" +
      escapeHtml(state.name.trim()) +
      "</dd></div>" +
      "<div><dt>Cuidado</dt><dd>" +
      escapeHtml(state.service) +
      "</dd></div>" +
      "<div><dt>Preferência</dt><dd>" +
      escapeHtml(displayDate(state.date)) +
      " · " +
      escapeHtml(state.period) +
      "</dd></div>" +
      "</dl>" +
      '<label class="clinic-booking-consent"><input type="checkbox" id="clinic-booking-consent"' +
      (state.consent ? " checked" : "") +
      "><span>Autorizo o uso do meu nome e das preferências informadas para responder a esta solicitação pelo WhatsApp.</span></label>" +
      '<button class="clinic-booking-privacy-link" type="button" data-booking-privacy>Ler detalhes</button>' +
      '<p class="clinic-booking-hint">Este aceite é para contato. O consentimento para tratamentos será tratado individualmente com a equipe.</p>' +
      '<div class="clinic-booking-actions"><button class="clinic-booking-secondary" type="button" data-booking-back>Voltar</button>' +
      '<a class="clinic-booking-primary clinic-booking-whatsapp" href="' +
      (state.consent ? messageUrl() : "#") +
      '" target="_blank" rel="noopener noreferrer"' +
      (state.consent ? "" : ' aria-disabled="true" tabindex="-1"') +
      ">Continuar no WhatsApp</a></div>" +
      '<p class="clinic-booking-fineprint">Revise a mensagem e toque em enviar no WhatsApp para concluir a solicitação.</p>' +
      "</div>"
    );
  }

  function render(focusSelector) {
    dialog.querySelector(".clinic-booking-steps-slot").innerHTML =
      stepsMarkup();
    dialog.querySelector(".clinic-booking-content").innerHTML = stepMarkup();
    dialog.querySelector(".clinic-booking-scroll").scrollTop = 0;
    if (focusSelector)
      dialog.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function resetState() {
    state.step = 1;
    state.service = services[0];
    state.name = "";
    state.date = "";
    state.period = "Manhã";
    state.consent = false;
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
        '<p class="clinic-booking-intro" id="clinic-booking-description">Solicite uma avaliação. A equipe confirma a disponibilidade pelo WhatsApp.</p>' +
        '<div class="clinic-booking-steps-slot" aria-live="polite"></div><div class="clinic-booking-content"></div></div>';
      dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeFlow();
      });
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeFlow();
      });
    }
    if (!dialog.isConnected) document.body.append(dialog);
    if (!privacyDialog) {
      privacyDialog = document.createElement("dialog");
      privacyDialog.id = "clinic-booking-privacy";
      privacyDialog.className = "clinic-booking-dialog clinic-booking-privacy";
      privacyDialog.setAttribute(
        "aria-labelledby",
        "clinic-booking-privacy-title",
      );
      privacyDialog.setAttribute("data-lenis-prevent", "true");
      privacyDialog.innerHTML =
        '<div class="clinic-booking-scroll"><button class="clinic-booking-close" type="button" aria-label="Fechar privacidade" data-booking-privacy-close>×</button>' +
        '<p class="clinic-booking-eyebrow">CLÍNICA Luana Cabral</p><h2 id="clinic-booking-privacy-title" tabindex="-1">Privacidade e consentimento</h2>' +
        "<p>Você decide quando compartilhar seus dados.</p>" +
        "<p>O formulário utiliza seu nome, interesse e preferência de data para preparar uma mensagem. Os dados ficam apenas nesta página e não são enviados a um banco de dados por este site.</p>" +
        "<p>Ao continuar no WhatsApp, essas informações integram o link aberto no serviço. O envio da mensagem depende da sua ação no WhatsApp e segue também as regras de privacidade desse serviço.</p>" +
        '<p>Para solicitar esclarecimentos, correção ou exclusão de informações recebidas pela clínica, entre em contato pelo <a href="https://wa.me/' +
        phone +
        '" target="_blank" rel="noopener noreferrer">(21) 96953-3698</a>.</p>' +
        "<p>Esta autorização de contato não substitui avaliação ou consentimento para tratamentos. Não envie informações sensíveis de saúde pelo formulário.</p></div>";
      privacyDialog.addEventListener("click", function (event) {
        if (event.target === privacyDialog) closePrivacy();
      });
      privacyDialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closePrivacy();
      });
    }
    if (!privacyDialog.isConnected) document.body.append(privacyDialog);
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
    dialog
      .querySelector("#clinic-booking-title")
      .focus({ preventScroll: true });
  }

  function closePrivacy() {
    if (!privacyDialog?.open) return;
    privacyDialog.close();
    dialog
      .querySelector("[data-booking-privacy]")
      ?.focus({ preventScroll: true });
  }

  function closeFlow() {
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    if (privacyDialog?.open) privacyDialog.close();
    dialog.classList.add("is-closing");
    closeTimer = window.setTimeout(
      function () {
        dialog.close();
        dialog.classList.remove("is-closing");
        document.documentElement.classList.remove("clinic-booking-open");
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      },
      reducedMotion.matches ? 0 : 180,
    );
  }

  function validatePreference() {
    const name = dialog.querySelector("#clinic-booking-name");
    const date = dialog.querySelector("#clinic-booking-date");
    const error = dialog.querySelector("#clinic-booking-error");
    state.name = name.value.trim();
    state.date = date.value;
    if (!state.name) {
      error.textContent = "Informe seu nome e sobrenome.";
      error.hidden = false;
      name.focus();
      return false;
    }
    if (state.name.length < 2) {
      error.textContent = "Informe um nome válido.";
      error.hidden = false;
      name.focus();
      return false;
    }
    if (!date.value || !date.validity.valid || date.value < localToday()) {
      error.textContent =
        "Escolha uma data de preferência válida a partir de hoje.";
      error.hidden = false;
      date.focus();
      return false;
    }
    return true;
  }

  function annotateTrigger(trigger) {
    trigger.setAttribute("aria-haspopup", "dialog");
  }

  if (window.__clinicPreloaderDone) {
    document.querySelectorAll(bookingSelector).forEach(annotateTrigger);
  } else {
    window.addEventListener(
      "clinic:preloader-complete",
      function () {
        document.querySelectorAll(bookingSelector).forEach(annotateTrigger);
      },
      { once: true },
    );
  }

  document.addEventListener(
    "click",
    function (event) {
      const trigger = event.target.closest(bookingSelector);
      if (trigger && !trigger.closest(".clinic-booking-dialog")) {
        event.preventDefault();
        event.stopPropagation();
        openFlow(trigger);
        return;
      }
      if (event.target.closest("[data-booking-close]")) {
        closeFlow();
        return;
      }
      if (event.target.closest("[data-booking-privacy-close]")) {
        closePrivacy();
        return;
      }
      if (event.target.closest("[data-booking-privacy]")) {
        privacyDialog.showModal();
        privacyDialog
          .querySelector("#clinic-booking-privacy-title")
          .focus({ preventScroll: true });
        return;
      }
      if (event.target.closest("[data-booking-back]")) {
        state.step = Math.max(1, state.step - 1);
        render(
          state.step === 1 ? "#clinic-booking-service" : "#clinic-booking-name",
        );
        return;
      }
      if (event.target.closest("[data-booking-next]")) {
        if (state.step === 2 && !validatePreference()) return;
        state.step = Math.min(3, state.step + 1);
        render(
          state.step === 2 ? "#clinic-booking-name" : "#clinic-booking-title",
        );
        return;
      }
      if (
        event.target.closest('.clinic-booking-whatsapp[aria-disabled="true"]')
      )
        event.preventDefault();
    },
    true,
  );

  document.addEventListener("input", function (event) {
    if (!dialog?.open || !dialog.contains(event.target)) return;
    if (event.target.id === "clinic-booking-name")
      state.name = event.target.value;
    if (event.target.id === "clinic-booking-date")
      state.date = event.target.value;
    const error = dialog.querySelector("#clinic-booking-error");
    if (error) error.hidden = true;
  });

  document.addEventListener("change", function (event) {
    if (!dialog?.open || !dialog.contains(event.target)) return;
    if (event.target.id === "clinic-booking-service")
      state.service = event.target.value;
    if (event.target.id === "clinic-booking-period")
      state.period = event.target.value;
    if (event.target.id === "clinic-booking-consent") {
      state.consent = event.target.checked;
      const link = dialog.querySelector(".clinic-booking-whatsapp");
      link.href = state.consent ? messageUrl() : "#";
      if (state.consent) {
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
      } else {
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || !dialog?.open || privacyDialog?.open) return;
    if (
      state.step === 2 &&
      (event.target.id === "clinic-booking-name" ||
        event.target.id === "clinic-booking-date")
    ) {
      event.preventDefault();
      dialog.querySelector("[data-booking-next]").click();
    }
  });
})();
