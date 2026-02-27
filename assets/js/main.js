document.addEventListener("DOMContentLoaded", async () => {

  /* LOAD PARTIALS */
  const includes = document.querySelectorAll("[data-include]");

  const includeTasks = Array.from(includes).map(async el => {
    const file = el.getAttribute("data-include");
    if (!file) return;

    try {
      const response = await fetch(file);
      if (!response.ok) {
        console.error(`Failed to load partial: ${file} (${response.status})`);
        return;
      }
      el.innerHTML = await response.text();
    } catch (error) {
      console.error(`Failed to load partial: ${file}`, error);
    }
  });
  await Promise.all(includeTasks);

/*  */
document.dispatchEvent(new Event("partialsLoaded"));


  /* HEADER SCROLL */
  const header = document.querySelector(".header");
  const root = document.documentElement;

  function syncHeaderHeight() {
    if (!header) return;
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    root.style.setProperty("--header-h", `${headerHeight}px`);
  }

  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);
  window.addEventListener("orientationchange", syncHeaderHeight);
  requestAnimationFrame(syncHeaderHeight);

  if (header) {
    function syncHeaderScrolledState() {
      if (window.scrollY > 20) {
        header.classList.add("header--scrolled");
      } else {
        header.classList.remove("header--scrolled");
      }
    }

    window.addEventListener("scroll", syncHeaderScrolledState, { passive: true });
    syncHeaderScrolledState();
  }

  /* MOBILE MENU */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuClose = document.getElementById("menuClose");
  const desktopMq = window.matchMedia("(min-width: 1024px)");

  if (!burger || !mobileMenu) {
    console.error("Burger or mobile menu not found");
    return;
  }

  function setMobileMenuState(isOpen) {
    mobileMenu.classList.toggle("active", isOpen);
    mobileMenu.hidden = !isOpen;
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    burger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
    document.dispatchEvent(new Event("mobileMenuStateChange"));
  }

  function closeMobileMenu() {
    setMobileMenuState(false);
  }

  function syncMenuForViewport() {
    if (desktopMq.matches) {
      closeMobileMenu();
    }
  }

  burger.addEventListener("click", () => {
    const nextState = burger.getAttribute("aria-expanded") !== "true";
    setMobileMenuState(nextState);
  });

  if (menuClose) {
    menuClose.addEventListener("click", () => {
      closeMobileMenu();
    });
  }

  // Close mobile menu on menu navigation click
  document.querySelectorAll(".nav--mobile .menu-card").forEach(link => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  // Close mobile menu on CTA click
  const cta = document.querySelector(".nav--mobile .menu-cta");
  if (cta) {
    cta.addEventListener("click", () => {
      closeMobileMenu();
    });
  }

  // Enforce initial accessible state
  setMobileMenuState(false);
  syncMenuForViewport();

  if (typeof desktopMq.addEventListener === "function") {
    desktopMq.addEventListener("change", syncMenuForViewport);
  } else {
    desktopMq.addListener(syncMenuForViewport);
  }

});

const COOKIE_NOTICE_STORAGE_KEY = "tilewizards_cookie_notice_accepted";
const ANALYTICS_BOOTSTRAP_SRC = "https://www.googletagmanager.com/gtag/js?id=";
const LEADS_RATE_LIMIT_STORAGE_KEY = "tilewizards_last_lead_submit_at";
const LEADS_MIN_INTERVAL_MS = 15000;

function readLocalStorageValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function writeLocalStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
}

function hasAnalyticsConsent() {
  return readLocalStorageValue(COOKIE_NOTICE_STORAGE_KEY) === "true";
}

function getLeadsWebhookUrl() {
  if (typeof window.GAS_WEBHOOK_URL === "string" && window.GAS_WEBHOOK_URL.trim()) {
    return window.GAS_WEBHOOK_URL.trim();
  }
  if (typeof window.LEADS_WEBHOOK_URL === "string") {
    return window.LEADS_WEBHOOK_URL.trim();
  }
  return "";
}

function getGaMeasurementId() {
  if (typeof window.GA_MEASUREMENT_ID !== "string") return "";
  return window.GA_MEASUREMENT_ID.trim();
}

