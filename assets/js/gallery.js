document.addEventListener("partialsLoaded", () => {
  initPortfolioGrid();
  initLightbox();
});

const portfolioItemState = new WeakMap();

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeImagePath(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^javascript:/i.test(trimmed)) return "";
  if (/^data:/i.test(trimmed)) return "";
  return trimmed;
}

function initPortfolioGrid() {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  const isHome = document.body.classList.contains("page-home");
  const isPortfolioPage = document.body.classList.contains("page-portfolio");
  const filtersRoot = document.getElementById("portfolioFilters");
  const filterButtons = filtersRoot
    ? Array.from(filtersRoot.querySelectorAll(".portfolio__filter"))
    : [];
  const LIMIT = isHome ? 3 : Infinity;
  const validFilters = new Set(["all", ...filterButtons.map(btn => btn.dataset.filter).filter(Boolean)]);

  const scopeLabels = {
    bathroom: "Bathroom",
    floor: "Floor",
    outdoor: "Outdoor",
    slabs: "Slabs"
  };

  let allItems = [];
  let activeFilter = "all";

  function normalizeFilter(filter) {
    if (!filter) return "all";
    return validFilters.has(filter) ? filter : "all";
  }

  function getFilterFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return normalizeFilter(params.get("filter"));
  }

  function syncFilterToUrl(filter) {
    const url = new URL(window.location.href);
    if (filter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", filter);
    }

    const search = url.searchParams.toString();
    const nextUrl = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function renderGrid() {
    const filtered =
      activeFilter === "all"
        ? allItems
        : allItems.filter(item => item.category === activeFilter);

    function getItemKey(item) {
      if (item && typeof item.id === "string" && item.id) return item.id;
      if (item && typeof item.cover === "string" && item.cover) return item.cover;
      return JSON.stringify(item);
    }

    function buildHomeShowcaseItems(items) {
      const requiredCategories = ["bathroom", "floor", "outdoor"];
      const selected = [];
      const usedKeys = new Set();

      requiredCategories.forEach(category => {
        const match = items.find(item => item && item.category === category && !usedKeys.has(getItemKey(item)));
        if (!match) return;
        selected.push(match);
        usedKeys.add(getItemKey(match));
      });

      if (selected.length >= LIMIT) {
        return selected.slice(0, LIMIT);
      }

      items.forEach(item => {
        const key = getItemKey(item);
        if (usedKeys.has(key)) return;
        selected.push(item);
        usedKeys.add(key);
      });

      return selected.slice(0, LIMIT);
    }

    const visibleItems =
      isHome && activeFilter === "all"
        ? buildHomeShowcaseItems(filtered)
        : filtered.slice(0, LIMIT);

    function renderGridStatusMessage(message, isError) {
      grid.textContent = "";
      const status = document.createElement("p");
      status.className = isError
        ? "portfolio__empty portfolio__empty--error"
        : "portfolio__empty";
      status.setAttribute("role", "status");
      status.textContent = message;
      grid.appendChild(status);
    }

    grid.textContent = "";

    if (!visibleItems.length) {
      renderGridStatusMessage("No projects found for this filter. Try another category.", false);
      return;
    }

    visibleItems.forEach((item, index) => {
      const card = document.createElement("button");
      const isFeatured = isPortfolioPage && (item.featured || index === 0);
      card.className = `portfolio__item portfolio__item--card${isFeatured ? " portfolio__item--featured" : ""}`;
      card.type = "button";
      const title = normalizeText(item && item.title, "Project");
      card.setAttribute("aria-label", `Open gallery for ${title}`);

      const images = Array.isArray(item && item.images)
        ? item.images.map(normalizeImagePath).filter(Boolean)
        : [];
      portfolioItemState.set(card, { images, title });

      const altText = `${title} - professional tile installation in Toronto GTA`;
      const location = normalizeText(item && item.location, "Toronto, ON");
      const scope = scopeLabels[item.category] || "Residential";
      const area = normalizeText(item && item.area, "Custom scope");
      const material = normalizeText(item && item.material, "Porcelain");
      const summary = normalizeText(
        item && item.summary,
        "Professional tile installation with clean cuts and level finish."
      );
      const stats = Array.isArray(item && item.stats)
        ? item.stats.map(v => normalizeText(v)).filter(Boolean).slice(0, 2)
        : [];
      const cover = normalizeImagePath(item && item.cover) || images[0];
      const imageWidth = Number(item.imageWidth) || 1200;
      const imageHeight = Number(item.imageHeight) || 900;

      const media = document.createElement("div");
      media.className = "portfolio__media";
      if (cover) {
        const image = document.createElement("img");
        image.src = cover;
        image.alt = altText;
        image.width = imageWidth;
        image.height = imageHeight;
        image.loading = "lazy";
        image.decoding = "async";
        media.appendChild(image);
      }

      const content = document.createElement("div");
      content.className = "portfolio__content";

      if (isFeatured) {
        const featured = document.createElement("span");
        featured.className = "portfolio__featured-label";
        featured.textContent = "Featured Project";
        content.appendChild(featured);
      }

      const caseHead = document.createElement("div");
      caseHead.className = "portfolio__case-head";

      const badge = document.createElement("span");
      badge.className = "portfolio__badge";
      badge.textContent = "Case Study";
      caseHead.appendChild(badge);

      const locationNode = document.createElement("p");
      locationNode.className = "portfolio__location";
      locationNode.textContent = location;
      caseHead.appendChild(locationNode);
      content.appendChild(caseHead);

      const titleNode = document.createElement("h3");
      titleNode.className = "portfolio__title";
      titleNode.textContent = title;
      content.appendChild(titleNode);

      const summaryNode = document.createElement("p");
      summaryNode.className = "portfolio__summary";
      summaryNode.textContent = summary;
      content.appendChild(summaryNode);

      const params = document.createElement("ul");
      params.className = "portfolio__case-params";

      const scopeItem = document.createElement("li");
      const scopeLabel = document.createElement("span");
      scopeLabel.textContent = "Scope";
      const scopeValue = document.createElement("strong");
      scopeValue.textContent = scope;
      scopeItem.append(scopeLabel, scopeValue);
      params.appendChild(scopeItem);

      const areaItem = document.createElement("li");
      const areaLabel = document.createElement("span");
      areaLabel.textContent = "Area";
      const areaValue = document.createElement("strong");
      areaValue.textContent = area;
      areaItem.append(areaLabel, areaValue);
      params.appendChild(areaItem);

      const materialItem = document.createElement("li");
      const materialLabel = document.createElement("span");
      materialLabel.textContent = "Material";
      const materialValue = document.createElement("strong");
      materialValue.textContent = material;
      materialItem.append(materialLabel, materialValue);
      params.appendChild(materialItem);

      content.appendChild(params);

      const statsList = document.createElement("ul");
      statsList.className = "portfolio__stats portfolio__case-list";
      stats.forEach(stat => {
        const statItem = document.createElement("li");
        statItem.textContent = stat;
        statsList.appendChild(statItem);
      });
      content.appendChild(statsList);

      card.append(media, content);

      grid.appendChild(card);
    });
  }

  function setActiveFilter(nextFilter, options = {}) {
    const { syncUrl = true } = options;
    activeFilter = normalizeFilter(nextFilter);
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    if (syncUrl) {
      syncFilterToUrl(activeFilter);
    }
    renderGrid();
  }

  fetch("assets/data/portfolio.json")
    .then(res => res.json())
    .then(items => {
      allItems = Array.isArray(items) ? items : [];
      setActiveFilter(getFilterFromUrl(), { syncUrl: true });

      filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          setActiveFilter(btn.dataset.filter || "all");
        });
      });
    })
    .catch(err => {
      console.error("Portfolio load error:", err);
      grid.textContent = "";
      const status = document.createElement("p");
      status.className = "portfolio__empty portfolio__empty--error";
      status.setAttribute("role", "status");
      status.textContent = "Failed to load portfolio projects. Please refresh the page.";
      grid.appendChild(status);
    });
}

