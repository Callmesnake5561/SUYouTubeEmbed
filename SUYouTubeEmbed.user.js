// ==UserScript==
// @name         SU YouTube Embed
// @namespace    https://github.com/Callmesnake5561/SUYouTubeEmbed
// @version      1.0
// @description  Embed the top YouTube review video on SteamUnderground game pages (scrapes search results, no API needed)
// @match        https://steamunderground.net/*
// @grant        none
// ==/UserScript==


(function () {
  'use strict';

  const log = console.log.bind(console);
  const STRIP_WORDS = ["PC Game", "Free Download"];

  function cleanGameTitle(rawTitle) {
    let cutoffIndex = rawTitle.length;
    let pcIndex = rawTitle.toLowerCase().indexOf("pc");
    let directIndex = rawTitle.toLowerCase().indexOf("direct");
    if (pcIndex !== -1 && pcIndex < cutoffIndex) cutoffIndex = pcIndex;
    if (directIndex !== -1 && directIndex < cutoffIndex) cutoffIndex = directIndex;

    let clean = rawTitle.substring(0, cutoffIndex);
    clean = clean.replace(/\(.*?\)/g, ""); // remove parentheses
    STRIP_WORDS.forEach(word => {
      clean = clean.replace(new RegExp(word, "gi"), "");
    });
    return clean.trim();
  }

  function embedVideo(videoId, titleEl) {
    if (document.querySelector("iframe[data-ytreview]")) return;

    const iframe = document.createElement("iframe");
    iframe.width = "560";
    iframe.height = "315";
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.setAttribute("data-ytreview", "true");

    titleEl.insertAdjacentElement("afterend", iframe);
    log("YouTube video embedded:", videoId);
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

  function fetchTopResult(titleEl, cleanTitle) {
    const query = cleanTitle + " review";
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    GM_xmlhttpRequest({
      method: "GET",
      url: searchUrl,
      onload: function (response) {
        const html = response.responseText;
        const match = html.match(/"videoId":"(.*?)"/);
        if (match && match[1]) {
          embedVideo(match[1], titleEl);
        } else {
          log("No video ID found in YouTube search results");
          insertFallback(titleEl, cleanTitle);
        }
      },
      onerror: function () {
        log("Failed to fetch YouTube search page");
        insertFallback(titleEl, cleanTitle);
      }
    });
  }

  function embedReview() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) {
      log("No <h1> found yet.");
      return;
    }
    const cleanTitle = cleanGameTitle(titleEl.innerText);
    fetchTopResult(titleEl, cleanTitle);
  }

  window.addEventListener("load", embedReview);

  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(embedReview, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
