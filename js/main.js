
const Maison = {
  config: {
    brand: "Maison De Luxe",
    instagram: "https://www.instagram.com/maisondeluxe.to/",
    tiktok: "https://www.tiktok.com/",
    formEndpoint: "" // EDIT: Add your Formspree/Netlify/custom endpoint here.
  }
};

document.addEventListener("DOMContentLoaded", () => {

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     HEADER — background/shadow on scroll (existing behaviour),
     plus a restrained hide-on-scroll-down / reveal-on-scroll-up
     so the header never competes with hero or editorial imagery.
     ============================================================ */
  const header = document.querySelector(".header");
  let lastY = window.scrollY;
  let headerTicking = false;
  const syncHeader = () => {
    const y = window.scrollY;
    header?.classList.toggle("scrolled", y > 35);
    if (header && !reduceMotion) {
      if (y > 160 && y > lastY) header.classList.add("header-hidden");
      else if (y < lastY || y <= 160) header.classList.remove("header-hidden");
    }
    lastY = y;
    headerTicking = false;
  };
  syncHeader();
  window.addEventListener("scroll", () => {
    if (!headerTicking) { requestAnimationFrame(syncHeader); headerTicking = true; }
  }, { passive: true });

  /* ============================================================
     SCROLL PROGRESS — a single 2px architectural line under the
     header. Injected here rather than per-page markup.
     ============================================================ */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);
  let progressTicking = false;
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    progress.style.transform = `scaleX(${pct})`;
    progressTicking = false;
  };
  updateProgress();
  window.addEventListener("scroll", () => {
    if (!progressTicking) { requestAnimationFrame(updateProgress); progressTicking = true; }
  }, { passive: true });
  window.addEventListener("resize", updateProgress);

  /* ============================================================
     MOBILE NAVIGATION — hamburger/close morph, staggered link
     entrance (via CSS), Escape to close, focus returned to toggle.
     ============================================================ */
  const menuToggle = document.querySelector(".menu-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");
  const closeMenu = () => {
    mobilePanel?.classList.remove("open");
    menuToggle?.classList.remove("active");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
  };
  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener("click", () => {
      const open = mobilePanel.classList.toggle("open");
      menuToggle.classList.toggle("active", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("menu-open", open);
    });
    mobilePanel.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && mobilePanel.classList.contains("open")) {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  /* ============================================================
     ACTIVE NAV STATE — reuses the existing underline treatment
     (.nav a.active) rather than adding a new visual style.
     ============================================================ */
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[href], .mobile-panel a[href]").forEach(a => {
    const href = (a.getAttribute("href") || "").split("#")[0] || "index.html";
    if (href === currentPage) a.classList.add("active");
  });

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  /* ============================================================
     REVEAL ON SCROLL — unchanged mechanism, still drives every
     .reveal element (fade + rise) and the image-mask reveal and
     word-reveal treatments via the same .is-visible class.
     ============================================================ */
  const reveal = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: .12 });
    reveal.forEach(el => io.observe(el));
  } else {
    reveal.forEach(el => el.classList.add("is-visible"));
  }

  /* ============================================================
     HOMEPAGE HERO — word-level headline reveal. Progressive
     enhancement only: if it fails for any reason, the heading
     still renders and still fades in via the standard .reveal
     behaviour above. Composition, copy and line breaks untouched.
     ============================================================ */
  const heroHeading = document.querySelector(".hero h1");
  if (heroHeading && !reduceMotion) {
    try {
      const wrapTextNode = (textNode) => {
        const frag = document.createDocumentFragment();
        textNode.textContent.split(/(\s+)/).forEach(part => {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const outer = document.createElement("span");
            outer.className = "word-reveal";
            const inner = document.createElement("span");
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          }
        });
        textNode.replaceWith(frag);
      };
      const walk = (node) => {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) wrapTextNode(child);
          else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") walk(child);
        });
      };
      walk(heroHeading);
      heroHeading.classList.add("words-split");
      const words = heroHeading.querySelectorAll(".word-reveal");
      words.forEach((w, i) => { w.style.transitionDelay = `${0.32 + i * 0.045}s`; });
    } catch (err) {
      /* Fails safe: heading keeps its original text and normal reveal fade. */
    }
  }

  /* ============================================================
     HERO IMAGERY — soft settle-in on load, then a light parallax
     drift while scrolling past the hero. transform-only, GPU
     friendly, and fully disabled under reduced motion.
     ============================================================ */
  const heroArt = document.querySelector(".hero-art");
  if (heroArt) {
    if (reduceMotion) {
      heroArt.style.transform = "none";
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => { heroArt.style.transform = "scale(1.05)"; }));
      window.setTimeout(() => {
        heroArt.style.transition = "none";
        let heroTicking = false;
        const parallax = () => {
          const y = window.scrollY;
          if (y < window.innerHeight * 1.3) {
            heroArt.style.transform = `translate3d(0, ${Math.round(y * 0.12)}px, 0) scale(1.05)`;
          }
          heroTicking = false;
        };
        window.addEventListener("scroll", () => {
          if (!heroTicking) { requestAnimationFrame(parallax); heroTicking = true; }
        }, { passive: true });
      }, 1650);
    }
  }

  /* ============================================================
     FAQ ACCORDION — unchanged interaction (grid-template-rows
     already animates height smoothly); ARIA state kept in sync.
     ============================================================ */
  document.querySelectorAll("[data-faq]").forEach(item => {
    const q = item.querySelector(".faq-q");
    q?.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ============================================================
     COLLECTIONS FILTER — smooth fade/scale instead of an instant
     show/hide jump, plus a polite live-region announcement for
     screen-reader users. Reduces to an instant toggle when the
     visitor prefers reduced motion.
     ============================================================ */
  const filterButtons = document.querySelectorAll("[data-filter]");
  const galleryItems = document.querySelectorAll("[data-category]");
  if (filterButtons.length) {
    const toolbar = document.querySelector(".gallery-toolbar");
    let liveRegion = document.querySelector(".filter-status");
    if (!liveRegion && toolbar) {
      liveRegion = document.createElement("span");
      liveRegion.className = "filter-status sr-only";
      liveRegion.setAttribute("aria-live", "polite");
      toolbar.insertAdjacentElement("afterend", liveRegion);
    }
    filterButtons.forEach(b => b.setAttribute("aria-pressed", b.classList.contains("active") ? "true" : "false"));

    filterButtons.forEach(btn => btn.addEventListener("click", () => {
      filterButtons.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        const shouldShow = filter === "all" || item.dataset.category === filter;
        if (reduceMotion) {
          item.hidden = !shouldShow;
          return;
        }
        if (!shouldShow && !item.hidden) {
          item.classList.add("filtering-out");
          window.setTimeout(() => { item.hidden = true; item.classList.remove("filtering-out"); }, 320);
        } else if (shouldShow && item.hidden) {
          item.hidden = false;
          item.classList.add("filtering-in");
          requestAnimationFrame(() => requestAnimationFrame(() => item.classList.remove("filtering-in")));
        }
      });

      if (liveRegion) {
        const count = Array.from(galleryItems).filter(i => filter === "all" || i.dataset.category === filter).length;
        liveRegion.textContent = `Showing ${count} ${count === 1 ? "piece" : "pieces"}.`;
      }
    }));
  }

  /* ============================================================
     PAGE TRANSITIONS — a short, same-origin fade on navigation so
     moving between pages feels cohesive. Fast (180ms) so it never
     reads as a loading state. Skips external links, new tabs,
     downloads, in-page anchors and reduced-motion visitors.
     ============================================================ */
  if (!reduceMotion) {
    document.querySelectorAll("a[href]").forEach(link => {
      const raw = link.getAttribute("href");
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      let dest;
      try { dest = new URL(raw, location.href); } catch (err) { return; }
      if (dest.origin !== location.origin) return;
      if (dest.pathname === location.pathname && dest.hash) return;
      link.addEventListener("click", e => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        document.body.classList.add("is-leaving");
        window.setTimeout(() => { location.href = dest.href; }, 180);
      });
    });
  }
  window.addEventListener("pageshow", () => { document.body.classList.remove("is-leaving"); });

  /* ============================================================
     COMMISSION FORM — same submit/endpoint behaviour as before,
     with quiet inline validation messages instead of relying only
     on the browser's default validation bubble.
     ============================================================ */
  const form = document.querySelector("#commission-form");
  if (form) {
    const ensureErrorEl = (fieldEl) => {
      let err = fieldEl.querySelector(".field-error");
      if (!err) {
        err = document.createElement("span");
        err.className = "field-error";
        fieldEl.appendChild(err);
      }
      return err;
    };
    form.querySelectorAll("input,select,textarea").forEach(control => {
      const clear = () => control.closest(".field")?.classList.remove("field-invalid");
      control.addEventListener("input", clear);
      control.addEventListener("change", clear);
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const status = form.querySelector(".form-status");

      if (!form.checkValidity()) {
        let firstInvalid = null;
        form.querySelectorAll(".field").forEach(fieldEl => {
          const control = fieldEl.querySelector("input,select,textarea");
          if (!control) return;
          const invalid = !control.checkValidity();
          fieldEl.classList.toggle("field-invalid", invalid);
          if (invalid) {
            ensureErrorEl(fieldEl).textContent = control.validationMessage || "Please complete this field.";
            if (!firstInvalid) firstInvalid = control;
          }
        });
        const card = form.closest(".form-card");
        if (card && !reduceMotion) {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
        }
        firstInvalid?.focus();
        return;
      }

      const endpoint = Maison.config.formEndpoint.trim();
      if (!endpoint) {
        status.textContent = "Your inquiry form is ready. Add your preferred form endpoint in js/main.js to activate live submissions.";
        status.classList.add("show");
        status.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.querySelector("span").textContent = "Sending…";
      try {
        const response = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Submission failed");
        form.reset();
        status.textContent = "Thank you. Your commission inquiry has been received.";
        status.classList.add("show");
      } catch (err) {
        status.textContent = "Something went wrong. Please try again or contact Maison De Luxe directly.";
        status.classList.add("show");
      } finally {
        submit.disabled = false;
        submit.querySelector("span").textContent = "Send Inquiry";
      }
    });
  }
});
