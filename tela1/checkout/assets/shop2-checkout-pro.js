(function () {
  "use strict";

  var state = { step: 1, maxStep: 1 };
  var refs = {};
  var stepLabels = ["Dados", "Entrega", "Pagamento"];

  function digits(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function fieldGroup(field) {
    return field ? field.closest("div") || field.parentElement : null;
  }

  function setFieldError(field, message) {
    if (!field) return;
    var group = fieldGroup(field);
    if (!group) return;
    group.classList.add("shop2-field-error");
    var error = group.querySelector(".shop2-field-error-message");
    if (!error) {
      error = document.createElement("p");
      error.className = "shop2-field-error-message";
      group.appendChild(error);
    }
    error.textContent = message;
  }

  function clearFieldError(field) {
    if (!field) return;
    var group = fieldGroup(field);
    if (!group) return;
    group.classList.remove("shop2-field-error");
    var error = group.querySelector(".shop2-field-error-message");
    if (error) error.remove();
  }

  function focusFirstInvalid(fields) {
    var invalid = fields.find(function (field) {
      return field && fieldGroup(field) && fieldGroup(field).classList.contains("shop2-field-error");
    });
    if (invalid) {
      try { invalid.focus({ preventScroll: true }); } catch (_) { invalid.focus(); }
      invalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function validatePersonal() {
    var inputs = refs.personal ? Array.from(refs.personal.querySelectorAll("input")) : [];
    var name = inputs[0];
    var cpf = inputs[1];
    var phone = inputs[2];
    var email = inputs[3];
    var ok = true;

    [[name, "Informe seu nome completo."], [cpf, "Informe um CPF válido."], [phone, "Informe seu WhatsApp."], [email, "Informe um e-mail válido."]].forEach(function (item) {
      clearFieldError(item[0]);
    });

    if (!name || String(name.value || "").trim().split(/\s+/).length < 2) {
      setFieldError(name, "Informe nome e sobrenome.");
      ok = false;
    }
    if (!cpf || digits(cpf.value).length !== 11) {
      setFieldError(cpf, "Confira os 11 dígitos do CPF.");
      ok = false;
    }
    if (!phone || digits(phone.value).length < 10) {
      setFieldError(phone, "Informe um telefone válido.");
      ok = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email.value || "").trim())) {
      setFieldError(email, "Digite um e-mail válido.");
      ok = false;
    }

    if (!ok) focusFirstInvalid(inputs);
    return ok;
  }

  function validateAddress() {
    var inputs = refs.address ? Array.from(refs.address.querySelectorAll("input")) : [];
    var select = refs.address ? refs.address.querySelector("select") : null;
    var cep = inputs[0];
    var street = inputs[1];
    var number = inputs[2];
    var district = inputs[4];
    var city = inputs[5];
    var fields = [cep, street, number, district, city, select];
    var ok = true;

    fields.forEach(clearFieldError);

    if (!cep || digits(cep.value).length !== 8) {
      setFieldError(cep, "Confira o CEP.");
      ok = false;
    }
    if (!street || String(street.value || "").trim().length < 3) {
      setFieldError(street, "Informe a rua ou avenida.");
      ok = false;
    }
    if (!number || !String(number.value || "").trim()) {
      setFieldError(number, "Informe o número.");
      ok = false;
    }
    if (!district || String(district.value || "").trim().length < 2) {
      setFieldError(district, "Informe o bairro.");
      ok = false;
    }
    if (!city || String(city.value || "").trim().length < 2) {
      setFieldError(city, "Informe a cidade.");
      ok = false;
    }
    if (!select || !String(select.value || "").trim()) {
      setFieldError(select, "Selecione o estado.");
      ok = false;
    }

    if (!ok) focusFirstInvalid(fields);
    return ok;
  }

  function canOpenStep(step) {
    if (step <= state.maxStep) return true;
    if (step === 2) return validatePersonal();
    if (step === 3) return validatePersonal() && validateAddress();
    return false;
  }

  function setStep(step, shouldScroll) {
    if (!canOpenStep(step)) return;
    state.step = Math.max(1, Math.min(3, step));
    state.maxStep = Math.max(state.maxStep, state.step);
    document.body.dataset.checkoutStep = String(state.step);
    document.body.dataset.checkoutMaxStep = String(state.maxStep);
    updateProgress();
    if (shouldScroll !== false) scrollToFlow();
  }

  function scrollToFlow() {
    var target = refs.progress || refs.personal || document.querySelector("main");
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.pageYOffset - 86;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function updateProgress() {
    if (refs.progressHeader) {
      var label = stepLabels[state.step - 1];
      refs.progressHeader.innerHTML =
        '<span>Etapa <b>' + String(state.step).padStart(2, "0") + '</b> / 03</span>' +
        '<span><i></i>' + label + '</span>';
    }

    if (refs.stepItems) {
      refs.stepItems.forEach(function (item, index) {
        var number = index + 1;
        var status = number === state.step ? "active" : number < state.step ? "complete" : number <= state.maxStep ? "available" : "locked";
        item.dataset.stepState = status;
        item.setAttribute("aria-current", number === state.step ? "step" : "false");
        item.setAttribute("aria-disabled", status === "locked" ? "true" : "false");
      });
    }
  }

  function makeButton(label, className, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function ensureActions() {
    if (refs.personal && !refs.personal.querySelector(".shop2-step-actions")) {
      var personalActions = document.createElement("div");
      personalActions.className = "shop2-step-actions";
      personalActions.appendChild(makeButton("Continuar para entrega", "shop2-step-primary", function () {
        if (validatePersonal()) setStep(2);
      }));
      refs.personal.appendChild(personalActions);
    }

    if (refs.shipping && !refs.shipping.querySelector(".shop2-step-actions")) {
      var addressActions = document.createElement("div");
      addressActions.className = "shop2-step-actions shop2-step-actions-split";
      addressActions.appendChild(makeButton("Voltar", "shop2-step-secondary", function () { setStep(1); }));
      addressActions.appendChild(makeButton("Ir para pagamento", "shop2-step-primary", function () {
        if (validateAddress()) setStep(3);
      }));
      refs.shipping.appendChild(addressActions);
    }

    if (refs.payment && !refs.payment.querySelector(".shop2-step-actions")) {
      var finalButton = Array.from(refs.payment.querySelectorAll("button")).pop();
      var paymentActions = document.createElement("div");
      paymentActions.className = "shop2-step-actions shop2-step-actions-payment";
      paymentActions.appendChild(makeButton("Voltar para entrega", "shop2-step-secondary", function () { setStep(2); }));
      if (finalButton && finalButton.parentElement === refs.payment) refs.payment.insertBefore(paymentActions, finalButton);
      else refs.payment.appendChild(paymentActions);

      if (finalButton) {
        finalButton.addEventListener("click", function (event) {
          if (!validatePersonal()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setStep(1);
            return;
          }
          if (!validateAddress()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setStep(2);
          }
        }, true);
      }
    }
  }

  function wireFieldValidation() {
    document.addEventListener("input", function (event) {
      if (event.target && event.target.matches("input, textarea")) clearFieldError(event.target);
    }, true);

    document.addEventListener("change", function (event) {
      if (event.target && event.target.matches("select")) clearFieldError(event.target);
    }, true);
  }

  function init() {
    var main = document.querySelector("main.mx-auto");
    if (!main || main.dataset.shop2WizardReady === "true") return;

    var sections = Array.from(main.children).filter(function (node) {
      return node && node.tagName === "SECTION";
    });
    if (sections.length < 5) return;

    refs.summary = sections[0];
    refs.progress = sections[1];
    refs.form = sections[2];
    refs.shipping = sections[3];
    refs.payment = sections[4];
    refs.trust = sections[5];
    refs.personal = refs.form ? refs.form.children[0] : null;
    refs.address = refs.form ? refs.form.children[1] : null;
    refs.progressHeader = refs.progress ? refs.progress.children[0] : null;
    refs.stepItems = refs.progress && refs.progress.children[2] ? Array.from(refs.progress.children[2].children) : [];

    if (!refs.personal || !refs.address || !refs.shipping || !refs.payment) return;

    main.dataset.shop2WizardReady = "true";
    document.body.classList.add("shop2-wizard-ready");
    refs.summary.classList.add("shop2-summary-section");
    refs.progress.classList.add("shop2-progress-section");
    refs.form.classList.add("shop2-form-section");
    refs.personal.classList.add("shop2-step-panel", "shop2-personal-panel");
    refs.address.classList.add("shop2-step-panel", "shop2-address-panel");
    refs.shipping.classList.add("shop2-step-panel", "shop2-shipping-section");
    refs.payment.classList.add("shop2-step-panel", "shop2-payment-section");
    if (refs.trust) refs.trust.classList.add("shop2-trust-section");
    if (refs.progressHeader) refs.progressHeader.classList.add("shop2-progress-header");

    refs.stepItems.forEach(function (item, index) {
      item.dataset.stepIndex = String(index + 1);
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      item.addEventListener("click", function () { setStep(index + 1); });
      item.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setStep(index + 1);
        }
      });
    });

    ensureActions();
    wireFieldValidation();
    setStep(1, false);
  }

  function scheduleInit() {
    window.setTimeout(init, 1200);
    window.setTimeout(init, 2200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleInit);
  else scheduleInit();
})();
