
// ==UserScript==
// @name         SU YouTube Embed + Clean Flex Layout + Tables (Hybrid 3.2)
// @namespace    https://github.com/Callmesnake5561/SUYouTubeEmbed
// @version      3.2
// @description  Stable overlay: video left, styled tables right; description + screenshots; grouped mirrors; robust observer (no body wipe)
// @match        https://steamunderground.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    stripWords: ["PC Game", "Free Download", "Direct Download"],
    ytQueries: ["review", "gameplay", "impressions", "first look", "early access", "trailer", "overview", ""],
    hostPriority: ["datanodes", "torrent", "gofile", "akirabox", "mediafire", "pixeldrain", "megaup", "1fichier", "rapidgator", "hitfile", "nitroflare", "ddl"],
    primaryHostLimit: 3,
    linksPerHostLimit: 1
  };

  const log = (...args) => console.log("[SURefine]", ...args);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const toLower = (s) => (s || "").toLowerCase();

  function cleanGameTitle(rawTitle) {
    let t = rawTitle || "";
    t = t.replace(/\(.*?\)/g, "");
    CONFIG.stripWords.forEach(word => { t = t.replace(new RegExp(word, "gi"), ""); });
    t = t.replace(/[-|–|—]\s*free\s*download.*$/i, "");
    return t.trim();
  }

  // POLISHED FLEX LAYOUT: video left, tables right, description and screenshots below
  function ensureInfoCard(titleEl) {
    let container = document.querySelector("[data-suinfocard]");
    if (container) return container;

    container = document.createElement("div");
    container.setAttribute("data-suinfocard", "true");
    container.style.background = "#1c1c1c";
    container.style.color = "#eee";
    container.style.borderRadius = "8px";
    container.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    container.style.padding = "15px";
    container.style.margin = "15px 0";
    container.style.border = "2px solid #444";

    const cleanTitle = cleanGameTitle(titleEl.innerText);
    container.innerHTML = `
      <h2 style="margin:0 0 12px 0">${cleanTitle}</h2>

      <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-start">
        <div id="su-video" style="flex:1 1 60%; min-width:320px"></div>
        <div style="flex:1 1 40%; min-width:280px; display:flex; flex-direction:column; gap:12px">
          <div id="su-meta"></div>
          <div id="su-requirements"></div>
          <div id="su-downloads"></div>
        </div>
      </div>

      <div id="su-description" style="margin-top:18px; background:#202020; padding:12px; border-radius:6px"></div>

      <div id="su-screenshots" style="margin-top:18px">
        <h3 style="margin:0 0 8px 0">📸 Screenshots</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px"></div>
      </div>

      <div id="su-links" style="margin-top:12px"></div>
    `;
    titleEl.insertAdjacentElement("afterend", container);
    return container;
  }

  // Metadata (stable v3.1 approach)
  function fillMetadata(container) {
    const rawText = document.body.innerText || "";
    const getLine = (label) => {
      const re = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
      const m = rawText.match(re);
      return m ? m[1].trim() : "Unknown";
    };
    const metaDiv = container.querySelector("#su-meta");
    const title = container.querySelector("h2").textContent;

    const release = getLine("Release Date");
    const version = getLine("Game Version");
    const scene = (rawText.match(/(Scene Group|Game Source):\s*([^\n]+)/i) || [])[2] || "Unknown";

    const newMeta = `
      <table style="width:100%; border-collapse:collapse; background:#2a2a2a; border-radius:6px; overflow:hidden; font-size:14px; color:#ddd">
        <tr><th colspan="2" style="background:#333; color:#fff; text-align:left; padding:8px 10px">📊 Game info</th></tr>
        <tr><td style="padding:6px 10px; border-top:1px solid #444">Release</td><td style="padding:6px 10px; border-top:1px solid #444">${release}</td></tr>
        <tr><td style="padding:6px 10px; border-top:1px solid #444">Version</td><td style="padding:6px 10px; border-top:1px solid #444">${version}</td></tr>
        <tr><td style="padding:6px 10px; border-top:1px solid #444">Scene group</td><td style="padding:6px 10px; border-top:1px solid #444">${scene}</td></tr>
      </table>
    `;
    if (metaDiv.dataset.hash !== newMeta) {
      metaDiv.innerHTML = newMeta;
      metaDiv.dataset.hash = newMeta;
    }

    const linksDiv = container.querySelector("#su-links");
    const linksMarkup = [
      { name: "🔎 Metacritic", url: `https://www.metacritic.com/search/${encodeURIComponent(title)}/results` },
      { name: "🔎 SteamDB",    url: `https://steamdb.info/search/?a=app&q=${encodeURIComponent(title)}` },
      { name: "🔎 YouTube",    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}` }
    ].map(l => `<a href="${l.url}" target="_blank" style="margin-right:8px;padding:6px 10px;background:#444;color:#fff;text-decoration:none;border-radius:4px;font-size:14px">${l.name}</a>`).join("");

    if (linksDiv.dataset.hash !== linksMarkup) {
      linksDiv.innerHTML = linksMarkup;
      linksDiv.dataset.hash = linksMarkup;
    }
  }

  // Requirements (stable v3.1 parser, rendered as styled table)
  function fillRequirements(container) {
    const raw = document.body.innerText || "";
    const match = raw.match(/System requirements([\s\S]*?)(Support the game|Tags|Share on|Screenshots|Download)/i);
    const reqDiv = container.querySelector("#su-requirements");

    if (!match) {
      reqDiv.innerHTML = "";
      reqDiv.dataset.hash = "";
      return;
    }

    const block = match[1];
    const lines = block.split("\n").map(l => l.trim()).filter(l => l && l.includes(":"));

    const hash = JSON.stringify(lines);
    if (reqDiv.dataset.hash === hash) return;
    reqDiv.innerHTML = "";
    reqDiv.dataset.hash = hash;

    if (!lines.length) return;

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.background = "#2a2a2a";
    table.style.borderRadius = "6px";
    table.style.overflow = "hidden";
    table.style.fontSize = "14px";
    table.style.color = "#ddd";

    table.innerHTML = `
      <tr><th colspan="2" style="background:#333; color:#fff; text-align:left; padding:8px 10px">💻 System requirements</th></tr>
      ${lines.map(line => {
        const idx = line.indexOf(":");
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        return `<tr><td style="padding:6px 10px; border-top:1px solid #444">${key}</td><td style="padding:6px 10px; border-top:1px solid #444">${val}</td></tr>`;
      }).join("")}
    `;
    reqDiv.appendChild(table);
  }

  // Downloads (stable v3.1, grouped + toggle)
  function fillDownloads(container) {
    const main = document.querySelector("article, .post, .entry-content, .post-content") || document.body;
    const anchors = Array.from(main.querySelectorAll("a[href]"));
    const hostRegex = new RegExp(CONFIG.hostPriority.join("|"), "i");

    const candidates = anchors.filter(a => {
      const href = toLower(a.href);
      const text = toLower(a.textContent);
      const isHost = hostRegex.test(href) || hostRegex.test(text);
      const isInternal = href.startsWith(window.location.origin) && !/torrent/.test(text);
      return isHost && !isInternal;
    });

    const unique = [];
    const seen = new Set();
    candidates.forEach(a => {
      try {
        const u = new URL(a.href);
        const hostKey = (u.hostname || "").toLowerCase().replace(/^www\./, "");
        const key = `${hostKey}${u.pathname}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({ a, hostKey, label: (a.textContent || "").trim() });
        }
      } catch {}
    });

    const dlDiv = container.querySelector("#su-downloads");
    const hash = JSON.stringify(unique.map(u => u.a.href));
    if (dlDiv.dataset.hash === hash) return;
    dlDiv.innerHTML = "";
    dlDiv.dataset.hash = hash;

    if (!unique.length) return;

    unique.sort((x, y) => {
      const px = CONFIG.hostPriority.indexOf(x.hostKey.split(".").shift());
      const py = CONFIG.hostPriority.indexOf(y.hostKey.split(".").shift());
      const byHost = (px === -1 ? 999 : px) - (py === -1 ? 999 : py);
      if (byHost !== 0) return byHost;
      return (x.label || "").length - (y.label || "").length;
    });

    const perHost = new Map();
    unique.forEach(item => {
      const key = CONFIG.hostPriority.find(h => item.hostKey.includes(h)) || item.hostKey;
      if (!perHost.has(key)) perHost.set(key, []);
      perHost.get(key).push(item);
    });

    const header = document.createElement("h3");
    header.textContent = "📥 Download mirrors";
    header.style.margin = "0 0 6px 0";
    dlDiv.appendChild(header);

    const primaryList = document.createElement("div");
    primaryList.style.display = "grid";
    primaryList.style.gridTemplateColumns = "1fr";
    primaryList.style.gap = "6px";
    dlDiv.appendChild(primaryList);

    const overflowList = document.createElement("div");
    overflowList.style.display = "none";
    overflowList.style.marginTop = "8px";
    dlDiv.appendChild(overflowList);

    let shownHosts = 0;
    const overflowItems = [];

    for (const host of CONFIG.hostPriority) {
      if (!perHost.has(host)) continue;
      const items = perHost.get(host);

      const hostHeader = document.createElement("div");
      hostHeader.textContent = host.charAt(0).toUpperCase() + host.slice(1);
      hostHeader.style.fontWeight = "700";
      hostHeader.style.marginTop = "6px";

      const hostBlock = document.createElement("div");

      items.slice(0, CONFIG.linksPerHostLimit).forEach(({ a, label }) => {
        const link = document.createElement("a");
        link.href = a.href;
        link.textContent = label || a.href;
        link.target = "_blank";
        link.style.display = "block";
        link.style.color = "#4da6ff";
        link.style.fontWeight = "600";
        link.style.textDecoration = "none";
        hostBlock.appendChild(link);
      });

      items.slice(CONFIG.linksPerHostLimit).forEach(({ a, label }) => {
        const link = document.createElement("a");
        link.href = a.href;
        link.textContent = label || a.href;
        link.target = "_blank";
        link.style.display = "block";
        link.style.color = "#8fbfff";
        link.style.textDecoration = "none";
        overflowItems.push({ host, header: hostHeader, link });
      });

      if (shownHosts < CONFIG.primaryHostLimit) {
        primaryList.appendChild(hostHeader);
        primaryList.appendChild(hostBlock);
        shownHosts++;
      } else {
        overflowItems.push({ host, header: hostHeader, link: hostBlock });
      }
    }

    if (overflowItems.length > 0) {
      const toggle = document.createElement("button");
      toggle.textContent = "Show all mirrors";
      toggle.style.marginTop = "10px";
      toggle.style.padding = "6px 10px";
      toggle.style.background = "#444";
      toggle.style.color = "#fff";
      toggle.style.border = "none";
      toggle.style.borderRadius = "4px";
      toggle.style.cursor = "pointer";

      let expanded = false;
      toggle.addEventListener("click", () => {
        expanded = !expanded;
        overflowList.style.display = expanded ? "block" : "none";
        toggle.textContent = expanded ? "Hide extra mirrors" : "Show all mirrors";
      });

      dlDiv.appendChild(toggle);

      const grouped = new Map();
      overflowItems.forEach(item => {
        if (!grouped.has(item.host)) {
          grouped.set(item.host, { header: item.header.cloneNode(true), block: document.createElement("div") });
        }
        const pack = grouped.get(item.host);
        pack.block.appendChild(item.link instanceof HTMLElement ? item.link : (() => {
          const l = document.createElement("a");
          l.href = item.link.href;
          l.textContent = item.link.textContent;
          l.target = "_blank";
          l.style.display = "block";
          l.style.color = "#8fbfff";
          return l;
        })());
      });

      grouped.forEach(({ header, block }) => {
        overflowList.appendChild(header);
        overflowList.appendChild(block);
      });
    }
  }

  // Description (new section using longest non-download paragraph)
  function fillDescription(container) {
    const paras = [...document.querySelectorAll("p")];
    const pick = paras
      .map(p => (p.innerText || "").trim())
      .filter(t => t.length > 80 && !/downloads?|requirements?|install|password|changelog/i.test(t))
      .sort((a,b) => b.length - a.length)[0];
    const box = container.querySelector("#su-description");
    box.textContent = pick || "No description available.";
  }

  // Screenshots grid (new section)
  function fillScreenshots(container, title) {
    const slug = toLower(cleanGameTitle(title)).replace(/[^a-z0-9]+/g, "-");
    const imgs = [...document.querySelectorAll("img")];
    let shots = imgs
      .filter(img => {
        const s = toLower(img.src || "");
        const alt = toLower(img.alt || "");
        const inContent = /uploads|wp-content|images|content/.test(s);
        const matches = s.includes(slug) || alt.includes(slug) || /screenshot|screen|image/.test(alt);
        return inContent && matches;
      })
      .map(img => img.src);

    if (!shots.length) {
      shots = imgs.filter(img => /uploads|wp-content|images|content/.test(toLower(img.src || ""))).slice(0, 6).map(img => img.src);
    }

    const grid = container.querySelector("#su-screenshots div");
    grid.innerHTML = "";
    shots.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.borderRadius = "6px";
      img.loading = "lazy";
      grid.appendChild(img);
    });
  }

  // YouTube embed (stable v3.1 with fallback)
  function embedVideo(videoId, container) {
    const slot = container.querySelector("#su-video");
    const existing = slot.querySelector("iframe");
    if (existing && existing.src.includes(videoId)) return;

    slot.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.width = "100%";
    iframe.style.maxWidth = "640px";
    iframe.style.aspectRatio = "16/9";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    slot.appendChild(iframe);
    log("Embedded video:", videoId);
  }

  function insertYTSearch(container, title) {
    const slot = container.querySelector("#su-video");
    if (slot.querySelector("a")) return;
    const a = document.createElement("a");
    a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
    a.textContent = `🔎 Search YouTube for ${title}`;
    a.target = "_blank";
    a.style.display = "inline-block";
    a.style.marginTop = "6px";
    a.style.padding = "8px 12px";
    a.style.backgroundColor = "#c4302b";
    a.style.color = "#fff";
    a.style.fontWeight = "bold";
    a.style.textDecoration = "none";
    a.style.borderRadius = "5px";
    slot.innerHTML = "";
    slot.appendChild(a);
  }

  function httpGet(url, onSuccess, onError) {
    if (typeof GM_xmlhttpRequest !== "undefined") {
      GM_xmlhttpRequest({ method: "GET", url, onload: res => onSuccess(res.responseText), onerror: onError });
    } else {
      fetch(url).then(r => r.text()).then(onSuccess).catch(onError);
    }
  }

  function tryYTQueries(container, title, i = 0) {
    if (i >= CONFIG.ytQueries.length) { insertYTSearch(container, title); return; }
    const q = (CONFIG.ytQueries[i] ? `${title} ${CONFIG.ytQueries[i]}` : title).trim();
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    httpGet(url, html => {
      const match = html.match(/"videoRenderer".*?"videoId":"(.*?)"/);
      if (match && match[1]) { embedVideo(match[1], container); }
      else { tryYTQueries(container, title, i + 1); }
    }, () => { tryYTQueries(container, title, i + 1); });
  }

  // Main runner (no body wipe)
  async function refinePage() {
    if (document.querySelector("[data-suinfocard]")) return;

    const titleEl = document.querySelector("h1");
    if (!titleEl) return;

    const card = ensureInfoCard(titleEl);
    await sleep(250);

    fillMetadata(card);
    fillRequirements(card);
    fillDownloads(card);

    const cleanTitle = cleanGameTitle(titleEl.innerText);
    fillDescription(card);
    fillScreenshots(card, cleanTitle);
    tryYTQueries(card, cleanTitle);
  }

  // Observer (stable, narrow scope, debounce)
  window.addEventListener("load", refinePage);
  let debounce;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(refinePage, 1000);
  });

  const target = document.querySelector("article, .post, .entry-content, .post-content") || document.body;
  observer.observe(target, { childList: true, subtree: false });
})();
