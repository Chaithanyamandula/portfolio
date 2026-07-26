// ===== Theme toggle (light/dark, persisted) =====
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  document.dispatchEvent(new CustomEvent("themechange"));
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

// ===== Live GitHub stats =====
const GH_USERNAME = "Chaithanyamandula";
const GH_CACHE_KEY = "gh-stats-cache-v1";
const GH_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function ghFetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`);
  return res.json();
}

function ghCountUp(el, target) {
  if (!el) return;
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString();
    return;
  }
  const duration = 900;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const GH_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GH_CELL_UNIT = 14; // cell width (11px) + gap (3px), used to position month labels

function ghFormatTooltip(dateStr, count) {
  const date = new Date(dateStr + "T00:00:00");
  const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const noun = count === 1 ? "contribution" : "contributions";
  return `${count} ${noun} on ${formatted}`;
}

function ghRenderHeatmap(days) {
  const container = document.getElementById("gh-heatmap");
  const monthsRow = document.getElementById("gh-heatmap-months");
  if (!container || !days.length) return;
  container.innerHTML = "";
  if (monthsRow) monthsRow.innerHTML = "";

  // Pad the start so each column represents a Sun–Sat week, like GitHub's grid
  const firstDate = new Date(days[0].date + "T00:00:00");
  const padCount = firstDate.getDay();
  const padded = Array(padCount).fill(null).concat(days);

  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const counts = days.map((d) => d.count ?? d.contributionCount ?? 0);
  const max = Math.max(...counts, 1);

  const monthTotals = {};
  days.forEach((day) => {
    const count = day.count ?? day.contributionCount ?? 0;
    const d = new Date(day.date + "T00:00:00");
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthTotals[key] = (monthTotals[key] || 0) + count;
  });

  let lastMonth = null;
  weeks.forEach((week, weekIndex) => {
    const col = document.createElement("div");
    col.className = "gh-week";

    week.forEach((day) => {
      const cell = document.createElement("div");
      cell.className = "gh-cell";
      if (!day) {
        cell.dataset.empty = "true";
      } else {
        const count = day.count ?? day.contributionCount ?? 0;
        let level = 0;
        if (count > 0) {
          const ratio = count / max;
          level = ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
        }
        cell.dataset.level = String(level);
        cell.dataset.date = day.date;
        cell.dataset.count = String(count);
        cell.tabIndex = 0;
        cell.setAttribute("aria-label", ghFormatTooltip(day.date, count));

        const cellDate = new Date(day.date + "T00:00:00");
        const monthKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}`;
        if (monthsRow && monthKey !== lastMonth && cellDate.getDate() <= 7) {
          lastMonth = monthKey;
          const monthTotal = monthTotals[monthKey] || 0;
          const fullMonthName = cellDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
          const label = document.createElement("span");
          label.textContent = GH_MONTH_NAMES[cellDate.getMonth()];
          label.style.left = `${weekIndex * GH_CELL_UNIT}px`;
          label.tabIndex = 0;
          label.dataset.monthTotal = String(monthTotal);
          label.dataset.monthFull = fullMonthName;
          label.setAttribute("aria-label", `${monthTotal} contribution${monthTotal === 1 ? "" : "s"} in ${fullMonthName}`);
          monthsRow.appendChild(label);
        }
      }
      col.appendChild(cell);
    });

    container.appendChild(col);
  });

  ghAttachTooltip(container, monthsRow);
}

