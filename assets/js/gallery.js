document.addEventListener("partialsLoaded", () => {
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;

  const isHome = document.body.classList.contains("page-home");
  const LIMIT = isHome ? 3 : Infinity;

  fetch("assets/data/portfolio.json")
    .then(res => res.json())
    .then(items => {
      items.slice(0, LIMIT).forEach(item => {
        const div = document.createElement("div");
div.className = "portfolio__item";
div.dataset.images = JSON.stringify(item.images);

div.className = "portfolio__item portfolio__item--card";
div.dataset.images = JSON.stringify(item.images);

div.innerHTML = `
  <div class="portfolio__media">
    <img src="${item.cover}" alt="${item.title}" loading="lazy">
  </div>

  <div class="portfolio__content">
    <h3 class="portfolio__title">${item.title}</h3>
    <p class="portfolio__location">${item.location || "Toronto, ON"}</p>

    <ul class="portfolio__stats">
  ${
    item.stats
      ? item.stats.map(stat => `<li>${stat}</li>`).join("")
      : `
        <li>Professional tile installation</li>
        <li>Porcelain & ceramic tile</li>
        <li>Residential project</li>
      `
  }
</ul>

  </div>
`;



        grid.appendChild(div);
      });
    })
    .catch(err => console.error("Portfolio load error:", err));
});


let currentImages = [];
let currentIndex = 0;

const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");

document.addEventListener("click", e => {
  const item = e.target.closest(".portfolio__item");
  if (!item) return;

  if (!item.dataset.images) return;

  const images = JSON.parse(item.dataset.images);
  if (!images.length) return;

  currentImages = images;
  currentIndex = 0;

  lightboxImg.src = images[0];
updateCounter();
lightbox.classList.add("active");
preloadImage(1);
document.body.style.overflow = "hidden";

});



/* close lightbox */
document.querySelector(".lightbox__close").addEventListener("click", closeLightbox);


/* close on background click */
document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target.id === "lightbox") {
    closeLightbox();
  }
});

function openLightbox() {
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

const counter = document.querySelector(".lightbox__counter");

function updateCounter() {
  if (!counter) return;

  if (currentImages.length <= 1) {
    counter.style.display = "none";
    return;
  }

  counter.style.display = "block";
  counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
}


document.querySelector(".lightbox__next").onclick = () => {
  if (!currentImages.length) return;

  currentIndex = (currentIndex + 1) % currentImages.length;
  lightboxImg.src = currentImages[currentIndex];
  updateCounter();
  preloadImage((currentIndex + 1) % currentImages.length);
};

document.querySelector(".lightbox__prev").onclick = () => {
  if (!currentImages.length) return;

  currentIndex =
    (currentIndex - 1 + currentImages.length) % currentImages.length;
  lightboxImg.src = currentImages[currentIndex];
  updateCounter();
  preloadImage(
    (currentIndex - 1 + currentImages.length) % currentImages.length
  );
};


document.addEventListener("keydown", e => {
  if (e.key === "Escape" && lightbox.classList.contains("active")) {
    closeLightbox();
  }
});

function preloadImage(index) {
  if (!currentImages[index]) return;

  const img = new Image();
  img.src = currentImages[index];
}


let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const threshold = 50; 

  if (touchEndX < touchStartX - threshold) {
    // swipe left → next
    document.querySelector(".lightbox__next").click();
  }

  if (touchEndX > touchStartX + threshold) {
    // swipe right → prev
    document.querySelector(".lightbox__prev").click();
  }
}
