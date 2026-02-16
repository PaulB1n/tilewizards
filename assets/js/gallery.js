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

  const scopeLabels = {
    bathroom: "Bathroom",
    floor: "Floor",
    outdoor: "Outdoor",
    slabs: "Slabs"
  };

  let allItems = [];
  let activeFilter = "all";

  function renderGrid() {
    const filtered =
      activeFilter === "all"
        ? allItems
        : allItems.filter(item => item.category === activeFilter);

    const visibleItems = filtered.slice(0, LIMIT);
    grid.innerHTML = "";

    visibleItems.forEach((item, index) => {
      const card = document.createElement("div");
      const isFeatured = isPortfolioPage && (item.featured || index === 0);
      card.className = `portfolio__item portfolio__item--card${isFeatured ? " portfolio__item--featured" : ""}`;

      card.dataset.images = JSON.stringify(item.images || []);
      card.dataset.title = item.title || "Project";

      const altText = `${item.title} - professional tile installation in Toronto GTA`;
      const location = item.location || "Toronto, ON";
      const scope = scopeLabels[item.category] || "Residential";
      const area = item.area || "Custom scope";
      const material = item.material || "Porcelain";
      const summary = item.summary || "Professional tile installation with clean cuts and level finish.";
      const stats = Array.isArray(item.stats) ? item.stats.slice(0, 2) : [];

      card.innerHTML = `
        <div class="portfolio__media">
          <img
            src="${item.cover}"
            alt="${altText}"
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

  function setActiveFilter(nextFilter) {
    activeFilter = nextFilter;
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === nextFilter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    renderGrid();
  }

  fetch("assets/data/portfolio.json")
    .then(res => res.json())
    .then(items => {
      allItems = Array.isArray(items) ? items : [];
      renderGrid();

      filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          setActiveFilter(btn.dataset.filter || "all");
        });
      });
    })
    .catch(err => console.error("Portfolio load error:", err));
}

let currentImages = [];
let currentIndex = 0;
let currentTitle = "";
let lightboxReady = false;

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
    document.body.style.overflow = "";
  }

  document.addEventListener("click", e => {
    const img = e.target.closest(".portfolio__media img");
    if (!img) return;

    const item = img.closest(".portfolio__item");
    if (!item || !item.dataset.images) return;

    currentImages = JSON.parse(item.dataset.images);
    currentIndex = 0;
    currentTitle = item.dataset.title || "Project";

    setLightboxImage(currentIndex);
    updateCounter();
    updateNavState();
    preloadNeighbor(1);

    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
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

