document.addEventListener("partialsLoaded", () => {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  const isHome = document.body.classList.contains("page-home");
  const LIMIT = isHome ? 3 : Infinity;

  fetch("assets/data/portfolio.json")
    .then(res => res.json())
    .then(items => {
      items.slice(0, LIMIT).forEach(item => {
        const card = document.createElement("div");
        card.className = "portfolio__item portfolio__item--card";

        card.dataset.images = JSON.stringify(item.images);

        const altText =
          `${item.title} - professional tile installation in Toronto GTA`;

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
            <div class="portfolio__case-head">
              <span class="portfolio__badge">Case Study</span>
              <p class="portfolio__location">${item.location || "Toronto, ON"}</p>
            </div>

            <h3 class="portfolio__title">${item.title}</h3>

            <ul class="portfolio__stats portfolio__case-list">
              ${
                item.stats
                  ? item.stats.map(s => `<li>${s}</li>`).join("")
                  : `
                    <li>Professional tile installation</li>
                    <li>Porcelain & ceramic tile</li>
                    <li>Residential project</li>
                  `
              }
            </ul>
          </div>
        `;

        grid.appendChild(card);
      });
    })
    .catch(err => console.error("Portfolio load error:", err));
});


// ================= LIGHTBOX =================

let currentImages = [];
let currentIndex = 0;

const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");
const counter = document.querySelector(".lightbox__counter");


document.addEventListener("click", e => {
  const img = e.target.closest(".portfolio__media img");
  if (!img) return;

  const item = img.closest(".portfolio__item");
  if (!item || !item.dataset.images) return;

  currentImages = JSON.parse(item.dataset.images);
  currentIndex = 0;

  lightboxImg.src = currentImages[currentIndex];
  lightboxImg.alt = img.alt;

  updateCounter();
  preloadImage(1);

  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
});


// ================= CONTROLS =================

document.querySelector(".lightbox__close").onclick = closeLightbox;

lightbox.addEventListener("click", e => {
  if (e.target.id === "lightbox") closeLightbox();
});

document.querySelector(".lightbox__next").onclick = () => changeSlide(1);
document.querySelector(".lightbox__prev").onclick = () => changeSlide(-1);

document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("active")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") changeSlide(1);
  if (e.key === "ArrowLeft") changeSlide(-1);
});


// ================= FUNCTIONS =================

function changeSlide(direction) {
  if (!currentImages.length) return;

  currentIndex =
    (currentIndex + direction + currentImages.length) %
    currentImages.length;

  lightboxImg.src = currentImages[currentIndex];
  updateCounter();
  preloadImage(currentIndex + direction);
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function updateCounter() {
  if (!counter) return;

  if (currentImages.length <= 1) {
    counter.style.display = "none";
    return;
  }

  counter.style.display = "block";
  counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
}

function preloadImage(index) {
  if (!currentImages[index]) return;

  const img = new Image();
  img.src = currentImages[index];
}


// ================= SWIPE (MOBILE) =================

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
  