let analyticsInitialized = false;

function initAnalytics() {
  if (analyticsInitialized) return;
  if (!hasAnalyticsConsent()) return;

  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true
  });

  const existingLoader = document.querySelector(
    `script[data-analytics-loader="ga4"][data-ga-id="${measurementId}"]`
  );

  if (!existingLoader) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `${ANALYTICS_BOOTSTRAP_SRC}${encodeURIComponent(measurementId)}`;
    script.setAttribute("data-analytics-loader", "ga4");
    script.setAttribute("data-ga-id", measurementId);
    document.head.appendChild(script);
  }

  analyticsInitialized = true;
}

let trackingInitialized = false;

function sendTrackingEvent(eventName, params = {}) {
  if (!hasAnalyticsConsent()) return;
  initAnalytics();

  const payload = {
    event: eventName,
    page_path: window.location.pathname,
    ...params
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }
}

function isCtaElement(el) {
  if (!el) return false;
  return (
    el.classList.contains("btn") ||
    el.classList.contains("menu-cta") ||
    el.hasAttribute("data-track-cta")
  );
}

function initTracking() {
  if (trackingInitialized) return;
  trackingInitialized = true;

  document.addEventListener("click", e => {
    const target = e.target.closest("a,button");
    if (!target) return;

    const href = target.getAttribute("href") || "";

    if (href.startsWith("tel:")) {
      sendTrackingEvent("phone_click", {
        phone_number: href.replace("tel:", "")
      });
      return;
    }

    if (isCtaElement(target)) {
      sendTrackingEvent("cta_click", {
        cta_text: (target.textContent || "").trim(),
        cta_href: href || "",
        cta_id: target.id || "",
        cta_classes: target.className || ""
      });
    }
  });

  document.addEventListener("submit", e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.classList.contains("contact__form")) return;

    const projectType = form.querySelector('select[name="project_type"]');
    sendTrackingEvent("form_submit", {
      form_name: "contact_estimate",
      project_type: projectType ? projectType.value : ""
    });
  });
}

document.addEventListener("partialsLoaded", initTracking);

let contactFormSubmissionInitialized = false;

function setContactFormStatus(statusNode, state, message) {
  if (!statusNode) return;
  statusNode.hidden = !message;
  statusNode.dataset.state = state || "info";
  statusNode.textContent = message || "";
}

function getContactSubmitCooldownMs() {
  const lastSubmitRaw = readLocalStorageValue(LEADS_RATE_LIMIT_STORAGE_KEY);
  const lastSubmitAt = Number(lastSubmitRaw);
  if (!Number.isFinite(lastSubmitAt) || lastSubmitAt <= 0) return 0;
  return Math.max(0, LEADS_MIN_INTERVAL_MS - (Date.now() - lastSubmitAt));
}

