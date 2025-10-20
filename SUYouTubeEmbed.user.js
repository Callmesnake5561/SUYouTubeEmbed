// ==UserScript==
// @name         SU YouTube Embed
// @namespace    https://github.com/Callmesnake5561/SUYouTubeEmbed
// @version      1.2
// @description  Embed the top YouTube review video on SteamUnderground game pages (scrapes search results, no API needed)
// @match        https://steamunderground.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  // 🔧 Config block
  const CONFIG = {
    stripWords: ["PC Game", "Free Download"],
    queries: ["review", "gameplay", "impressions", "first look", "early access", "trailer", "overview", ""],
    maxResults: 1
  };

  const log = (...args) => console.log("[SUYouTubeEmbed]", ...args);

  function cleanGameTitle(rawTitle) {
    let cutoffIndex = rawTitle.length;
    let pcIndex = rawTitle.toLowerCase().indexOf("pc");
    let directIndex = rawTitle.toLowerCase().indexOf("direct");
    if (pcIndex !== -1 && pcIndex < cutoffIndex) cutoffIndex = pcIndex;
    if (directIndex !== -1 && directIndex < cutoffIndex) cutoffIndex = directIndex;

    let clean = rawTitle.substring(0, cutoffIndex);
    clean = clean.replace(/\(.*?\)/g, ""); // remove parentheses
    CONFIG.stripWords.forEach(word => {
      clean = clean.replace(new RegExp(word, "gi"), "");
    });
    return clean.trim();
  }

  function embedVideo(videoId, titleEl) {
    // Clear old container if exists
    const old = document.querySelector("div[data-ytreview-container]");
    if (old) old.remove();

    const container = document.createElement("div");
    container.setAttribute("data-ytreview-container", "true");
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "10px";
    container.style.marginTop = "10px";

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.width = "100%";
    iframe.style.maxWidth = "560px";
    iframe.style.aspectRatio = "16/9";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;

    container.appendChild(iframe);
    titleEl.insertAdjacentElement("afterend", container);

    log("YouTube video embedded:", videoId);

    // Stop observing once successful
    if (observer) observer.disconnect();
  }

  function insertFallback(titleEl, gameTitle) {
    if (document.querySelector("a[data-ytreview-fallback]")) return;

    const link = document.createElement("a");
    link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(gameTitle)}`;
    link.textContent = `🔎 Search YouTube for ${gameTitle}`;
    link.target = "_blank";
    link.setAttribute("data-ytreview-fallback", "true");

    link.style.display = "inline-block";
    link.style.marginTop = "15px";
    link.style.padding = "10px 15px";
    link.style.backgroundColor = "#c4302b";
    link.style.color = "#fff";
    link.style.fontWeight = "bold";
    link.style.textDecoration = "none";
    link.style.borderRadius = "5px";
    link.style.fontSize = "16px";

    titleEl.insertAdjacentElement("afterend", link);
  }

  function doRequest(url, onSuccess, onError) {
    if (typeof GM_xmlhttpRequest !== "undefined") {
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: res => onSuccess(res.responseText),
        onerror: onError
      });
    } else {
      fetch(url)
        .then(r => r.text())
        .then(onSuccess)
        .catch(onError);
    }
  }

  function tryQueries(titleEl, cleanTitle, i = 0) {
    if (i >= CONFIG.queries.length) {
      insertFallback(titleEl, cleanTitle);
      return;
    }

    const query = (CONFIG.queries[i] ? `${cleanTitle} ${CONFIG.queries[i]}` : cleanTitle).trim();
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    doRequest(searchUrl, html => {
      // Safer regex: only match inside videoRenderer blocks
      const match = html.match(/"videoRenderer".*?"videoId":"(.*?)"/);
      if (match && match[1]) {
        embedVideo(match[1], titleEl);
      } else {
        log("No video found for query:", query);
        tryQueries(titleEl, cleanTitle, i + 1);
      }
    }, () => {
      log("Request failed for query:", query);
      tryQueries(titleEl, cleanTitle, i + 1);
    });
  }

  function embedReview() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) {
      log("No <h1> found yet.");
      return;
    }
    const cleanTitle = cleanGameTitle(titleEl.innerText);
    tryQueries(titleEl, cleanTitle);
  }

  window.addEventListener("load", embedReview);

  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(embedReview, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
