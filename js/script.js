/* ==========================================================
   Dilshod Ulugbekov — Portfolio scripts
   1. Safe storage helpers
   2. Theme toggle (light / dark)
   3. Mobile navigation + active section highlighting
   4. Scroll reveal animations
   5. Project filters
   6. HelpDesk Lite demo (ticket tracker)
   7. Contact: email reveal (spam protection) + mailto form
   ========================================================== */

(function () {
  "use strict";

  /* ---------- 1. Safe storage helpers ---------- */
  const store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Assignment notice ---------- */
  const notice = $("#notice");
  if (notice) {
    if (store.get("du-notice-dismissed", false)) notice.classList.add("is-hidden");
    $("#noticeClose").addEventListener("click", () => {
      notice.classList.add("is-hidden");
      store.set("du-notice-dismissed", true);
    });
  }

  /* ---------- 2. Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  applyTheme(store.get("du-theme", prefersDark ? "dark" : "light"));

  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    store.set("du-theme", next);
  });

  /* ---------- 3. Navigation ---------- */
  const header = $(".site-header");
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  $$("#navMenu a").forEach((link) =>
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }, { passive: true });

  // Highlight the nav link for the section currently on screen
  const navLinks = $$('#navMenu a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
          );
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => sectionObserver.observe(s));
  }

  /* ---------- 4. Scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- 5. Project filters ---------- */
  const projectFilters = $$("[data-filter]");
  const projects = $$(".project");

  projectFilters.forEach((btn) =>
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      projectFilters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      projects.forEach((p) => {
        const tags = p.dataset.tags.split(" ");
        p.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
      });
    })
  );

  /* ---------- 6. HelpDesk Lite demo ---------- */
  const TICKET_KEY = "du-helpdesk-tickets";
  const sampleTickets = () => [
    { id: 1, title: "Projector not detected in room F112", cat: "Audio/Visual", pri: "high", done: false, created: Date.now() - 3600e3 },
    { id: 2, title: "Laptop keeps dropping campus Wi-Fi", cat: "Network", pri: "med", done: false, created: Date.now() - 7200e3 },
    { id: 3, title: "Reset Microsoft 365 password", cat: "Account", pri: "low", done: true, created: Date.now() - 86400e3 }
  ];

  let tickets = store.get(TICKET_KEY, null) || sampleTickets();
  let view = "all";

  const list = $("#ticketList");
  const form = $("#ticketForm");
  const titleInput = $("#ticketTitle");
  const errorEl = $("#ticketError");
  const priLabel = { low: "Low", med: "Medium", high: "High" };

  function timeAgo(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + " hr ago";
    return Math.round(hrs / 24) + " d ago";
  }

  function save() { store.set(TICKET_KEY, tickets); }

  function render() {
    const priorityOrder = { high: 0, med: 1, low: 2 };
    const visible = tickets
      .filter((t) => view === "all" || (view === "open" ? !t.done : t.done))
      .sort((a, b) => a.done - b.done || priorityOrder[a.pri] - priorityOrder[b.pri] || b.created - a.created);

    list.innerHTML = "";

    if (!visible.length) {
      const empty = document.createElement("li");
      empty.className = "ticket-empty";
      empty.textContent = view === "done" ? "No resolved tickets yet." : "The queue is clear. Nice work!";
      list.appendChild(empty);
    }

    visible.forEach((t) => {
      const li = document.createElement("li");
      li.className = "ticket" + (t.done ? " is-done" : "");
      li.dataset.pri = t.pri;
      li.dataset.id = t.id;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "ticket__check";
      check.checked = t.done;
      check.setAttribute("aria-label", "Mark resolved: " + t.title);

      const text = document.createElement("div");
      const title = document.createElement("span");
      title.className = "ticket__title";
      title.textContent = t.title; // textContent prevents HTML injection
      const meta = document.createElement("span");
      meta.className = "ticket__meta";
      meta.textContent = "#" + String(t.id).padStart(3, "0") + " · " + t.cat + " · " + timeAgo(t.created);
      text.append(title, meta);

      const pri = document.createElement("span");
      pri.className = "ticket__pri";
      pri.textContent = priLabel[t.pri];

      const del = document.createElement("button");
      del.className = "ticket__del";
      del.type = "button";
      del.innerHTML = "&times;";
      del.setAttribute("aria-label", "Delete ticket: " + t.title);

      li.append(check, text, pri, del);
      list.appendChild(li);
    });

    $("#statOpen").textContent = tickets.filter((t) => !t.done).length;
    $("#statHigh").textContent = tickets.filter((t) => !t.done && t.pri === "high").length;
    $("#statDone").textContent = tickets.filter((t) => t.done).length;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (title.length < 4) {
      errorEl.textContent = "Please describe the issue in at least 4 characters.";
      titleInput.focus();
      return;
    }
    errorEl.textContent = "";
    const nextId = tickets.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    tickets.push({ id: nextId, title, cat: $("#ticketCat").value, pri: $("#ticketPri").value, done: false, created: Date.now() });
    save();
    form.reset();
    $("#ticketPri").value = "med";
    render();
  });

  // Event delegation: one listener handles every ticket's checkbox and delete button
  list.addEventListener("click", (e) => {
    const item = e.target.closest(".ticket");
    if (!item) return;
    const id = Number(item.dataset.id);
    if (e.target.matches(".ticket__check")) {
      const t = tickets.find((x) => x.id === id);
      if (t) t.done = e.target.checked;
    } else if (e.target.matches(".ticket__del")) {
      tickets = tickets.filter((x) => x.id !== id);
    } else {
      return;
    }
    save();
    render();
  });

  $$("[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => {
      view = btn.dataset.view;
      $$("[data-view]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render();
    })
  );

  $("#resetTickets").addEventListener("click", () => {
    tickets = sampleTickets();
    save();
    render();
  });

  render();

  /* ---------- 7. Contact ---------- */
  // The email address is assembled in JavaScript so simple spam bots can't scrape it from the HTML.
  const emailLink = $("#emailLink");
  const email = emailLink.dataset.user + "@" + emailLink.dataset.domain;
  let revealed = false;

  emailLink.addEventListener("click", (e) => {
    if (!revealed) {
      e.preventDefault();
      $("#emailText").textContent = email;
      emailLink.href = "mailto:" + email;
      revealed = true;
    }
  });

  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#cName").value.trim();
    const company = $("#cCompany").value.trim();
    const msg = $("#cMsg").value.trim();
    const err = $("#contactError");

    if (!name || !msg) {
      err.textContent = "Please add your name and a short message.";
      return;
    }
    err.textContent = "";
    const subject = "Opportunity for Dilshod" + (company ? " – " + company : "");
    const body = msg + "\n\n— " + name + (company ? ", " + company : "");
    window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
