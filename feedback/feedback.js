(function () {
  "use strict";

  var MANAGEMENT_TO = "marco-droit@agentmail.to";
  var MANAGEMENT_CC = "brandon@droitco.com";
  var CORPORATE_TEL = "+18887116050";
  var CORPORATE_PHONE = "(888) 711-6050";
  var REDIRECT_MS = 1800;

  var STORES = [
    {
      slug: "clear-space",
      aliases: ["clearspace"],
      name: "Clear Space Storage Units",
      pill: "Eau Claire",
      cityLine: "Eau Claire, WI",
      address: "2603 Mondovi Rd, Eau Claire, WI 54701",
      phone: "(715) 402-4093",
      tel: "+17154024093",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=Clear+Space+Storage+Units+2603+Mondovi+Rd+Eau+Claire+WI+54701"
    },
    {
      slug: "des-moines",
      aliases: ["desmoines"],
      name: "Des Moines Smart Self Storage",
      pill: "Des Moines",
      cityLine: "Des Moines, IA",
      address: "4400 NE 14th St, Des Moines, IA 50313",
      phone: "(515) 882-5226",
      tel: "+15158825226",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=Des+Moines+Smart+Self+Storage+4400+NE+14th+St+Des+Moines+IA+50313"
    },
    {
      slug: "memphis",
      aliases: [],
      name: "Memphis Smart Self Storage",
      pill: "Memphis",
      cityLine: "Memphis, TN",
      address: "481 E Mallory Ave, Memphis, TN 38109",
      phone: "(901) 726-3367",
      tel: "+19017263367",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=Memphis+Smart+Self+Storage+481+E+Mallory+Ave+Memphis+TN+38109"
    },
    {
      slug: "spokane",
      aliases: [],
      name: "Spokane Smart Storage",
      pill: "Spokane",
      cityLine: "Medical Lake, WA",
      address: "1605 S Fairview Heights Rd, Medical Lake, WA 99022",
      phone: "(509) 608-3143",
      tel: "+15096083143",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=Spokane+Smart+Storage+1605+S+Fairview+Heights+Rd+Medical+Lake+WA+99022"
    },
    {
      slug: "odessa",
      aliases: [],
      name: "Odessa Self Storage & Parking",
      pill: "Odessa",
      cityLine: "Odessa, TX",
      address: "114 Betty Lou Dr, Odessa, TX 79766",
      phone: "(432) 200-0595",
      tel: "+14322000595",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=Odessa+Self+Storage+%26+Parking+114+Betty+Lou+Dr+Odessa+TX+79766"
    },
    {
      slug: "lock-tight",
      aliases: ["locktight"],
      name: "LockTight Self Storage",
      pill: "River Falls",
      cityLine: "River Falls, WI",
      address: "1215 Old Chapman Dr, River Falls, WI 54022",
      phone: "(715) 202-2754",
      tel: "+17152022754",
      googleUrl: "https://www.google.com/maps/search/?api=1&query=LockTight+Self+Storage+1215+Old+Chapman+Dr+River+Falls+WI+54022"
    }
  ];

  var RATINGS = [
    { value: 1, label: "1 - Poor" },
    { value: 2, label: "2 - Fair" },
    { value: 3, label: "3 - Okay" },
    { value: 4, label: "4 - Good" },
    { value: 5, label: "5 - Excellent" }
  ];

  var ALIAS = {};
  STORES.forEach(function (store) {
    ALIAS[store.slug] = store.slug;
    store.aliases.forEach(function (alias) {
      ALIAS[alias] = store.slug;
    });
  });

  var BY_SLUG = {};
  STORES.forEach(function (store) {
    BY_SLUG[store.slug] = store;
  });

  var app = document.getElementById("feedback-app");
  if (!app) return;

  var resolved = resolveStore();
  var state = {
    slug: resolved.slug,
    isHub: resolved.isHub,
    unknown: resolved.unknown,
    rating: 0,
    hover: 0,
    phase: "rate",
    mailto: "",
    sending: false,
    redirectTimer: 0
  };

  var ui = build();
  render();
  canonicalizeQuery();
  window.addEventListener("pagehide", clearRedirect);

  function normalize(value) {
    if (!value) return "";
    var key = String(value).trim().toLowerCase().replace(/[\s_]+/g, "-");
    return ALIAS[key] || "";
  }

  function slugFromPath() {
    var parts = window.location.pathname.split("/").filter(Boolean);
    var index = parts.lastIndexOf("feedback");
    if (index === -1) return "";
    var next = parts[index + 1] || "";
    if (!next || next.toLowerCase() === "index.html") return "";
    return normalize(next.replace(/\.html$/i, ""));
  }

  function resolveStore() {
    var dataSlug = normalize(document.body.dataset.store || "");
    var pathSlug = slugFromPath();
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("store") || "";
    var querySlug = normalize(raw);
    var isHub = !dataSlug && !pathSlug;
    return {
      slug: dataSlug || pathSlug || querySlug || "",
      isHub: isHub,
      unknown: isHub && raw.trim() !== "" && !querySlug,
      raw: raw
    };
  }

  function canonicalizeQuery() {
    if (!state.isHub || !state.slug) return;
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("store");
    if (raw == null || raw === state.slug) return;
    var url = new URL(window.location.href);
    url.searchParams.set("store", state.slug);
    history.replaceState({ store: state.slug }, "", url);
  }

  function currentStore() {
    return state.slug ? BY_SLUG[state.slug] : null;
  }

  function starWord(count) {
    return count === 1 ? "star" : "stars";
  }

  function feedbackEndpoint() {
    var path = window.location.pathname;
    var index = path.indexOf("/feedback");
    var prefix = index > 0 ? path.slice(0, index) : "";
    return prefix + "/api/feedback";
  }

  function timeoutSignal(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    var controller = new AbortController();
    window.setTimeout(function () { controller.abort(); }, ms);
    return controller.signal;
  }

  function buildMailto(store, data) {
    var subject = data.rating + "-star feedback for " + store.name;
    var body = [
      "Facility: " + store.name,
      "City: " + store.cityLine,
      "Address: " + store.address,
      "Rating: " + data.rating + " " + starWord(data.rating),
      "Tenant: " + data.name,
      "Unit: " + (data.unit || "Not provided"),
      "Phone or email: " + data.contact,
      "",
      data.message
    ].join("\n");
    var prefix = "mailto:" + MANAGEMENT_TO + "?cc=" + MANAGEMENT_CC + "&subject=";
    var encodedBody = encodeURIComponent(body);
    var href = prefix + encodeURIComponent(subject) + "&body=" + encodedBody;
    if (href.length <= 1800) return href;
    var note = "\n\n[Message shortened to fit the email draft.]";
    var trimmed = body;
    while (trimmed.length > 80 && (prefix + encodeURIComponent(subject) + "&body=" + encodeURIComponent(trimmed + note)).length > 1800) {
      trimmed = trimmed.slice(0, Math.floor(trimmed.length * 0.75));
    }
    return prefix + encodeURIComponent(subject) + "&body=" + encodeURIComponent(trimmed + note);
  }

  function smsHref(store, data) {
    var lines = [
      store.name + " feedback",
      data.rating ? "Rating: " + data.rating + " " + starWord(data.rating) : "",
      data.name ? "Name: " + data.name : "",
      data.unit ? "Unit: " + data.unit : "",
      data.contact ? "Contact: " + data.contact : "",
      data.message || ""
    ].filter(Boolean);
    return "sms:" + store.tel + "?body=" + encodeURIComponent(lines.join("\n"));
  }

  function collect(store) {
    return {
      facility: store.name,
      slug: store.slug,
      city: store.cityLine,
      address: store.address,
      phone: store.phone,
      rating: state.rating,
      name: ui.nameInput.value.trim(),
      unit: ui.unitInput.value.trim(),
      contact: ui.contactInput.value.trim(),
      message: ui.messageInput.value.trim(),
      to: MANAGEMENT_TO,
      cc: MANAGEMENT_CC
    };
  }

  function contactOk(value) {
    if (value.indexOf("@") !== -1) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    var digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  function validate(data) {
    var errors = [];
    if (data.name.length < 2) errors.push("Enter your name.");
    if (!contactOk(data.contact)) errors.push("Enter a phone number or email so we can reach you.");
    if (!data.message) errors.push("Tell us what happened or what we should fix.");
    return errors;
  }

  function clearRedirect() {
    if (!state.redirectTimer) return;
    window.clearTimeout(state.redirectTimer);
    state.redirectTimer = 0;
  }

  function scheduleRedirect(store) {
    clearRedirect();
    state.redirectTimer = window.setTimeout(function () {
      window.location.assign(store.googleUrl);
    }, REDIRECT_MS);
  }

  function openMailto(href) {
    var link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("data-auto-mailto", "true");
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function postFeedback(payload) {
    fetch(feedbackEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload),
      signal: timeoutSignal(2000)
    }).catch(function () {});
  }

  function focusNode(node) {
    if (!node) return;
    node.tabIndex = -1;
    node.focus();
  }

  function labeledField(labelText, control, optionalText) {
    var label = document.createElement("label");
    var text = document.createElement("span");
    text.appendChild(document.createTextNode(labelText));
    if (optionalText) {
      var optional = document.createElement("span");
      optional.className = "optional";
      optional.textContent = " " + optionalText;
      text.appendChild(optional);
    }
    label.append(text, control);
    return label;
  }

  function svgStar(on) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("star-icon");
    if (on) svg.classList.add("is-on");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "fill");
    path.setAttribute("d", "M12 2.7l2.62 5.31 5.86.85-4.24 4.13 1 5.83L12 16.9l-5.24 2.75 1-5.83L3.52 8.86l5.86-.85L12 2.7z");
    svg.appendChild(path);
    return svg;
  }

  function build() {
    var root = document.createElement("div");
    root.className = "feedback-app";

    var pills = document.createElement("nav");
    pills.className = "facility-pills";
    pills.setAttribute("aria-label", "Choose your facility");
    STORES.forEach(function (store) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.slug = store.slug;
      button.textContent = store.pill;
      button.setAttribute("aria-label", store.name + ", " + store.cityLine);
      pills.appendChild(button);
    });

    var unknown = document.createElement("p");
    unknown.className = "form-alert";
    unknown.hidden = true;
    unknown.textContent = "We could not match that facility. Choose your location below.";

    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Tenant feedback";

    var rule = document.createElement("hr");
    rule.className = "rule";

    var title = document.createElement("h1");
    var sub = document.createElement("p");
    sub.className = "lede";
    sub.id = "rating-subhead";

    var facility = document.createElement("article");
    facility.className = "card facility-card";
    facility.hidden = true;
    var facilityName = document.createElement("h2");
    var facilityCity = document.createElement("p");
    facilityCity.className = "facility-city";
    var facilityStreet = document.createElement("p");
    facilityStreet.className = "facility-street";
    var facilityPhone = document.createElement("a");
    facilityPhone.className = "phone";
    var switchLink = document.createElement("p");
    switchLink.className = "switch-facility";
    var switchAnchor = document.createElement("a");
    switchAnchor.href = "../";
    switchAnchor.textContent = "Different facility";
    switchLink.appendChild(switchAnchor);
    facility.append(facilityName, facilityCity, facilityStreet, facilityPhone, switchLink);

    var rating = document.createElement("div");
    rating.className = "rating-block";
    rating.hidden = true;
    var starList = document.createElement("div");
    starList.className = "star-list";
    starList.setAttribute("role", "radiogroup");
    starList.setAttribute("aria-labelledby", "rating-subhead");
    RATINGS.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "star-btn";
      button.dataset.value = String(item.value);
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", "false");
      button.setAttribute("aria-label", item.label);
      var glyphs = document.createElement("span");
      glyphs.className = "star-glyphs";
      glyphs.setAttribute("aria-hidden", "true");
      glyphs.appendChild(svgStar(false));
      var caption = document.createElement("span");
      caption.className = "star-caption";
      caption.appendChild(document.createTextNode(String(item.value) + " -"));
      caption.appendChild(document.createElement("br"));
      caption.appendChild(document.createTextNode(item.label.split(" - ")[1]));
      button.append(glyphs, caption);
      starList.appendChild(button);
    });
    rating.appendChild(starList);

    var status = document.createElement("div");
    status.className = "visually-hidden";
    status.setAttribute("aria-live", "polite");

    var positive = document.createElement("section");
    positive.className = "card outcome fb-reveal";
    positive.hidden = true;
    var positiveEyebrow = document.createElement("p");
    positiveEyebrow.className = "eyebrow";
    positiveEyebrow.textContent = "Google review";
    var thanksHeading = document.createElement("h2");
    var thanksCopy = document.createElement("p");
    thanksCopy.textContent = "As a local storage operator, Google reviews make a huge difference for our facility. Would you take 15 seconds to share your rating on Google?";
    var thanksNote = document.createElement("p");
    thanksNote.className = "redirect-note";
    thanksNote.textContent = "Opening Google in a moment. You can also go now.";
    var googleLink = document.createElement("a");
    googleLink.className = "btn";
    googleLink.id = "google-review";
    googleLink.textContent = "Post My Review on Google →";
    positive.append(positiveEyebrow, thanksHeading, thanksCopy, thanksNote, googleLink);

    var form = document.createElement("form");
    form.className = "card outcome feedback-form fb-reveal";
    form.hidden = true;
    form.noValidate = true;
    form.setAttribute("aria-labelledby", "private-heading");
    var formHeading = document.createElement("h2");
    formHeading.id = "private-heading";
    formHeading.textContent = "Tell Management Directly So We Can Make It Right";
    var formIntro = document.createElement("p");
    formIntro.textContent = "This note goes to local management, not to a public review.";
    var formAlert = document.createElement("div");
    formAlert.className = "form-alert";
    formAlert.hidden = true;
    formAlert.setAttribute("role", "alert");

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.name = "tenant_name";
    nameInput.autocomplete = "name";
    nameInput.required = true;
    nameInput.maxLength = 120;
    var nameLabel = labeledField("Tenant name", nameInput);

    var unitInput = document.createElement("input");
    unitInput.type = "text";
    unitInput.name = "unit";
    unitInput.autocomplete = "off";
    unitInput.maxLength = 40;
    var unitLabel = labeledField("Unit number", unitInput, "(optional)");

    var contactInput = document.createElement("input");
    contactInput.type = "text";
    contactInput.name = "contact";
    contactInput.autocomplete = "on";
    contactInput.required = true;
    contactInput.maxLength = 120;
    contactInput.autocapitalize = "off";
    contactInput.spellcheck = false;
    var contactLabel = labeledField("Phone or email", contactInput);

    var messageInput = document.createElement("textarea");
    messageInput.name = "message";
    messageInput.required = true;
    messageInput.maxLength = 4000;
    messageInput.rows = 5;
    var messageLabel = labeledField("What happened or what can we fix on your unit/account right away?", messageInput);

    var actions = document.createElement("div");
    actions.className = "feedback-actions";
    var submitButton = document.createElement("button");
    submitButton.className = "btn";
    submitButton.type = "submit";
    submitButton.textContent = "Send Directly to Management";
    var smsLink = document.createElement("a");
    smsLink.className = "btn ghost";
    smsLink.id = "sms-facility";
    smsLink.textContent = "Text this facility";
    var callLink = document.createElement("a");
    callLink.className = "btn ghost";
    callLink.id = "call-facility";
    actions.append(submitButton, smsLink, callLink);
    form.append(formHeading, formIntro, formAlert, nameLabel, unitLabel, contactLabel, messageLabel, actions);

    var sent = document.createElement("section");
    sent.className = "card outcome fb-reveal";
    sent.hidden = true;
    var sentEyebrow = document.createElement("p");
    sentEyebrow.className = "eyebrow";
    sentEyebrow.textContent = "Direct to management";
    var sentHeading = document.createElement("h2");
    sentHeading.textContent = "Management has been alerted";
    var sentBody = document.createElement("p");
    var sentNext = document.createElement("p");
    var sentActions = document.createElement("div");
    sentActions.className = "feedback-actions";
    var emailLink = document.createElement("a");
    emailLink.className = "btn";
    emailLink.id = "email-management";
    emailLink.textContent = "Email management";
    var sentSms = document.createElement("a");
    sentSms.className = "btn ghost";
    sentSms.id = "sms-facility-sent";
    sentSms.textContent = "Text this facility";
    var sentCall = document.createElement("a");
    sentCall.className = "btn ghost";
    sentCall.id = "call-facility-sent";
    sentActions.append(emailLink, sentSms, sentCall);
    sent.append(sentEyebrow, sentHeading, sentBody, sentNext, sentActions);

    root.append(pills, unknown, eyebrow, rule, facility, title, sub, rating, status, positive, form, sent);
    app.appendChild(root);

    pills.addEventListener("click", onPill);
    starList.addEventListener("click", onStarClick);
    starList.addEventListener("keydown", onStarKey);
    starList.addEventListener("pointerover", onStarHover);
    starList.addEventListener("pointerleave", onStarHoverEnd);
    googleLink.addEventListener("click", clearRedirect);
    form.addEventListener("submit", onSubmit);
    form.addEventListener("input", function () {
      var store = currentStore();
      if (store) refreshDirectLinks(store);
    });

    return {
      pills: pills,
      unknown: unknown,
      title: title,
      sub: sub,
      facility: facility,
      facilityName: facilityName,
      facilityCity: facilityCity,
      facilityStreet: facilityStreet,
      facilityPhone: facilityPhone,
      switchLink: switchLink,
      rating: rating,
      starList: starList,
      status: status,
      positive: positive,
      thanksHeading: thanksHeading,
      googleLink: googleLink,
      form: form,
      formAlert: formAlert,
      formHeading: formHeading,
      nameInput: nameInput,
      unitInput: unitInput,
      contactInput: contactInput,
      messageInput: messageInput,
      submitButton: submitButton,
      smsLink: smsLink,
      callLink: callLink,
      sent: sent,
      sentHeading: sentHeading,
      sentBody: sentBody,
      sentNext: sentNext,
      emailLink: emailLink,
      sentSms: sentSms,
      sentCall: sentCall
    };
  }

  function onPill(event) {
    var button = event.target.closest("button[data-slug]");
    if (!button) return;
    var slug = button.dataset.slug;
    if (!slug || slug === state.slug) return;
    clearRedirect();
    state.slug = slug;
    state.unknown = false;
    state.rating = 0;
    state.phase = "rate";
    state.mailto = "";
    ui.nameInput.value = "";
    ui.unitInput.value = "";
    ui.contactInput.value = "";
    ui.messageInput.value = "";
    showErrors([]);
    if (state.isHub) {
      var url = new URL(window.location.href);
      url.searchParams.set("store", slug);
      history.replaceState({ store: slug }, "", url);
    }
    render();
    focusNode(ui.title);
  }

  function onStarHover(event) {
    if (event.pointerType === "touch") return;
    var button = event.target.closest(".star-btn");
    if (!button) return;
    state.hover = Number(button.dataset.value);
    paintStars();
  }

  function onStarHoverEnd() {
    if (!state.hover) return;
    state.hover = 0;
    paintStars();
  }

  function onStarClick(event) {
    var button = event.target.closest(".star-btn");
    if (!button) return;
    commitRating(Number(button.dataset.value), "panel");
  }

  function onStarKey(event) {
    var current = event.target.closest(".star-btn");
    if (!current) return;
    var key = event.key;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      commitRating(Number(current.dataset.value), "panel");
      return;
    }
    var next = 0;
    if (key === "ArrowRight" || key === "ArrowDown") {
      next = Number(current.dataset.value) === 5 ? 1 : Number(current.dataset.value) + 1;
    } else if (key === "ArrowLeft" || key === "ArrowUp") {
      next = Number(current.dataset.value) === 1 ? 5 : Number(current.dataset.value) - 1;
    } else if (key === "Home") {
      next = 1;
    } else if (key === "End") {
      next = 5;
    } else {
      return;
    }
    event.preventDefault();
    commitRating(next, "stay");
    var target = ui.starList.querySelector('[data-value="' + next + '"]');
    if (target) target.focus();
  }

  function commitRating(value, focusMode) {
    if (!currentStore() || value < 1 || value > 5) return;
    clearRedirect();
    state.rating = value;
    if (value >= 4) {
      state.phase = "positive";
      scheduleRedirect(currentStore());
    } else {
      state.phase = "form";
    }
    render();
    if (value >= 4) {
      ui.status.textContent = "You selected " + value + " stars. Opening Google reviews.";
      if (focusMode === "panel") focusNode(ui.thanksHeading);
    } else {
      ui.status.textContent = "You selected " + value + " " + starWord(value) + ". Tell management directly so we can make it right.";
      if (focusMode === "panel") focusNode(ui.formHeading);
    }
  }

  function showErrors(errors) {
    ui.formAlert.replaceChildren();
    if (!errors.length) {
      ui.formAlert.hidden = true;
      return;
    }
    var list = document.createElement("ul");
    errors.forEach(function (message) {
      var item = document.createElement("li");
      item.textContent = message;
      list.appendChild(item);
    });
    ui.formAlert.hidden = false;
    ui.formAlert.appendChild(list);
  }

  function refreshDirectLinks(store) {
    var data = collect(store);
    var sms = smsHref(store, data);
    var call = "tel:" + store.tel;
    ui.smsLink.href = sms;
    ui.callLink.href = call;
    ui.callLink.textContent = "Call " + store.phone;
    ui.sentSms.href = sms;
    ui.sentCall.href = call;
    ui.sentCall.textContent = "Call " + store.phone;
    if (state.mailto) ui.emailLink.setAttribute("href", state.mailto);
  }

  function syncHeaderPhone(store) {
    var link = document.querySelector(".header-phone");
    if (!link) return;
    if (!store) {
      link.href = "tel:" + CORPORATE_TEL;
      link.textContent = CORPORATE_PHONE;
      return;
    }
    link.href = "tel:" + store.tel;
    link.textContent = store.phone;
  }

  function paintStars() {
    var lit = state.hover || state.rating;
    var buttons = ui.starList.querySelectorAll(".star-btn");
    buttons.forEach(function (button) {
      var value = Number(button.dataset.value);
      var selected = state.rating === value;
      var on = lit > 0 && value <= lit;
      button.setAttribute("aria-checked", selected ? "true" : "false");
      button.classList.toggle("is-lit", on);
      var icon = button.querySelector(".star-icon");
      if (icon) icon.classList.toggle("is-on", on);
      var tab = selected || (!state.rating && value === 1);
      button.tabIndex = tab ? 0 : -1;
    });
  }

  function render() {
    var store = currentStore();
    syncHeaderPhone(store);
    ui.pills.hidden = !state.isHub;
    ui.pills.querySelectorAll("button").forEach(function (button) {
      var pressed = button.dataset.slug === state.slug;
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
    ui.unknown.hidden = !state.unknown;

    if (!store) {
      ui.title.textContent = "Which facility are you visiting?";
      ui.sub.textContent = "Choose your location, then rate your storage experience from 1 to 5 stars.";
      document.title = "Rate your storage experience | Droit";
      ui.facility.hidden = true;
      ui.rating.hidden = true;
      ui.positive.hidden = true;
      ui.form.hidden = true;
      ui.sent.hidden = true;
      return;
    }

    ui.title.textContent = "How has your storage experience been at " + store.name + "?";
    ui.sub.textContent = "Tap a star below to rate your experience (1 to 5 stars).";
    document.title = "Rate " + store.name + " | Droit";
    ui.facilityName.textContent = store.name;
    ui.facilityCity.textContent = store.cityLine;
    ui.facilityStreet.textContent = store.address;
    ui.facilityPhone.href = "tel:" + store.tel;
    ui.facilityPhone.textContent = store.phone;
    ui.switchLink.hidden = state.isHub;
    ui.facility.hidden = false;
    ui.rating.hidden = state.phase === "sent";
    paintStars();

    ui.positive.hidden = state.phase !== "positive";
    ui.form.hidden = state.phase !== "form";
    ui.sent.hidden = state.phase !== "sent";

    if (state.phase === "positive") {
      ui.thanksHeading.textContent = "Thank you for the " + state.rating + "-star rating!";
      ui.googleLink.setAttribute("href", store.googleUrl);
    }
    if (state.phase === "form" || state.phase === "sent") {
      refreshDirectLinks(store);
    }
    if (state.phase === "sent") {
      ui.sentBody.textContent = "Your " + state.rating + "-star note about " + store.name + " is with local management so we can make it right. If an email draft opened, tap Send to finish delivering it.";
      ui.sentNext.textContent = "You can also text or call the facility now at " + store.phone + ".";
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (state.sending) return;
    var store = currentStore();
    if (!store || state.rating < 1 || state.rating > 3) return;
    var data = collect(store);
    var errors = validate(data);
    if (errors.length) {
      showErrors(errors);
      focusNode(ui.formAlert);
      return;
    }
    showErrors([]);
    state.sending = true;
    ui.submitButton.disabled = true;
    state.mailto = buildMailto(store, data);
    openMailto(state.mailto);
    postFeedback(data);
    state.phase = "sent";
    render();
    ui.status.textContent = "Management has been alerted about your " + state.rating + "-star note.";
    focusNode(ui.sentHeading);
    state.sending = false;
    ui.submitButton.disabled = false;
  }
})();
