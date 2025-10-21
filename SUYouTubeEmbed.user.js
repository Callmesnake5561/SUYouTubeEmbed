// @connect api.steampowered.com

// ==UserScript==
// @name         SU YouTube Embed + Info Card + Quick Links + Downloads
// @namespace    https://github.com/Callmesnake5561/SUYouTubeEmbed
// @version      3.1
// @description  Clean overlay for SteamUnderground pages: title, metadata, system requirements, quick links, grouped download mirrors, and YouTube embed (no flicker)
// @match        https://steamunderground.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    stripWords: ["PC Game", "Free Download", "Direct Download"],
    ytQueries: ["review", "gameplay", "impressions", "first look", "early access", "trailer", "overview", ""],
    hostPriority: ["datanodes", "torrent", "gofile", "akirabox", "mediafire", "pixeldrain", "megaup", "1fichier", "rapidgator", "hitfile", "nitroflare", "ddl"],
    primaryHostLimit: 3,   // show up to 3 host groups by default
    linksPerHostLimit: 1   // show up to 1 mirror per host by default
  };

  const log = (...args) => console.log("[SURefine]", ...args);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const toLower = (s) => (s || "").toLowerCase();

  // Clean the noisy H1 title
  function cleanGameTitle(rawTitle) {
    let t = rawTitle || "";
    t = t.replace(/\(.*?\)/g, ""); // remove parenthetical tags
    CONFIG.stripWords.forEach(word => { t = t.replace(new RegExp(word, "gi"), ""); });
    t = t.replace(/[-|–|—]\s*free\s*download.*$/i, ""); // trim trailing "Free Download"
    return t.trim();
  }

  // Build or reuse the overlay card
  function ensureInfoCard(titleEl) {
    let container = document.querySelector("[data-suinfocard]");
    if (container) return container;

    container = document.createElement("div");
    container.setAttribute("data-suinfocard", "true");
    container.style.border = "2px solid #444";
    container.style.padding = "15px";
    container.style.margin = "15px 0";
    container.style.background = "#1c1c1c";
    container.style.color = "#eee";
    container.style.borderRadius = "8px";
    container.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

    const cleanTitle = cleanGameTitle(titleEl.innerText);
    container.innerHTML = `
      <h2 style="margin-top:0">${cleanTitle}</h2>
      <div id="su-meta" style="margin:6px 0 10px 0"></div>
      <div id="su-links" style="margin-top:6px"></div>
      <div id="su-requirements" style="margin-top:12px"></div>
      <div id="su-downloads" style="margin-top:12px"></div>
      <div id="su-video" style="margin-top:12px"></div>
    `;
    titleEl.insertAdjacentElement("afterend", container);
    return container;
  }

  // Fill metadata safely
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

    // Guard: avoid unnecessary re-render if unchanged
    const newMeta = `
      <p style="margin:0"><strong>Release:</strong> ${release}</p>
      <p style="margin:0"><strong>Version:</strong> ${version}</p>
      <p style="margin:0"><strong>Scene group:</strong> ${scene}</p>
    `;
    if (metaDiv.dataset.hash !== newMeta) {
      metaDiv.innerHTML = newMeta;
      metaDiv.dataset.hash = newMeta;
    }

    // Quick external links
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

  // Parse requirements block into a simple table
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
    const lines = block.split("\n")
      .map(l => l.trim())
      .filter(l => l && l.includes(":"));

    const hash = JSON.stringify(lines);
    if (reqDiv.dataset.hash === hash) return; // Guard: no re-render if same content
    reqDiv.innerHTML = "";
    reqDiv.dataset.hash = hash;

    if (!lines.length) return;

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "6px";
    table.innerHTML = `
      <thead>
        <tr style="background:#333;color:#fff">
          <th style="padding:6px;border:1px solid #555;text-align:left">Component</th>
          <th style="padding:6px;border:1px solid #555;text-align:left">Spec</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    lines.forEach(line => {
      const idx = line.indexOf(":");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:6px;border:1px solid #555">${key}</td>
        <td style="padding:6px;border:1px solid #555">${val}</td>
      `;
      tbody.appendChild(tr);
    });

    const header = document.createElement("h3");
    header.textContent = "🖥️ System requirements";
    header.style.margin = "0 0 6px 0";
    reqDiv.appendChild(header);
    reqDiv.appendChild(table);
  }

  // Smarter, limited, grouped download links extractor
  function fillDownloads(container) {
    const main = document.querySelector("article, .post, .entry-content, .post-content") || document.body;
    const anchors = Array.from(main.querySelectorAll("a[href]"));

    const hostRegex = new RegExp(CONFIG.hostPriority.join("|"), "i");

    // Strict host-only filter (no generic "download" text to avoid noise)
    const candidates = anchors.filter(a => {
      const href = toLower(a.href);
      const text = toLower(a.textContent);
      const isHost = hostRegex.test(href) || hostRegex.test(text);
      // Exclude internal anchors unless they specifically mention "torrent"
      const isInternal = href.startsWith(window.location.origin) && !/torrent/.test(text);
      return isHost && !isInternal;
    });

    // Deduplicate by hostname + pathname
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
      } catch { /* skip malformed */ }
    });

    // Hash to avoid re-render flicker
    const dlDiv = container.querySelector("#su-downloads");
    const hash = JSON.stringify(unique.map(u => u.a.href));
    if (dlDiv.dataset.hash === hash) return; // Guard: same content, skip
    dlDiv.innerHTML = "";
    dlDiv.dataset.hash = hash;

    if (!unique.length) return;

    // Sort by host priority, then shorter text first
    unique.sort((x, y) => {
      const px = CONFIG.hostPriority.indexOf(x.hostKey.split(".").shift());
      const py = CONFIG.hostPriority.indexOf(y.hostKey.split(".").shift());
      const byHost = (px === -1 ? 999 : px) - (py === -1 ? 999 : py);
      if (byHost !== 0) return byHost;
      return (x.label || "").length - (y.label || "").length;
    });

    // Group by host
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

      // Primary mirrors per host
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

      // Overflow mirrors per host
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

  // YouTube embed helpers
  function embedVideo(videoId, container) {
    const slot = container.querySelector("#su-video");
    const existing = slot.querySelector("iframe");
    // Guard: if the same video is already embedded, do nothing
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
    // Guard: prevent duplicate fallback button
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
      GM_xmlhttpRequest({
        method: "GET",
        url,
        onload: res => onSuccess(res.responseText),
        onerror: onError
      });
    } else {
      fetch(url).then(r => r.text()).then(onSuccess).catch(onError);
    }
  }

  function tryYTQueries(container, title, i = 0) {
    if (i >= CONFIG.ytQueries.length) {
      insertYTSearch(container, title);
      return;
    }
    const q = (CONFIG.ytQueries[i] ? `${title} ${CONFIG.ytQueries[i]}` : title).trim();
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

    httpGet(url, html => {
      const match = html.match(/"videoRenderer".*?"videoId":"(.*?)"/);
      if (match && match[1]) {
        embedVideo(match[1], container);
      } else {
        tryYTQueries(container, title, i + 1);
      }
    }, () => {
      tryYTQueries(container, title, i + 1);
    });
  }