function initContactFormSubmission() {
  if (contactFormSubmissionInitialized) return;

  const form = document.querySelector(".contact__form");
  if (!(form instanceof HTMLFormElement)) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusNode = form.querySelector("[data-form-status]");
  const consentCheckbox = form.querySelector('input[name="privacy_consent"]');
  const consentErrorNode = form.querySelector("[data-consent-error]");
  const defaultSubmitText = submitBtn ? submitBtn.textContent : "";

  function setSubmittingState(isSubmitting) {
    if (!(submitBtn instanceof HTMLButtonElement)) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.setAttribute("aria-busy", String(isSubmitting));
    submitBtn.textContent = isSubmitting ? "Sending..." : defaultSubmitText;
  }

  function setConsentError(message) {
    if (!consentErrorNode) return;
    consentErrorNode.hidden = !message;
    consentErrorNode.textContent = message || "";
  }

  function validateConsent() {
    if (!(consentCheckbox instanceof HTMLInputElement)) return true;
    const isAccepted = consentCheckbox.checked;
    consentCheckbox.setAttribute("aria-invalid", isAccepted ? "false" : "true");
    setConsentError(isAccepted ? "" : "Please accept the Privacy Policy to continue.");
    return isAccepted;
  }

  if (consentCheckbox instanceof HTMLInputElement) {
    consentCheckbox.addEventListener("change", () => {
      if (consentCheckbox.checked) {
        consentCheckbox.setAttribute("aria-invalid", "false");
        setConsentError("");
      }
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const endpoint = getLeadsWebhookUrl();
    if (!endpoint) {
      setContactFormStatus(
        statusNode,
        "warn",
        "Form is temporarily unavailable. Please call +1 (437) 299-8387."
      );
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    if (!validateConsent()) {
      if (consentCheckbox instanceof HTMLInputElement) {
        consentCheckbox.focus();
      }
      return;
    }

    const remainingCooldownMs = getContactSubmitCooldownMs();
    if (remainingCooldownMs > 0) {
      const seconds = Math.ceil(remainingCooldownMs / 1000);
      setContactFormStatus(
        statusNode,
        "warn",
        `Please wait ${seconds}s before sending another request.`
      );
      return;
    }

    const payload = new URLSearchParams();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const projectType = String(formData.get("project_type") || "").trim();
    const projectDetails = String(formData.get("project_details") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const privacyConsent = formData.get("privacy_consent") ? "accepted" : "";
    const sourcePage = window.location.href;

    payload.append("name", name);
    payload.append("phone", phone);
    payload.append("project_type", projectType);
    payload.append("project_details", projectDetails);
    payload.append("source_page", sourcePage);
    payload.append("company", company);
    payload.append("privacy_consent", privacyConsent);

    setSubmittingState(true);
    setContactFormStatus(statusNode, "info", "");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: payload.toString()
      });

      const rawResponse = await response.text();
      let responseJson = null;
      try {
        responseJson = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error("Lead form response is not valid JSON.", parseError, rawResponse);
        throw new Error("Invalid JSON response");
      }

      if (!response.ok) {
        const serverError = responseJson && typeof responseJson.error === "string"
          ? responseJson.error
          : `HTTP ${response.status}`;
        throw new Error(serverError);
      }

      if (responseJson && responseJson.ok === false) {
        const serverError = typeof responseJson.error === "string"
          ? responseJson.error
          : "Apps Script returned an error";
        throw new Error(serverError);
      }

      writeLocalStorageValue(LEADS_RATE_LIMIT_STORAGE_KEY, String(Date.now()));
      setContactFormStatus(
        statusNode,
        "ok",
        "Thanks. We received your request and will contact you within 24 hours."
      );
      sendTrackingEvent("lead_submit_success", {
        form_name: "contact_estimate_google_sheets"
      });
      form.reset();
      if (consentCheckbox instanceof HTMLInputElement) {
        consentCheckbox.setAttribute("aria-invalid", "false");
      }
      setConsentError("");
    } catch (error) {
      console.error("Lead form submission failed.", error);
      setContactFormStatus(
        statusNode,
        "error",
        "Request failed to send. Please call +1 (437) 299-8387."
      );
      sendTrackingEvent("lead_submit_error", {
        form_name: "contact_estimate_google_sheets"
      });
    } finally {
      setSubmittingState(false);
    }
  });

  contactFormSubmissionInitialized = true;
}

document.addEventListener("partialsLoaded", initContactFormSubmission);

let cookieNoticeInitialized = false;

function initCookieNotice() {
  if (cookieNoticeInitialized) return;

  const notice = document.getElementById("cookieNotice");
  const acceptBtn = document.getElementById("cookieNoticeAccept");
  if (!notice || !acceptBtn) return;

  cookieNoticeInitialized = true;

  const alreadyAccepted = hasAnalyticsConsent();
  const emitNoticeStateChange = () => {
    document.dispatchEvent(new Event("cookieNoticeStateChange"));
  };

  if (!alreadyAccepted) {
    notice.hidden = false;
  }
  initAnalytics();
  emitNoticeStateChange();

  acceptBtn.addEventListener("click", () => {
    writeLocalStorageValue(COOKIE_NOTICE_STORAGE_KEY, "true");
    initAnalytics();
    notice.hidden = true;
    emitNoticeStateChange();
  });
}

document.addEventListener("partialsLoaded", initCookieNotice);
document.addEventListener("partialsLoaded", initAnalytics);

let stickyCtaInitialized = false;

