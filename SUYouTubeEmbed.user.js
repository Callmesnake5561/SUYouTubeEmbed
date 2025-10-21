// ==UserScript==
// @name         SU Clean Game Page Rebuild
// @namespace    SURebuild
// @version      2.2
// @description  Clean SU game pages: title, trailer, description, screenshots, downloads, and Disqus only
// @match        https://steamunderground.net/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // --- Utility helpers ---
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- Scrapers ---
  function scrapeDescription() {
    const article = document.querySelector("article, .post, .entry-content, .post-content");
    if (!article) return "";
    const paras = [...article.querySelectorAll("p")];
    return paras.map(p => p.innerText.trim())
                .filter(t => t.length > 50 && !t.toLowerCase().includes("download"))[0] || "";
  }

  function slugifyTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function scrapeScreenshots(title) {
    const article = document.querySelector("article, .post, .entry-content, .post-content");
    if (!article) return [];
    const slug = slugifyTitle(title);
    return [...article.querySelectorAll("img")]
      .map(img => img.src)
      .filter(src => src && src.toLowerCase().includes(slug));
  }

  function collectDownloadLinks() {
    const article = document.querySelector("article, .post, .entry-content, .post-content");
    if (!article) return [];
    return [...article.querySelectorAll("a[href*='download']")]
      .filter(a => a.closest("article, .post, .entry-content, .post-content"))
      .map(a => ({ text: a.textContent.trim() || a.href, href: a.href }));
  }

  function clearPageButKeepDisqus() {
    const disqus = document.querySelector("#disqus_thread");
    document.body.innerHTML = "";
    if (disqus) document.body.appendChild(disqus);
  }

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
    container.id = "su-clean-card";
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
    } else {
      const link = document.createElement("a");
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " trailer")}`;
      link.textContent = "🔗 Watch trailer on YouTube";
      link.target = "_blank";
      link.style.color = "#4da6ff";
      flex.appendChild(link);
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
      grid.style.display = "flex";
      grid.style.gap = "10px";
      grid.style.flexWrap = "wrap";
      screenshots.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.style.maxWidth = "48%";
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

  // --- Main runner ---
  async function refinePage() {
    if (document.querySelector("#su-clean-card")) return; // guard

    const titleEl = document.querySelector("h1");
    if (!titleEl) return;

    const title = titleEl.innerText.replace(/Free Download.*$/i, "").trim();
    const desc = scrapeDescription();
    const screenshots = scrapeScreenshots(title);
    const downloads = collectDownloadLinks();

    clearPageButKeepDisqus();

    const videoId = await fetchYouTubeTrailerId(title) || null;
    buildCleanLayout(title, desc, screenshots, downloads, videoId);
  }

  // --- Observer setup ---
  document.addEventListener("DOMContentLoaded", () => {
    refinePage();

    let debounce;
    const target = document.querySelector("article, .post, .entry-content, .post-content") || document.body;

    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        observer.disconnect();
        if (!document.querySelector("#su-clean-card")) {
          refinePage();
        }
        observer.observe(target, { childList: true, subtree: true });
      }, 1200);
    });

    observer.observe(target, { childList: true, subtree: true });
  });

})();