// --- Top Steam Games helpers ---
async function getTopSteamGames() {
  try {
    const res = await fetch("https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.response.ranks.slice(0, 20); // top 20
  } catch (err) {
    console.error("Top Steam Games fetch failed:", err);
    return []; // fallback to empty list
  }
}


function suSearchUrl(gameName) {
  const query = encodeURIComponent(gameName);
  return `https://steamunderground.net/?s=${query}`;
}

async function renderTopGames(container) {
  const topDiv = document.createElement("div");
  topDiv.id = "su-topgames";
  topDiv.style.marginTop = "20px";

  const header = document.createElement("h3");
  header.textContent = "🔥 Top 20 Steam Games This Month";
  topDiv.appendChild(header);

  const list = document.createElement("ol");
  const games = await getTopSteamGames();

  games.forEach(g => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = suSearchUrl(g.name);
    a.textContent = g.name;
    a.target = "_blank";
    a.style.color = "#4da6ff";
    li.appendChild(a);
    list.appendChild(li);
  });

  topDiv.appendChild(list);
  container.appendChild(topDiv);
}

  // Main runner
  async function refinePage() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) return;

    const card = ensureInfoCard(titleEl);

    // Wait for late content to load before parsing
    await sleep(250);

    fillMetadata(card);
    fillRequirements(card);
    fillDownloads(card);

// 🔥 Add Top Steam Games section here
renderTopGames(card);

const cleanTitle = cleanGameTitle(titleEl.innerText);
tryYTQueries(card, cleanTitle);
    
  }

  // Run at load and re-run on dynamic changes with debounce
  window.addEventListener("load", refinePage);
  let debounce;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(refinePage, 1500); // slower debounce to avoid flicker
  });

  // Narrow scope: watch the article/post container (reduces noisy triggers)
  const target = document.querySelector("article, .post, .entry-content, .post-content") || document.body;
  observer.observe(target, { childList: true, subtree: false });
})();