function initMobileStickyCta() {
  if (stickyCtaInitialized) return;

  const sticky = document.getElementById("mobileStickyCta");
  const toggle = document.getElementById("mobileStickyCtaToggle");
  const panel = document.getElementById("mobileStickyCtaPanel");
  if (!sticky || !toggle || !panel) return;

  stickyCtaInitialized = true;

  const mobileMq = window.matchMedia("(max-width: 767.98px)");
  const cookieNotice = document.getElementById("cookieNotice");

  const contactSection = document.getElementById("contact");
  const footerSection = document.querySelector(".footer");

  function setOpen(isOpen) {
    sticky.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  function setHiddenState(isHidden) {
    sticky.classList.toggle("is-hidden", isHidden);
    sticky.setAttribute("aria-hidden", String(sticky.hidden || isHidden));
    if (isHidden) setOpen(false);
  }

  function shouldHideOnContent() {
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const contactTop = contactSection ? contactSection.getBoundingClientRect().top : Infinity;
    const footerTop = footerSection ? footerSection.getBoundingClientRect().top : Infinity;
    return contactTop <= viewportH * 0.8 || footerTop <= viewportH;
  }

  function isCookieNoticeVisible() {
    return Boolean(cookieNotice && !cookieNotice.hidden);
  }

  function syncStickyState() {
    const isMobile = mobileMq.matches;
    sticky.hidden = !isMobile;
    sticky.setAttribute("aria-hidden", String(!isMobile));
    if (!isMobile) {
      setOpen(false);
      return;
    }

    if (document.body.classList.contains("menu-open")) {
      setHiddenState(true);
      return;
    }

    if (window.innerHeight < 560) {
      setHiddenState(true);
      return;
    }

    if (isCookieNoticeVisible()) {
      setHiddenState(true);
      return;
    }

    if (shouldHideOnContent()) {
      setHiddenState(true);
      return;
    }

    const passedIntro = window.scrollY > Math.min(window.innerHeight * 0.45, 320);
    setHiddenState(!passedIntro);
  }

  toggle.addEventListener("click", () => {
    if (sticky.classList.contains("is-hidden")) return;
    setOpen(!sticky.classList.contains("is-open"));
  });

  panel.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      setOpen(false);
    });
  });

  document.addEventListener("click", e => {
    if (!sticky.contains(e.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  });

  window.addEventListener("scroll", syncStickyState, { passive: true });
  window.addEventListener("resize", syncStickyState);
  document.addEventListener("cookieNoticeStateChange", syncStickyState);
  document.addEventListener("mobileMenuStateChange", syncStickyState);
  syncStickyState();
}

document.addEventListener("partialsLoaded", initMobileStickyCta);

let touchFeedbackInitialized = false;

function initTouchFeedback() {
  if (touchFeedbackInitialized) return;
  touchFeedbackInitialized = true;

  const touchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!touchDevice || typeof navigator.vibrate !== "function") return;

  document.addEventListener(
    "click",
    e => {
      const target = e.target.closest("a,button");
      if (!target) return;
      navigator.vibrate(10);
    },
    { passive: true }
  );
}

document.addEventListener("partialsLoaded", initTouchFeedback);

function initLazyImages() {
  const lazyCandidates = document.querySelectorAll("img:not([loading])");
  lazyCandidates.forEach(img => {
    if (img.closest(".hero") || img.closest(".header")) return;
    img.loading = "lazy";
    img.decoding = "async";
  });
}

document.addEventListener("partialsLoaded", initLazyImages);

