document.addEventListener("DOMContentLoaded", async () => {

  /* LOAD PARTIALS */
  const includes = document.querySelectorAll("[data-include]");

  for (const el of includes) {
  const file = el.getAttribute("data-include");
  const response = await fetch(file);
  el.innerHTML = await response.text();
}

/*  */
document.dispatchEvent(new Event("partialsLoaded"));


  /* HEADER SCROLL */
  const header = document.querySelector(".header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("header--scrolled");
    } else {
      header.classList.remove("header--scrolled");
    }
  });

  /* MOBILE MENU */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!burger || !mobileMenu) {
    console.error("Burger or mobile menu not found");
    return;
  }

  burger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
    document.body.classList.toggle("menu-open");
  });

  // Close mobile menu ONLY on navigation click
// 1. Навигационные пункты (карточки)
document.querySelectorAll(".nav--mobile .menu-card").forEach(link => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

// 2. CTA → форма (ТОЖЕ закрываем)
const cta = document.querySelector(".nav--mobile .menu-cta");
if (cta) {
  cta.addEventListener("click", () => {
    closeMobileMenu();
  });
}

// Универсальная функция закрытия
function closeMobileMenu() {
  mobileMenu.classList.remove("active");
  document.body.classList.remove("menu-open");
}


  const menuClose = document.getElementById("menuClose");

menuClose.addEventListener("click", () => {
  mobileMenu.classList.remove("active");
  document.body.classList.remove("menu-open");
});


  console.log("Mobile menu initialized");
});

(function () {
  const items = document.querySelectorAll(".js-reveal");

  function revealOnScroll() {
    const triggerBottom = window.innerHeight * 0.9;

    items.forEach(el => {
      const top = el.getBoundingClientRect().top;
      const delay = el.dataset.delay || 0;

      if (top < triggerBottom) {
        setTimeout(() => {
          el.classList.add("is-visible");
        }, delay);
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
})();

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

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
});

/* ===============================
   FAQ ACCORDION
================================ */

document.addEventListener("partialsLoaded", () => {
  const faqItems = document.querySelectorAll(".faq__item");
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector(".faq__question");

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      faqItems.forEach(i => {
        i.classList.remove("active");
        const ans = i.querySelector(".faq__answer");
        if (ans) ans.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add("active");
        const answer = item.querySelector(".faq__answer");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  
  if (window.location.hash === "#faq") {
    const featured = document.querySelector(".faq__item--featured");
    if (featured) {
      featured.classList.add("active");
      const answer = featured.querySelector(".faq__answer");
      if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
    }
  }
});



document.addEventListener("partialsLoaded", () => {
  const links = document.querySelectorAll('a[href^="/#"], a[href^="#"]');

  links.forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");
      const hash = href.includes("#") ? href.substring(href.indexOf("#")) : null;
      if (!hash) return;

      const target = document.querySelector(hash);

      
      if (target) {
        e.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        const mobileMenu = document.getElementById("mobileMenu");
        if (mobileMenu) {
          mobileMenu.classList.remove("active");
          document.body.classList.remove("menu-open");
        }
      }
      
    });
  });

  
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
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
