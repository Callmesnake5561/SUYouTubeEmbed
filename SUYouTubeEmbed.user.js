// ==UserScript==
// @name         SU Clean Game Page Rebuild
// @namespace    SURebuild
// @version      1.0
// @description  Replace SU game pages with a clean layout: title, trailer, description, screenshots, downloads, and Disqus only
// @author       Brandon
// @match        https://steamunderground.net/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // --- Utility ---
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // --- Scrape description ---
  function scrapeDescription() {
    const article = document.querySelector("article, .entry-content, .post-content");
    if (!article) return "";
    const paras = [...article.querySelectorAll("p")];
    return paras.map(p => p.innerText.trim())
                .filter(t => t.length > 50 && !t.toLowerCase().includes("download"))[0] || "";
  }

  // --- Scrape screenshots ---
  function scrapeScreenshots() {
    return [...document.querySelectorAll("img")]
      .filter(img => img.src && !img.src.includes("logo") && !img.src.includes("icon"))
      .map(img => img.src);
  }

  // --- Scrape downloads ---
  function collectDownloadLinks() {
    const links = [...document.querySelectorAll("a[href*='download']")];
    return links.map(a => ({
      text: a.textContent.trim() || a.href,
      href: a.href
    }));
  }

  // --- Clear page but keep Disqus ---
  function clearPageButKeepDisqus() {
    const disqus = document.querySelector("#disqus_thread");
    document.body.innerHTML = "";
    if (disqus) document.body.appendChild(disqus);
  }

  // --- Fetch YouTube trailer ID ---
  async function fetchYouTubeTrailerId(query) {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " trailer")}`;
      const res = await fetch(url);
      const text = await res.text();
      const match = text.match(/"videoId":"(.*?)"/);
      return match ? match[1] : null;
    } catch (err) {
      console.error("YouTube fetch failed:", err);
      return null;
    }
  }

  // --- Build clean layout ---
  function buildCleanLayout(title, desc, screenshots, downloads, videoId) {
    const container = document.createElement("div");
    container.style.maxWidth = "1000px";
    container.style.margin = "20px auto";
    container.style.fontFamily = "Segoe UI, sans-serif";
    container.style.color = "#ddd";

    // Title
    const h1 = document.createElement("h1");
    h1.textContent = title;
    h1.style.color = "#fff";
    container.appendChild(h1);

    // Video + Description
    const flex = document.createElement("div");
    flex.style.display = "flex";
    flex.style.gap = "20px";
    flex.style.margin = "20px 0";

    if (videoId) {
      const iframe = document.createElement("iframe");
      iframe.width = "560";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.frameBorder = "0";
      iframe.allowFullscreen = true;
      iframe.style.flex = "1";
      flex.appendChild(iframe);
    }

    const descDiv = document.createElement("div");
    descDiv.style.flex = "1";
    descDiv.style.background = "#2a2a2a";
    descDiv.style.padding = "15px";
    descDiv.style.borderRadius = "6px";
    descDiv.textContent = desc || "No description available.";
    flex.appendChild(descDiv);

    container.appendChild(flex);

    // Screenshots
    if (screenshots.length) {
      const ssBlock = document.createElement("div");
      ssBlock.innerHTML = "<h3 style='color:#fff;'>📸 Screenshots</h3>";
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))";
      grid.style.gap = "10px";
      screenshots.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100%";
        img.style.borderRadius = "4px";
        grid.appendChild(img);
      });
      ssBlock.appendChild(grid);
      container.appendChild(ssBlock);
    }

    // Downloads
    if (downloads.length) {
      const dlBlock = document.createElement("div");
      dlBlock.innerHTML = "<h3 style='color:#fff;'>⬇️ Downloads</h3>";
      const list = document.createElement("ul");
      list.style.listStyle = "none";
      list.style.padding = "0";
      downloads.forEach(d => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = d.href;
        a.textContent = d.text;
        a.target = "_blank";
        a.style.color = "#4da6ff";
        li.appendChild(a);
        list.appendChild(li);
      });
      dlBlock.appendChild(list);
      container.appendChild(dlBlock);
    }

    document.body.insertBefore(container, document.querySelector("#disqus_thread"));
  }

  // --- Main ---
  async function refinePage() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) return;

    const desc = scrapeDescription();
    const screenshots = scrapeScreenshots();
    const downloads = collectDownloadLinks();

    clearPageButKeepDisqus();

    const videoId = await fetchYouTubeTrailerId(titleEl.innerText.replace(/Free Download.*$/i, "").trim())
                    || null;

    buildCleanLayout(titleEl.innerText, desc, screenshots, downloads, videoId);
  }

  window.addEventListener("load", refinePage);
})();