document.addEventListener("partialsLoaded", () => {
  const items = document.querySelectorAll(".js-reveal");
  if (!items.length) return;

  items.forEach(el => el.classList.add("is-hidden"));

  function revealOnScroll() {
    const trigger = window.innerHeight * 0.9;

    items.forEach(el => {
      if (el.getBoundingClientRect().top < trigger) {
        el.classList.add("is-visible");
        el.classList.remove("is-hidden");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll, { passive: true });
  revealOnScroll();
});

/* ===============================
   FAQ ACCORDION
================================ */

document.addEventListener("partialsLoaded", () => {
  const faqItems = document.querySelectorAll(".faq__item");
  if (!faqItems.length) return;

  function closeItem(item) {
    const question = item.querySelector(".faq__question");
    const answer = item.querySelector(".faq__answer");
    item.classList.remove("active");
    if (question) question.setAttribute("aria-expanded", "false");
    if (answer) {
      answer.style.maxHeight = null;
      answer.setAttribute("aria-hidden", "true");
    }
  }

  function openItem(item) {
    const question = item.querySelector(".faq__question");
    const answer = item.querySelector(".faq__answer");
    item.classList.add("active");
    if (question) question.setAttribute("aria-expanded", "true");
    if (answer) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
      answer.setAttribute("aria-hidden", "false");
    }
  }

  function syncActiveFaqHeights() {
    faqItems.forEach(item => {
      if (!item.classList.contains("active")) return;
      const answer = item.querySelector(".faq__answer");
      if (!answer) return;
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  }

  let faqAnswerIdCounter = 1;
  faqItems.forEach(item => {
    const question = item.querySelector(".faq__question");
    const answer = item.querySelector(".faq__answer");
    if (!question || !answer) return;

    const answerId = `faq-answer-${faqAnswerIdCounter}`;
    faqAnswerIdCounter += 1;

    answer.id = answerId;
    answer.setAttribute("aria-hidden", "true");
    question.setAttribute("aria-controls", answerId);
    question.setAttribute("aria-expanded", "false");

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      faqItems.forEach(closeItem);

      if (!isActive) {
        openItem(item);
      }
    });
  });

  
  if (window.location.hash === "#faq") {
    const featured = document.querySelector(".faq__item--featured");
    if (featured) {
      faqItems.forEach(closeItem);
      openItem(featured);
    }
  }

  window.addEventListener("resize", syncActiveFaqHeights);
  window.addEventListener("orientationchange", syncActiveFaqHeights);
});



let anchorNavigationInitialized = false;

function normalizePathname(pathname) {
  if (typeof pathname !== "string" || !pathname) return "/";
  let cleanPath = pathname.replace(/\/{2,}/g, "/");
  if (cleanPath.endsWith("/index.html")) {
    cleanPath = cleanPath.slice(0, -"/index.html".length) || "/";
  }
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }
  return cleanPath || "/";
}

function getTargetFromHash(hash) {
  if (typeof hash !== "string" || !hash.startsWith("#") || hash.length < 2) return null;
  let targetId = hash.slice(1);
  try {
    targetId = decodeURIComponent(targetId);
  } catch (_error) {
    // no-op: keep original encoded hash value
  }
  return document.getElementById(targetId);
}

function isAnchorLinkHref(href) {
  if (!href) return false;
  return !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("javascript:") && href.includes("#");
}

function closeMobileMenuForAnchorNavigation() {
  const mobileMenu = document.getElementById("mobileMenu");
  const burger = document.getElementById("burger");
  if (!mobileMenu) return;

  mobileMenu.classList.remove("active");
  mobileMenu.hidden = true;
  mobileMenu.setAttribute("aria-hidden", "true");
  if (burger) burger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  document.dispatchEvent(new Event("mobileMenuStateChange"));
}

function syncHomeAnchorLabel(link, isLocalTarget) {
  if (!(link instanceof HTMLAnchorElement)) return;

  const localLabel = (link.dataset.localLabel || "").trim();
  const homeLabel = (link.dataset.homeLabel || "").trim();
  if (!localLabel || !homeLabel) return;

  const nextLabel = isLocalTarget ? localLabel : homeLabel;
  const labelNode = link.querySelector("[data-home-anchor-label]");
  if (labelNode) {
    labelNode.textContent = nextLabel;
  } else {
    link.textContent = nextLabel;
  }
  link.setAttribute("aria-label", nextLabel);
}

function normalizeAnchorLinksForCurrentPage() {
  const currentPath = normalizePathname(window.location.pathname);
  const currentDirPath = normalizePathname(window.location.pathname.replace(/[^/]*$/, ""));
  const currentIndexPath = normalizePathname(window.location.pathname.replace(/[^/]*$/, "index.html"));

  document.querySelectorAll('a[href*="#"]').forEach(link => {
    const sourceHref = link.dataset.originalHref || link.getAttribute("href") || "";
    if (!isAnchorLinkHref(sourceHref)) return;

    if (!link.dataset.originalHref) {
      link.dataset.originalHref = sourceHref;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(sourceHref, window.location.href);
    } catch (_error) {
      return;
    }

    if (parsedUrl.origin !== window.location.origin || !parsedUrl.hash) {
      syncHomeAnchorLabel(link, false);
      return;
    }

    const linkPath = normalizePathname(parsedUrl.pathname);
    const mayPointToCurrentDoc =
      linkPath === currentPath || linkPath === currentDirPath || linkPath === currentIndexPath;
    if (!mayPointToCurrentDoc) {
      link.setAttribute("href", sourceHref);
      syncHomeAnchorLabel(link, false);
      return;
    }

    const target = getTargetFromHash(parsedUrl.hash);
    if (!target) {
      link.setAttribute("href", sourceHref);
      syncHomeAnchorLabel(link, false);
      return;
    }

    link.setAttribute("href", parsedUrl.hash);
    syncHomeAnchorLabel(link, true);
  });
}

function initAnchorNavigation() {
  if (anchorNavigationInitialized) return;
  anchorNavigationInitialized = true;

  document.addEventListener("click", e => {
    const link = e.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!isAnchorLinkHref(href)) return;

    let parsedUrl;
    try {
      parsedUrl = new URL(href, window.location.href);
    } catch (_error) {
      return;
    }

    if (parsedUrl.origin !== window.location.origin || !parsedUrl.hash) return;
    if (normalizePathname(parsedUrl.pathname) !== normalizePathname(window.location.pathname)) return;

    const target = getTargetFromHash(parsedUrl.hash);
    if (!target) return;

    e.preventDefault();

    if (window.location.hash !== parsedUrl.hash) {
      window.history.pushState(null, "", parsedUrl.hash);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });

    closeMobileMenuForAnchorNavigation();
  });
}

