(function () {
  const LIVE_URL = "/cosmo-clone/assets/live-data.json";

  function el(id) {
    return document.getElementById(id);
  }

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function statusClass(status) {
    return status === "Operational" ? "ok" : "warn";
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
        return;
      }

      target.innerHTML = data
        .map(function (p) {
          return (
            '<article class="card">' +
            '<span class="tag ' + statusClass(p.status) + '">' + p.status.toUpperCase() + "</span>" +
            "<h3>" + p.name + "</h3>" +
            '<div class="meta">' +
            '<div class="price">' + money(p.price) + ' <small>USD</small></div>' +
            '<div class="pill">' + p.game + "</div>" +
            "</div>" +
            "</article>"
          );
        })
        .join("");
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
        return '<article class="card"><h3>' + c + '</h3><p>Category available in catalog.</p></article>';
      })
      .join("");
  }

  function renderReviews(targetId) {
    const target = el(targetId);
    if (!target || !window.siteData) return;
    target.innerHTML = window.siteData.reviews
      .map(function (r) {
        return '<article class="card"><span class="tag ok">★★★★★</span><h3>' + r.user + '</h3><p>' + r.text + ' - ' + r.date + '</p></article>';
      })
      .join("");
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
    enableLiveData: enableLiveData
  };
})();
