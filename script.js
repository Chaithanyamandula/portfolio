// ===== Theme toggle (light/dark, persisted) =====
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ===== Mobile nav toggle =====
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");

burger.addEventListener("click", () => {
  const isActive = nav.classList.toggle("active");
  burger.classList.toggle("active", isActive);
  burger.setAttribute("aria-expanded", String(isActive));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    burger.classList.remove("active");
    burger.setAttribute("aria-expanded", "false");
  });
});

// ===== Header background on scroll + scroll progress bar =====
const header = document.getElementById("site-header");
const progressBar = document.getElementById("progress-bar");

function onScroll() {
  header.classList.toggle("scrolled", window.scrollY > 20);

  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = percent + "%";
}
window.addEventListener("scroll", onScroll);
onScroll();

// ===== Scroll-reveal animation (single restrained pattern) =====
const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealItems.forEach((el) => el.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealItems.forEach((el) => revealObserver.observe(el));
}

// ===== Flip project cards (click + keyboard) =====
const flipCards = document.querySelectorAll(".flip-card");

flipCards.forEach((card) => {
  const toggleFlip = () => {
    const flipped = card.classList.toggle("flipped");
    card.setAttribute("aria-pressed", String(flipped));
  };

  card.addEventListener("click", toggleFlip);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  });
});