document.addEventListener("partialsLoaded", () => {
  normalizeAnchorLinksForCurrentPage();
  initAnchorNavigation();

  if (window.location.hash) {
    const target = getTargetFromHash(window.location.hash);
    if (target) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }, 120);
    }
  }
});

let beforeAfterComparisonsInitialized = false;

function initBeforeAfterComparisons() {
  const widgets = document.querySelectorAll("[data-before-after]");
  if (!widgets.length) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  widgets.forEach((widget, index) => {
    if (!(widget instanceof HTMLElement)) return;
    if (widget.dataset.beforeAfterReady === "true") return;

    const range = widget.querySelector(".before-after__range");
    if (!(range instanceof HTMLInputElement)) return;

    const setPosition = value => {
      const numeric = Number(value);
      const safeValue = Math.min(100, Math.max(0, Number.isFinite(numeric) ? numeric : 50));
      widget.style.setProperty("--position", `${safeValue}%`);
      range.value = String(safeValue);
    };

    const setPositionFromPointer = clientX => {
      const rect = widget.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = (clientX - rect.left) / rect.width;
      setPosition(Math.round(ratio * 100));
    };

    let isDragging = false;

    widget.addEventListener("pointerdown", e => {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      widget.dataset.beforeAfterInteracted = "true";
      widget.classList.add("is-dragging");
      if (typeof widget.setPointerCapture === "function") {
        try {
          widget.setPointerCapture(e.pointerId);
        } catch (_error) {
          // no-op
        }
      }
      setPositionFromPointer(e.clientX);
    });

    widget.addEventListener("pointermove", e => {
      if (!isDragging) return;
      setPositionFromPointer(e.clientX);
      if (e.pointerType === "touch") {
        e.preventDefault();
      }
    });

    const stopDragging = e => {
      if (!isDragging) return;
      isDragging = false;
      widget.classList.remove("is-dragging");
      if (typeof widget.releasePointerCapture === "function") {
        try {
          widget.releasePointerCapture(e.pointerId);
        } catch (_error) {
          // no-op
        }
      }
    };

    widget.addEventListener("pointerup", stopDragging);
    widget.addEventListener("pointercancel", stopDragging);
    widget.addEventListener("lostpointercapture", () => {
      isDragging = false;
      widget.classList.remove("is-dragging");
    });

    range.addEventListener("input", () => {
      widget.dataset.beforeAfterInteracted = "true";
      setPosition(range.value);
    });

    if (!prefersReducedMotion) {
      window.setTimeout(() => {
        if (widget.dataset.beforeAfterInteracted === "true") return;

        const base = Number(range.value) || 50;
        const nudged = Math.min(72, base + 14);
        setPosition(nudged);

        window.setTimeout(() => {
          if (widget.dataset.beforeAfterInteracted === "true") return;
          setPosition(base);
        }, 850);
      }, 3000 + index * 220);
    }

    setPosition(range.value);
    widget.dataset.beforeAfterReady = "true";
  });
}

