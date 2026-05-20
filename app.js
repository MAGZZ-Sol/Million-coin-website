(function () {
  const cfg = window.COIN_CONFIG || {};
  const GOAL = cfg.goalMarketCap ?? 1_000_000;
  const launchTs = cfg.launchTimestamp ?? Math.floor(Date.now() / 1000);
  const $ = (id) => document.getElementById(id);

  function shortenAddress(addr) {
    if (!addr || addr.length < 12) return addr || "-";
    return addr.slice(0, 6) + "..." + addr.slice(-6);
  }

  function formatUsd(n) {
    if (n == null || !Number.isFinite(n)) return "$ -";
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
    return "$" + Math.round(n).toLocaleString();
  }

  function formatElapsed(seconds) {
    if (seconds < 60) return seconds + "s since launch";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m since launch";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h since launch";
    return Math.floor(seconds / 86400) + "d since launch";
  }

  function setHref(id, url) {
    const el = $(id);
    if (el && url) el.href = url;
  }

  function applyConfig() {
    const title = cfg.title || "The Million Experiment";
    const titleEl = $("pageTitle");
    if (titleEl) titleEl.textContent = title;
    document.title = title;

    const logoEl = $("logo");
    if (logoEl && logoEl.tagName === "IMG" && cfg.logoUrl) {
      logoEl.src = cfg.logoUrl;
    }

    const addr = cfg.contractAddress || "";
    const contractEl = $("contractDisplay");
    if (contractEl) {
      contractEl.textContent = shortenAddress(addr);
      contractEl.dataset.full = addr;
    }

    setHref("linkDex", cfg.links && cfg.links.dexscreener);
    setHref("linkPump", cfg.links && cfg.links.pumpfun);

    const goalLabel = GOAL >= 1_000_000 ? "$1M" : "$" + (GOAL / 1_000).toFixed(0) + "K";
    const progressLabel = $("progressLabel");
    if (progressLabel) progressLabel.textContent = "Progress to " + goalLabel;
  }

  function updateProgress(marketCap) {
    const pct = marketCap > 0 ? Math.min(100, (marketCap / GOAL) * 100) : 0;
    const pctEl = $("progressPct");
    const fillEl = $("progressFill");
    if (pctEl) pctEl.textContent = pct.toFixed(2) + "%";
    if (fillEl) fillEl.style.width = pct + "%";
  }

  function updateMarketCap(value) {
    const el = $("marketCap");
    if (!el) return;
    if (value != null && Number.isFinite(value) && value > 0) {
      el.textContent = formatUsd(value);
      el.classList.add("live");
      updateProgress(value);
    } else {
      el.textContent = "$ -";
      el.classList.remove("live");
      updateProgress(0);
    }
  }

  function tickClock() {
    const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - launchTs);
    const el = $("timeSinceLaunch");
    if (el) el.textContent = formatElapsed(elapsed);
  }

  async function fetchMarketCap() {
    const api = (cfg.dexscreenerApiUrl || "").trim();
    if (!api) return;
    try {
      const res = await fetch(api);
      if (!res.ok) return;
      const data = await res.json();
      const pair = data && data.pairs && data.pairs[0];
      const cap = pair && (pair.marketCap != null ? pair.marketCap : pair.fdv);
      if (cap != null) updateMarketCap(Number(cap));
    } catch (_) {}
  }

  var copyBtn = $("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async function () {
      const contractEl = $("contractDisplay");
      const full = contractEl && contractEl.dataset.full;
      if (!full) return;
      try {
        await navigator.clipboard.writeText(full);
        copyBtn.classList.add("copied");
        setTimeout(function () { copyBtn.classList.remove("copied"); }, 1500);
      } catch (_) {
        var ta = document.createElement("textarea");
        ta.value = full;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    });
  }

  applyConfig();
  tickClock();
  setInterval(tickClock, 1000);
  fetchMarketCap();
  setInterval(fetchMarketCap, 15000);
})();