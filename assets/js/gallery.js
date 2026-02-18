document.addEventListener("partialsLoaded", () => {
  initPortfolioGrid();
  initLightbox();
});

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

    const visibleItems = filtered.slice(0, LIMIT);
    grid.innerHTML = "";

    if (!visibleItems.length) {
      grid.innerHTML = '<p class="portfolio__empty" role="status">No projects found for this filter. Try another category.</p>';
      return;
    }

    visibleItems.forEach((item, index) => {
      const card = document.createElement("button");
      const isFeatured = isPortfolioPage && (item.featured || index === 0);
      card.className = `portfolio__item portfolio__item--card${isFeatured ? " portfolio__item--featured" : ""}`;
      card.type = "button";
      card.setAttribute("aria-label", `Open gallery for ${item.title || "project"}`);

      card.dataset.images = JSON.stringify(item.images || []);
      card.dataset.title = item.title || "Project";

      const altText = `${item.title} - professional tile installation in Toronto GTA`;
      const location = item.location || "Toronto, ON";
      const scope = scopeLabels[item.category] || "Residential";
      const area = item.area || "Custom scope";
      const material = item.material || "Porcelain";
      const summary = item.summary || "Professional tile installation with clean cuts and level finish.";
      const stats = Array.isArray(item.stats) ? item.stats.slice(0, 2) : [];
      const imageWidth = Number(item.imageWidth) || 1200;
      const imageHeight = Number(item.imageHeight) || 900;

      card.innerHTML = `
        <div class="portfolio__media">
          <img
            src="${item.cover}"
            alt="${altText}"
            width="${imageWidth}"
            height="${imageHeight}"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="portfolio__content">
          ${isFeatured ? '<span class="portfolio__featured-label">Featured Project</span>' : ""}
          <div class="portfolio__case-head">
            <span class="portfolio__badge">Case Study</span>
            <p class="portfolio__location">${location}</p>
          </div>

          <h3 class="portfolio__title">${item.title}</h3>
          <p class="portfolio__summary">${summary}</p>

          <ul class="portfolio__case-params">
            <li><span>Scope</span><strong>${scope}</strong></li>
            <li><span>Area</span><strong>${area}</strong></li>
            <li><span>Material</span><strong>${material}</strong></li>
          </ul>

          <ul class="portfolio__stats portfolio__case-list">
            ${stats.map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>
      `;

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
      grid.innerHTML = '<p class="portfolio__empty portfolio__empty--error" role="status">Failed to load portfolio projects. Please refresh the page.</p>';
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
    if (!item || !item.dataset.images) return;

    let images = [];
    try {
      images = JSON.parse(item.dataset.images);
    } catch (_error) {
      return;
    }

    if (!Array.isArray(images) || !images.length) return;

    currentImages = images;
    currentIndex = 0;
    currentTitle = item.dataset.title || "Project";
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