function setupBeforeAfterComparisons() {
  if (beforeAfterComparisonsInitialized) {
    initBeforeAfterComparisons();
    return;
  }
  beforeAfterComparisonsInitialized = true;
  initBeforeAfterComparisons();
}

document.addEventListener("DOMContentLoaded", setupBeforeAfterComparisons);
document.addEventListener("partialsLoaded", setupBeforeAfterComparisons);

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero--video");
  const tiles = document.querySelector(".hero__tiles");
  if (!hero || !tiles) return;

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  if (prefersReducedMotion || !canHover) return;

  const tileSize = 90;
  let cols = 0;
  let rows = 0;
  let lastIndex = -1;
  let rafId = 0;
  let lastEvent = null;

  function buildTiles() {
    const rect = hero.getBoundingClientRect();
    cols = Math.max(1, Math.ceil(rect.width / tileSize));
    rows = Math.max(1, Math.ceil(rect.height / tileSize));

    tiles.style.setProperty("--tile-cols", cols);
    tiles.style.setProperty("--tile-rows", rows);

    tiles.innerHTML = "";
    const total = cols * rows;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < total; i += 1) {
      const tile = document.createElement("span");
      tile.className = "hero__tile";
      frag.appendChild(tile);
    }

    tiles.appendChild(frag);
  }

  function clearHot() {
    if (lastIndex >= 0 && tiles.children[lastIndex]) {
      tiles.children[lastIndex].classList.remove("is-hot");
    }
    lastIndex = -1;
    tiles.classList.remove("is-active");
    hero.style.setProperty("--tilt-x", "0deg");
    hero.style.setProperty("--tilt-y", "0deg");
  }

  function updateFromEvent(e) {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      clearHot();
      return;
    }

    const col = Math.min(cols - 1, Math.floor(x / (rect.width / cols)));
    const row = Math.min(rows - 1, Math.floor(y / (rect.height / rows)));
    const idx = row * cols + col;

    hero.style.setProperty("--mx", `${x}px`);
    hero.style.setProperty("--my", `${y}px`);
    hero.style.setProperty("--gx", `${x}px`);
    hero.style.setProperty("--gy", `${y}px`);

    const dx = (x / rect.width - 0.5) * 2;
    const dy = (y / rect.height - 0.5) * 2;
    hero.style.setProperty("--tilt-x", `${-dy * 4}deg`);
    hero.style.setProperty("--tilt-y", `${dx * 4}deg`);

    hero.style.setProperty("--hx", `${x + dx * 30}px`);
    hero.style.setProperty("--hy", `${y - dy * 30}px`);
    tiles.classList.add("is-active");

    if (idx !== lastIndex) {
      if (lastIndex >= 0 && tiles.children[lastIndex]) {
        tiles.children[lastIndex].classList.remove("is-hot");
      }
      const nextTile = tiles.children[idx];
      if (nextTile) nextTile.classList.add("is-hot");
      lastIndex = idx;
    }
  }

  function onPointerMove(e) {
    lastEvent = e;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      if (lastEvent) updateFromEvent(lastEvent);
    });
  }

  buildTiles();
  window.addEventListener("resize", () => {
    buildTiles();
    clearHot();
  });

  hero.addEventListener("pointermove", onPointerMove);
  hero.addEventListener("pointerleave", clearHot);
});