function ghAttachTooltip(container, monthsRow) {
  const tooltip = document.getElementById("gh-tooltip");
  if (!tooltip) return;

  function positionAt(x, y) {
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 14}px`;
  }

  function showForCell(cell, x, y) {
    const date = cell.dataset.date;
    if (!date) return;
    const count = Number(cell.dataset.count || 0);
    tooltip.textContent = ghFormatTooltip(date, count);
    positionAt(x, y);
    tooltip.classList.add("visible");
  }

  function showForMonth(label, x, y) {
    const total = Number(label.dataset.monthTotal || 0);
    const name = label.dataset.monthFull || label.textContent;
    const noun = total === 1 ? "contribution" : "contributions";
    tooltip.textContent = `${total} ${noun} in ${name}`;
    positionAt(x, y);
    tooltip.classList.add("visible");
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }

  container.addEventListener("mousemove", (e) => {
    const cell = e.target.closest(".gh-cell[data-date]");
    if (cell) showForCell(cell, e.clientX, e.clientY);
    else hideTooltip();
  });
  container.addEventListener("mouseleave", hideTooltip);

  container.addEventListener("focusin", (e) => {
    const cell = e.target.closest(".gh-cell[data-date]");
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    showForCell(cell, rect.left + rect.width / 2, rect.top);
  });
  container.addEventListener("focusout", hideTooltip);

  if (monthsRow) {
    monthsRow.addEventListener("mousemove", (e) => {
      const label = e.target.closest("span[data-month-total]");
      if (label) showForMonth(label, e.clientX, e.clientY);
      else hideTooltip();
    });
    monthsRow.addEventListener("mouseleave", hideTooltip);

    monthsRow.addEventListener("focusin", (e) => {
      const label = e.target.closest("span[data-month-total]");
      if (!label) return;
      const rect = label.getBoundingClientRect();
      showForMonth(label, rect.left + rect.width / 2, rect.top);
    });
    monthsRow.addEventListener("focusout", hideTooltip);
  }
}

function ghRenderLanguages(repos) {
  const container = document.getElementById("gh-langs");
  if (!container) return;
  container.innerHTML = "";

  const tally = {};
  repos.forEach((r) => {
    if (r.language && !r.fork) {
      tally[r.language] = (tally[r.language] || 0) + 1;
    }
  });

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors = ["var(--accent)", "var(--teal)", "var(--amber)", "#f472b6", "#22c55e"];

  if (sorted.length === 0) {
    container.innerHTML = `<p class="gh-stat-label">No public language data available</p>`;
    return;
  }

  sorted.forEach(([lang, count], i) => {
    const pct = Math.round((count / total) * 100);
    const row = document.createElement("div");
    row.className = "gh-lang-row";
    row.innerHTML = `
      <span class="gh-lang-name">${lang}</span>
      <span class="gh-lang-track"><span class="gh-lang-fill" style="width:${pct}%; background:${colors[i % colors.length]}"></span></span>
      <span class="gh-lang-pct">${pct}%</span>
    `;
    container.appendChild(row);
  });
}

async function loadGithubStats() {
  const statRow = document.getElementById("gh-stat-row");
  if (!statRow) return; // section not on this page

  const fallbackEl = document.getElementById("gh-fallback");
  const panelsEl = document.querySelector(".gh-panels");
  const updatedEl = document.getElementById("gh-updated");

  try {
    let data = null;
    const cached = sessionStorage.getItem(GH_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < GH_CACHE_TTL) data = parsed.data;
    }

    if (!data) {
      const [user, repos, contrib] = await Promise.all([
        ghFetchJSON(`https://api.github.com/users/${GH_USERNAME}`),
        ghFetchJSON(`https://api.github.com/users/${GH_USERNAME}/repos?per_page=100&type=owner`),
        ghFetchJSON(`https://github-contributions-api.jogruber.de/v4/${GH_USERNAME}?y=last`),
      ]);
      data = { user, repos, contrib };
      sessionStorage.setItem(GH_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    }

    const { user, repos, contrib } = data;
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const days = Array.isArray(contrib.contributions) ? contrib.contributions : [];
    const totalContribs = days.reduce((sum, d) => sum + (d.count ?? d.contributionCount ?? 0), 0);

    ghCountUp(document.getElementById("gh-repos"), user.public_repos || 0);
    ghCountUp(document.getElementById("gh-followers"), user.followers || 0);
    ghCountUp(document.getElementById("gh-stars"), totalStars);
    ghCountUp(document.getElementById("gh-contribs"), totalContribs);

    if (days.length) {
      ghRenderHeatmap(days.slice(-371));
    } else {
      document.getElementById("gh-heatmap").innerHTML = `<p class="gh-stat-label">No contribution data available</p>`;
    }

    ghRenderLanguages(repos);

    if (updatedEl) {
      updatedEl.textContent = `updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  } catch (err) {
    console.warn("GitHub stats failed to load:", err);
    if (fallbackEl) fallbackEl.hidden = false;
    if (statRow) statRow.hidden = true;
    if (panelsEl) panelsEl.hidden = true;
    if (updatedEl) updatedEl.textContent = "unavailable";
  }
}

loadGithubStats();

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
