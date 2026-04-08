(function () {
  const LIVE_URL = "/cosmo-clone/assets/live-data.json";
  let revealObserver;
  let motionBound = false;
  let splashShown = false;
  let popupShown = false;

  function el(id) {
    return document.getElementById(id);
  }

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function statusClass(status) {
    return status === "Operational" ? "ok" : "warn";
  }

  function gameGradient(game) {
    const map = {
      Rust: "linear-gradient(135deg, #ff8c42, #a43f23)",
      Fortnite: "linear-gradient(135deg, #8a7dff, #3f2da8)",
      Valorant: "linear-gradient(135deg, #ff5f7a, #8f1d39)",
      "Call of Duty": "linear-gradient(135deg, #8ba0c9, #2d3c66)",
      "Counter-Strike 2": "linear-gradient(135deg, #ffbd6b, #84511d)",
      "Apex Legends": "linear-gradient(135deg, #ff8a6f, #7d2330)",
      "HWID Spoofers": "linear-gradient(135deg, #6be8ff, #125e8f)"
    };

    return map[game] || "linear-gradient(135deg, #7ea7ff, #233a73)";
  }

  function productDescription(product) {
    if (product.description) return product.description;
    return (
      product.name +
      " for " +
      product.game +
      ". Performance-tuned profile with guided setup, validation checks, and responsive support coverage."
    );
  }

  function productFeatures(product) {
    if (Array.isArray(product.features) && product.features.length) return product.features;
    return ["Instant delivery", "Version-safe setup", "Priority support"];
  }

  function productUpdated(product) {
    return product.updated || "Updated daily";
  }

  function renderCategoryChips(targetId, onChange) {
    const target = el(targetId);
    if (!target || !window.siteData) return;

    const categories = ["All"].concat(window.siteData.categories);
    let current = "All";

    function paint() {
      target.innerHTML = categories
        .map(function (c) {
          var active = c === current ? "active" : "";
          return '<button class="chip ' + active + '" data-cat="' + c + '">' + c + "</button>";
        })
        .join("");

      target.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          current = chip.getAttribute("data-cat");
          paint();
          onChange(current);
        });
      });
    }

    paint();
    onChange(current);
  }

  function renderProductsGrid(targetId, options) {
    if (!window.siteData) return;
    const target = el(targetId);
    const search = el(options.searchId);
    const sort = el(options.sortId);
    const reset = el(options.resetId);
    let category = "All";

    function compare(a, b) {
      const v = sort ? sort.value : "featured";
      if (v === "price-asc") return a.price - b.price;
      if (v === "price-desc") return b.price - a.price;
      if (v === "name") return a.name.localeCompare(b.name);
      return 0;
    }

    function draw() {
      const q = search ? search.value.trim().toLowerCase() : "";
      const data = window.siteData.products
        .filter(function (p) {
          return category === "All" || p.game === category;
        })
        .filter(function (p) {
          return (p.name + " " + p.game + " " + p.status).toLowerCase().indexOf(q) !== -1;
        })
        .sort(compare);

      if (!data.length) {
        target.innerHTML = '<article class="card"><h3>No results</h3><p>Try a different search or category.</p></article>';
        refreshVisuals();
        return;
      }

      target.innerHTML = data
        .map(function (p) {
          const features = productFeatures(p)
            .slice(0, 3)
            .map(function (feature) {
              return '<span class="feature-pill">' + feature + "</span>";
            })
            .join("");

          return (
            '<article class="card">' +
            '<div class="product-banner" style="background:' + gameGradient(p.game) + '">' +
            '<div class="banner-top">' +
            '<span class="tag ' + statusClass(p.status) + '">' + p.status.toUpperCase() + "</span>" +
            '<span class="banner-game">' + p.game + "</span>" +
            "</div>" +
            '<h4 class="banner-title">' + p.name + "</h4>" +
            "</div>" +
            '<div class="product-body">' +
            "<h3>" + p.name + "</h3>" +
            '<p class="product-desc">' + productDescription(p) + "</p>" +
            '<div class="product-features">' + features + "</div>" +
            '<div class="product-meta-row"><span class="meta-label">Last update</span><span class="meta-value">' + productUpdated(p) + "</span></div>" +
            '<div class="meta">' +
            '<div class="price">' + money(p.price) + ' <small>USD</small></div>' +
            '<div class="pill">' + p.game + "</div>" +
            "</div>" +
            '<div class="product-actions">' +
            '<button class="action-btn action-ghost" type="button">View details</button>' +
            '<button class="action-btn action-primary" type="button">Buy now</button>' +
            "</div>" +
            "</div>" +
            "</article>"
          );
        })
        .join("");

      refreshVisuals();
    }

    renderCategoryChips(options.chipsId, function (c) {
      category = c;
      draw();
    });

    if (search) search.addEventListener("input", draw);
    if (sort) sort.addEventListener("change", draw);
    if (reset) {
      reset.addEventListener("click", function () {
        if (search) search.value = "";
        if (sort) sort.value = "featured";
        category = "All";
        renderCategoryChips(options.chipsId, function (c) {
          category = c;
          draw();
        });
      });
    }

    draw();

    return {
      redraw: draw,
      setCategory: function (value) {
        category = value;
        draw();
      }
    };
  }

  function renderCategoryGrid(targetId) {
    const target = el(targetId);
    if (!target || !window.siteData) return;
    target.innerHTML = window.siteData.categories
      .map(function (c) {
        const count = window.siteData.products.filter(function (p) {
          return p.game === c;
        }).length;

        return (
          '<article class="card">' +
          '<div class="category-chip" style="background:' + gameGradient(c) + '"></div>' +
          "<h3>" + c + "</h3>" +
          '<p>' + (count ? count + ' products available in catalog.' : 'Category mapped in structure.') + "</p>" +
          "</article>"
        );
      })
      .join("");

    refreshVisuals();
  }

  function renderReviews(targetId) {
    const target = el(targetId);
    if (!target || !window.siteData) return;
    target.innerHTML = window.siteData.reviews
      .map(function (r) {
        const initials = (r.user || "U")
          .split(" ")
          .slice(0, 2)
          .map(function (part) {
            return part.charAt(0).toUpperCase();
          })
          .join("");

        return (
          '<article class="card review-card">' +
          '<div class="review-head">' +
          '<span class="avatar">' + initials + "</span>" +
          '<div><h3>' + r.user + '</h3><p class="review-date">' + r.date + "</p></div>" +
          "</div>" +
          '<span class="tag ok">★★★★★</span>' +
          '<p class="review-text">' + r.text + "</p>" +
          "</article>"
        );
      })
      .join("");

    refreshVisuals();
  }

  function setupRevealObserver() {
    if (revealObserver) return revealObserver;

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.13 }
    );

    return revealObserver;
  }

  function refreshVisuals() {
    const observer = setupRevealObserver();
    document.querySelectorAll(".hero, .section, .card, .stat").forEach(function (node) {
      if (!node.classList.contains("reveal")) {
        node.classList.add("reveal");
      }

      if (!node.classList.contains("in")) {
        observer.observe(node);
      }
    });
  }

  function enableMotion() {
    if (motionBound) return;
    motionBound = true;

    window.addEventListener(
      "pointermove",
      function (event) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const px = (event.clientX - cx) / cx;
        const py = (event.clientY - cy) / cy;
        document.documentElement.style.setProperty("--px", String(px.toFixed(3)));
        document.documentElement.style.setProperty("--py", String(py.toFixed(3)));
      },
      { passive: true }
    );
  }

  function initVisuals() {
    ensureSpaceScene();
    showOpeningSplash();
    enableFloatingPopup();
    refreshVisuals();
    enableMotion();
  }

  function ensureSpaceScene() {
    if (document.querySelector(".space-scene")) return;

    const scene = document.createElement("div");
    scene.className = "space-scene";
    scene.setAttribute("aria-hidden", "true");

    const nebulaA = document.createElement("div");
    nebulaA.className = "nebula nebula-a";
    const nebulaB = document.createElement("div");
    nebulaB.className = "nebula nebula-b";
    const stars = document.createElement("div");
    stars.className = "starfield";

    for (let i = 0; i < 90; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
      star.style.animationDuration = (1.4 + Math.random() * 3.4).toFixed(2) + "s";
      star.style.opacity = String(0.3 + Math.random() * 0.7);
      stars.appendChild(star);
    }

    scene.appendChild(nebulaA);
    scene.appendChild(nebulaB);
    scene.appendChild(stars);
    document.body.appendChild(scene);
  }

  function showOpeningSplash() {
    if (splashShown || sessionStorage.getItem("cosmoSplash") === "1") return;
    splashShown = true;

    const splash = document.createElement("div");
    splash.className = "opening-splash";
    splash.innerHTML =
      '<div class="splash-core">' +
      '<div class="splash-ring"></div>' +
      '<div class="splash-title">COSMIC INTERFACE</div>' +
      '<div class="splash-sub">Loading premium experience...</div>' +
      "</div>";

    document.body.appendChild(splash);
    requestAnimationFrame(function () {
      splash.classList.add("in");
    });

    setTimeout(function () {
      splash.classList.add("out");
      sessionStorage.setItem("cosmoSplash", "1");
      setTimeout(function () {
        splash.remove();
      }, 750);
    }, 1550);
  }

  function enableFloatingPopup() {
    if (popupShown) return;
    popupShown = true;

    if (!document.querySelector(".floating-popup-btn")) {
      const btn = document.createElement("button");
      btn.className = "floating-popup-btn";
      btn.type = "button";
      btn.textContent = "Live Updates";
      btn.addEventListener("click", openPopup);
      document.body.appendChild(btn);
    }

    if (!document.querySelector(".popup-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";
      overlay.innerHTML =
        '<div class="popup-card">' +
        '<button class="popup-close" type="button">×</button>' +
        '<p class="popup-kicker">System Notice</p>' +
        '<h3>Cosmic live updates are active</h3>' +
        '<p>Catalog data syncs every 30 seconds. Watch status windows and recent update tags inside product cards.</p>' +
        '<div class="btn-row"><a class="btn primary" href="/cosmo-clone/store/">Open catalog</a><button class="btn ghost popup-dismiss" type="button">Got it</button></div>' +
        "</div>";

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closePopup();
      });

      document.body.appendChild(overlay);

      const closeBtn = overlay.querySelector(".popup-close");
      const dismissBtn = overlay.querySelector(".popup-dismiss");
      if (closeBtn) closeBtn.addEventListener("click", closePopup);
      if (dismissBtn) dismissBtn.addEventListener("click", closePopup);
    }

    if (sessionStorage.getItem("cosmoPopup") !== "1") {
      setTimeout(function () {
        openPopup();
      }, 2400);
    }
  }

  function openPopup() {
    const overlay = document.querySelector(".popup-overlay");
    if (!overlay) return;
    overlay.classList.add("open");
    sessionStorage.setItem("cosmoPopup", "1");
  }

  function closePopup() {
    const overlay = document.querySelector(".popup-overlay");
    if (!overlay) return;
    overlay.classList.remove("open");
  }

  async function loadLiveData() {
    try {
      const res = await fetch(LIVE_URL + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return false;
      const json = await res.json();
      if (!json || !json.products || !json.categories || !json.reviews) return false;
      window.siteData = json;
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateLiveStamp(ok) {
    const stamp = el("liveStamp");
    if (!stamp) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    stamp.textContent = ok ? "Live feed synced at " + time : "Using local dataset";
  }

  async function enableLiveData(onRefresh) {
    const ok = await loadLiveData();
    updateLiveStamp(ok);
    if (typeof onRefresh === "function") onRefresh();

    setInterval(async function () {
      const updated = await loadLiveData();
      updateLiveStamp(updated);
      if (updated && typeof onRefresh === "function") onRefresh();
    }, 30000);
  }

  window.App = {
    renderProductsGrid: renderProductsGrid,
    renderCategoryGrid: renderCategoryGrid,
    renderReviews: renderReviews,
    enableLiveData: enableLiveData,
    initVisuals: initVisuals,
    refreshVisuals: refreshVisuals
  };
})();
