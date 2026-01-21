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
  const video = document.querySelector(".hero__video");
  if (!video) return;

  const isMobile =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  // 2. Respect reduced motion
  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (isMobile || prefersReducedMotion) {
    return;
  }

  const source = document.createElement("source");
  source.src = "assets/video/hero.mp4";
  source.type = "video/mp4";

  video.appendChild(source);

  video.load();
});