let currentImages = [];
let currentIndex = 0;
let currentTitle = "";
let lightboxReady = false;
let lastFocusedElement = null;

function initLightbox() {
  if (lightboxReady) return;

  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector("img");
  const counter = lightbox.querySelector(".lightbox__counter");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const nextBtn = lightbox.querySelector(".lightbox__next");
  const prevBtn = lightbox.querySelector(".lightbox__prev");
  const content = lightbox.querySelector(".lightbox__content");

  if (!lightboxImg || !counter || !closeBtn || !nextBtn || !prevBtn || !content) return;

  let caption = lightbox.querySelector(".lightbox__caption");
  if (!caption) {
    caption = document.createElement("div");
    caption.className = "lightbox__caption";
    lightbox.appendChild(caption);
  }

  let hint = lightbox.querySelector(".lightbox__hint");
  if (!hint) {
    hint = document.createElement("div");
    hint.className = "lightbox__hint";
    hint.textContent = "Use <- / -> to switch, Esc to close";
    lightbox.appendChild(hint);
  }

  let loader = lightbox.querySelector(".lightbox__loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "lightbox__loader";
    loader.setAttribute("aria-hidden", "true");
    content.appendChild(loader);
  }

  lightbox.setAttribute("aria-hidden", "true");

  function updateCounter() {
    if (currentImages.length <= 1) {
      counter.style.display = "none";
      return;
    }
    counter.style.display = "block";
    counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
  }

  function updateNavState() {
    const disabled = currentImages.length <= 1;
    nextBtn.disabled = disabled;
    prevBtn.disabled = disabled;
  }

  function setLightboxImage(index) {
    const src = currentImages[index];
    if (!src) return;

    loader.classList.add("is-visible");
    const preloaded = new Image();
    preloaded.onload = () => {
      lightboxImg.src = src;
      lightboxImg.alt = currentTitle || "Portfolio image";
      caption.textContent = currentTitle || "Project";
      loader.classList.remove("is-visible");
    };
    preloaded.onerror = () => {
      loader.classList.remove("is-visible");
    };
    preloaded.src = src;
  }

  function preloadNeighbor(index) {
    if (!currentImages[index]) return;
    const img = new Image();
    img.src = currentImages[index];
  }

  function changeSlide(direction) {
    if (currentImages.length <= 1) return;

    currentIndex =
      (currentIndex + direction + currentImages.length) %
      currentImages.length;

    setLightboxImage(currentIndex);
    updateCounter();
    preloadNeighbor(currentIndex + direction);
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) {
      lastFocusedElement.focus();
    }
  }

  function openLightboxFromItem(item) {
    if (!item) return;
    const itemState = portfolioItemState.get(item);
    if (!itemState) return;
    const images = itemState.images;
    if (!Array.isArray(images) || !images.length) return;

    currentImages = images;
    currentIndex = 0;
    currentTitle = itemState.title || "Project";
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    setLightboxImage(currentIndex);
    updateCounter();
    updateNavState();
    preloadNeighbor(1);

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  document.addEventListener("click", e => {
    const item = e.target.closest(".portfolio__item");
    if (!item) return;
    openLightboxFromItem(item);
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  nextBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    changeSlide(1);
  });

  prevBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    changeSlide(-1);
  });

  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("active")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") changeSlide(1);
    if (e.key === "ArrowLeft") changeSlide(-1);
    if (e.key === "Tab") {
      const focusable = Array.from(
        lightbox.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!(active instanceof HTMLElement) || !lightbox.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }
  });

  let startX = 0;
  lightbox.addEventListener("touchstart", e => {
    startX = e.changedTouches[0].screenX;
  });

  lightbox.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].screenX - startX;
    const threshold = 50;
    if (diff < -threshold) changeSlide(1);
    if (diff > threshold) changeSlide(-1);
  });

  lightboxReady = true;
}

