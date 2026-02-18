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

  console.log("Mobile menu initialized");
});

let trackingInitialized = false;

function sendTrackingEvent(eventName, params = {}) {
  const payload = {
    event: eventName,
    page_path: window.location.pathname,
    ...params
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
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

let cookieNoticeInitialized = false;

function initCookieNotice() {
  if (cookieNoticeInitialized) return;

  const notice = document.getElementById("cookieNotice");
  const acceptBtn = document.getElementById("cookieNoticeAccept");
  if (!notice || !acceptBtn) return;

  cookieNoticeInitialized = true;

  const storageKey = "tilewizards_cookie_notice_accepted";
  const alreadyAccepted = localStorage.getItem(storageKey) === "true";
  const emitNoticeStateChange = () => {
    document.dispatchEvent(new Event("cookieNoticeStateChange"));
  };

  if (!alreadyAccepted) {
    notice.hidden = false;
  }
  emitNoticeStateChange();

  acceptBtn.addEventListener("click", () => {
    localStorage.setItem(storageKey, "true");
    notice.hidden = true;
    emitNoticeStateChange();
  });
}

document.addEventListener("partialsLoaded", initCookieNotice);

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



document.addEventListener("partialsLoaded", () => {
  const links = document.querySelectorAll('a[href^="/#"], a[href^="#"]');
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

  links.forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");
      const hash = href.includes("#") ? href.substring(href.indexOf("#")) : null;
      if (!hash) return;

      const target = document.querySelector(hash);

      
      if (target) {
        e.preventDefault();

        target.scrollIntoView({
          behavior: scrollBehavior,
          block: "start"
        });

        const mobileMenu = document.getElementById("mobileMenu");
        const burger = document.getElementById("burger");
        if (mobileMenu) {
          mobileMenu.classList.remove("active");
          mobileMenu.hidden = true;
          mobileMenu.setAttribute("aria-hidden", "true");
          if (burger) burger.setAttribute("aria-expanded", "false");
          document.body.classList.remove("menu-open");
        }
      }
      
    });
  });

  
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      }, 120);
    }
  }
});

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
