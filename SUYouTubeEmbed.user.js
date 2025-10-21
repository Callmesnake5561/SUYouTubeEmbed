// ==UserScript==
// @name         SU YouTube Embed + Clean Info Card
// @namespace    SUYouTubeEmbed
// @version      4.0
// @description  Rebuild SU game pages with a clean info card, YouTube trailer + description
// @author       Brandon
// @match        https://steamunderground.net/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // --- Utility ---
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // --- Remove everything after Game NFO ---
  function removeAfterGameNFO() {
    const nfoLink = [...document.querySelectorAll("a")]
      .find(a => a.textContent.toLowerCase().includes("game nfo"));
    if (nfoLink) {
      let el = nfoLink.parentElement.nextElementSibling;
      while (el) {
        const next = el.nextElementSibling;
        el.remove();
        el = next;
      }
    }
  }

  // --- Extract description ---
  function getGameDescription() {
    const article = document.querySelector("article, .entry-content, .post-content");
    if (!article) return "";
    const paras = [...article.querySelectorAll("p")];
    const desc = paras
      .map(p => p.innerText.trim())
      .filter(t => t.length > 50 && !t.toLowerCase().includes("download"))[0];
    return desc || "";
  }

  // --- Info Card container ---
  function ensureInfoCard(titleEl) {
    let card = document.querySelector("#su-info-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "su-info-card";
      card.style.background = "#1b1b1b";
      card.style.padding = "20px";
      card.style.marginTop = "20px";
      card.style.borderRadius = "8px";
      card.style.color = "#ddd";
      card.style.fontFamily = "Segoe UI, sans-serif";
      card.style.fontSize = "14px";
      titleEl.insertAdjacentElement("afterend", card);
    }
    return card;
  }

  // --- Fill metadata ---
  function fillMetadata(card) {
    const meta = document.querySelector(".entry-content");
    if (!meta) return;
    const lines = [...meta.querySelectorAll("p, li")]
      .map(el => el.innerText.trim())
      .filter(t => t && t.includes(":"));
    if (!lines.length) return;

    const block = document.createElement("div");
    block.style.marginBottom = "15px";
    block.innerHTML = "<h3 style='margin:0 0 10px;color:#fff;'>📋 Game Info</h3>";

    lines.forEach(line => {
      const div = document.createElement("div");
      div.textContent = line;
      div.style.marginBottom = "4px";
      block.appendChild(div);
    });

    card.appendChild(block);
  }

  // --- Fill requirements ---
  function fillRequirements(card) {
    const reqHeader = [...document.querySelectorAll("h2,h3,h4")]
      .find(h => h.innerText.toLowerCase().includes("system requirements"));
    if (!reqHeader) return;

    const reqBlock = document.createElement("div");
    reqBlock.style.marginBottom = "15px";
    reqBlock.innerHTML = "<h3 style='margin:0 0 10px;color:#fff;'>💻 System Requirements</h3>";

    let el = reqHeader.nextElementSibling;
    while (el && el.tagName.toLowerCase() !== "h2") {
      const clone = el.cloneNode(true);
      clone.style.marginBottom = "4px";
      reqBlock.appendChild(clone);
      el = el.nextElementSibling;
    }

    card.appendChild(reqBlock);
  }

  // --- Build fancy layout: video + description ---
  function buildFancyLayout(container, videoId) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "20px";
    wrapper.style.marginTop = "20px";
    wrapper.style.alignItems = "flex-start";

    // Video
    const iframe = document.createElement("iframe");
    iframe.width = "560";
    iframe.height = "315";
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.style.flex = "1";
    wrapper.appendChild(iframe);

    // Description
    const descDiv = document.createElement("div");
    descDiv.style.flex = "1";
    descDiv.style.background = "#2a2a2a";
    descDiv.style.padding = "15px";
    descDiv.style.borderRadius = "6px";
    descDiv.style.color = "#ddd";
    descDiv.style.fontSize = "14px";
    descDiv.style.lineHeight = "1.6";
    descDiv.textContent = getGameDescription() || "No description available.";
    wrapper.appendChild(descDiv);

    container.appendChild(wrapper);
  }

  // --- YouTube search (simple) ---
  async function tryYTQueries(card, title, callback) {
    const query = encodeURIComponent(`${title} trailer`);
    const url = `https://www.youtube.com/results?search_query=${query}`;
    // NOTE: Without API key, we can’t fetch directly due to CORS.
    // For now, fallback to embedding a search link.
    const block = document.createElement("div");
    block.style.marginTop = "20px";
    block.innerHTML = `<a href="${url}" target="_blank" style="color:#4da6ff;">🔗 Watch trailer on YouTube</a>`;
    card.appendChild(block);

    // If you have a way to resolve videoId, call:
    // callback(card, videoId);
  }

  // --- Main refine ---
  async function refinePage() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) return;

    removeAfterGameNFO();

    const card = ensureInfoCard(titleEl);
    await sleep(250);

    fillMetadata(card);
    fillRequirements(card);

    const cleanTitle = titleEl.innerText.replace(/Free Download.*$/i, "").trim();
    tryYTQueries(card, cleanTitle, buildFancyLayout);
  }

  // --- Run ---
  window.addEventListener("load", refinePage);
})();
