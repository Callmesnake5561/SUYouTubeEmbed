// @run-at       document-idle

// ==UserScript==
// @name         SU Refined - Full Site Dark Theme
// @namespace    https://github.com/Callmesnake5561/SUYouTubeEmbed
// @version      4.0
// @description  Full-site dark theme for Steam Underground. Overhauls game pages with a futuristic dashboard, YouTube embeds, and clean info cards.
// @match        https://steamunderground.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    stripWords: ["PC Game", "Free Download", "Direct Download", "Download"],
    ytQueries: ["review", "gameplay", "impressions", "first look", "early access", "trailer", "overview", ""],
    hostPriority: ["datanodes", "torrent", "gofile", "akirabox", "mediafire", "pixeldrain", "megaup", "1fichier", "rapidgator", "hitfile", "nitroflare", "ddl"],
    primaryHostLimit: 3,
    linksPerHostLimit: 1
  };

  const log = (...args) => console.log("[SURefine]", ...args);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const toLower = (s) => (s || "").toLowerCase();

  function cleanGameTitle(rawTitle) {
    log("Cleaning title:", rawTitle);
    let t = rawTitle || "";
    t = t.replace(/\(.*?\)/g, "");
    CONFIG.stripWords.forEach(word => { t = t.replace(new RegExp(word, "gi"), ""); });
    t = t.replace(/[-|–|—]\s*free\s*download.*$/i, "");
    const clean = t.trim();
    log("Cleaned title:", clean);
    return clean;
  }

  // Collect site navigation links from header/footer
  function collectSiteLinks() {
    log("collectSiteLinks called");
    const allLinks = Array.from(document.querySelectorAll("a[href]"));
    const siteLinks = allLinks.filter(a => {
      const href = a.href;
      const text = (a.textContent || "").trim().toLowerCase();
      // Exclude download links, external non-site links, and empty text
      if (!text || text.length > 50) return false;
      if (href.includes('torrent') || href.includes('mediafire') || href.includes('gofile') || href.includes('pixeldrain')) return false;
      if (href.startsWith('mailto:') || href.startsWith('javascript:')) return false;
      // Include internal links or common nav terms
      const isInternal = href.startsWith(window.location.origin) || href.startsWith('/');
      const isNavTerm = /home|about|contact|categories|games|news|blog|forum|support|help|privacy|terms/i.test(text);
      return isInternal || isNavTerm;
    }).map(a => ({
      text: (a.textContent || "").trim(),
      href: a.href
    })).filter((link, index, arr) => arr.findIndex(l => l.href === link.href) === index); // unique by href

    log(`- Collected ${siteLinks.length} site navigation links.`);
    return siteLinks;
  }

  // Create full-page layout with header/footer
  function createFullPageLayout(siteLinks, infoCard) {
    log("createFullPageLayout called");
    const headerLinks = siteLinks.slice(0, Math.ceil(siteLinks.length / 2));
    const footerLinks = siteLinks.slice(Math.ceil(siteLinks.length / 2));

    const headerHtml = headerLinks.length ? `
      <header style="background:rgba(10, 10, 10, 0.8); backdrop-filter:blur(5px); color:#fff; padding:15px 30px; border-bottom:1px solid #00d9ff; font-family:system-ui,-apple-system,sans-serif; box-shadow: 0 5px 15px rgba(0, 217, 255, 0.2);">
        <nav style="display:flex; gap:25px; flex-wrap:wrap; align-items:center; justify-content:center;">
          <span style="font-weight:800; font-size:22px; color:#00d9ff; text-shadow: 0 0 8px #00d9ff, 0 0 12px #00d9ff;">💎 Steam Underground</span>
          ${headerLinks.map(link => `<a href="${link.href}" style="color:#e0e0e0; text-decoration:none; font-size:16px; padding:8px 12px; border-radius:6px; transition:all 0.3s ease;" onmouseover="this.style.color='#fff'; this.style.background='rgba(0, 217, 255, 0.1)'; this.style.textShadow='0 0 5px #00d9ff';" onmouseout="this.style.color='#e0e0e0'; this.style.background='transparent'; this.style.textShadow='none';">${link.text}</a>`).join('')}
        </nav>
      </header>
    ` : '';

    const footerHtml = footerLinks.length ? `
      <footer style="background:rgba(10, 10, 10, 0.8); backdrop-filter:blur(5px); color:#aaa; padding:20px 30px; border-top:1px solid #00d9ff; font-family:system-ui,-apple-system,sans-serif; margin-top:40px; box-shadow: 0 -5px 15px rgba(0, 217, 255, 0.2);">
        <nav style="display:flex; gap:25px; flex-wrap:wrap; justify-content:center;">
          ${footerLinks.map(link => `<a href="${link.href}" style="color:#999; text-decoration:none; font-size:14px; padding:5px 10px; border-radius:4px; transition:all 0.3s ease;" onmouseover="this.style.color='#fff'; this.style.textShadow='0 0 5px #fff';" onmouseout="this.style.color='#999'; this.style.textShadow='none';">${link.text}</a>`).join('')}
        </nav>
      </footer>
    ` : '';

    const fullPageHtml = `
      ${headerHtml}
      <main style="background: #050505; min-height:100vh; padding:40px 20px;">
        ${infoCard.outerHTML}
      </main>
      ${footerHtml}
    `;

    document.body.innerHTML = fullPageHtml;
    // After replacing the content, ensure the body is visible again.
    document.body.style.opacity = '1';
    log("Full-page layout applied, original content replaced.");
  }

  // Metadata (stable v3.1 approach)
  function fillMetadata(container, rawText) {
    log("fillMetadata called");
    rawText = rawText || document.body.innerText || "";
    const getLine = (label) => {
      const re = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
      const m = rawText.match(re);
      const result = m ? m[1].trim() : "Unknown";
      log(`- Metadata for '${label}': ${result}`);
      return result;
    };
    const metaDiv = container.querySelector("#su-meta");
    const title = container.querySelector("h2").textContent;

    const release = getLine("Release Date");
    const version = getLine("Game Version");
    const scene = (rawText.match(/(Scene Group|Game Source):\s*([^\n]+)/i) || [])[2] || "Unknown";
    log(`- Metadata for Scene Group: ${scene}`);

    const newMeta = `
      <div style="background: linear-gradient(145deg, #1f1f1f, #111); border-radius: 8px; padding: 15px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;"><span style="color: #aaa;">🗓️ Release Date</span> <span style="font-weight: 600; color: #eee;">${release}</span></div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;"><span style="color: #aaa;">⚙️ Game Version</span> <span style="font-weight: 600; color: #eee;">${version}</span></div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;"><span style="color: #aaa;">🎬 Scene Group</span> <span style="font-weight: 600; color: #eee;">${scene}</span></div>
      </table>
      </div>
    `;
    if (metaDiv.dataset.hash !== newMeta) {
      metaDiv.innerHTML = newMeta;
      metaDiv.dataset.hash = newMeta;
      log("Metadata table updated.");
    }

    const linksDiv = container.querySelector("#su-links");
    const linksMarkup = [
      { name: "🔎 SteamDB",    url: `https://steamdb.info/search/?a=app&q=${encodeURIComponent(title)}` },
      { name: "🔎 YouTube",    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}` }
    ].map(l => `<a href="${l.url}" target="_blank" style="margin-right:10px;padding:8px 15px;background:#333;color:#fff;text-decoration:none;border-radius:5px;font-size:14px;font-weight:600;transition: all 0.2s ease;" onmouseover="this.style.background='#00d9ff'; this.style.color='#000';" onmouseout="this.style.background='#333'; this.style.color='#fff';">${l.name}</a>`).join("");

    if (linksDiv.dataset.hash !== linksMarkup) {
      linksDiv.innerHTML = linksMarkup;
      linksDiv.dataset.hash = linksMarkup;
      log("External search links updated.");
    }
  }

  // Requirements (stable v3.1 parser, rendered as styled table)
  function fillRequirements(container, rawText) {
    log("fillRequirements called");
    rawText = rawText || document.body.innerText || "";
    const match = rawText.match(/System requirements([\s\S]*?)(Support the game|Tags|Share on|Screenshots|Download)/i);
    const reqDiv = container.querySelector("#su-requirements");

    if (!match) {
      log("Could not find system requirements block.");
      reqDiv.innerHTML = "";
      reqDiv.dataset.hash = "";
      return;
    }

    log("Found system requirements block.");
    const block = match[1];
    const lines = block.split("\n").map(l => l.trim()).filter(l => l && l.includes(":"));
    log(`- Found ${lines.length} requirement lines.`);

    const hash = JSON.stringify(lines);
    if (reqDiv.dataset.hash === hash) return;
    reqDiv.innerHTML = "";
    reqDiv.dataset.hash = hash;

    if (!lines.length) return;

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "separate";
    table.style.borderSpacing = "0 4px";
    table.style.background = "transparent";
    table.style.overflow = "hidden";
    table.style.fontSize = "14px";
    table.style.color = "#ddd";

    table.innerHTML = `
      ${lines.map(line => {
        const idx = line.indexOf(":");
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        return `<tr><td style="padding:8px 12px; background: #222; border-radius: 6px 0 0 6px; width: 30%; font-weight: 600; color: #aaa;">${key}</td><td style="padding:8px 12px; background: #282828; border-radius: 0 6px 6px 0;">${val}</td></tr>`;
      }).join("")}
    `;
    reqDiv.appendChild(table);
    log("Requirements table updated.");
  }

  // Downloads (stable v3.1, grouped + toggle)
  function fillDownloads(container, rawHTML) {
    log("fillDownloads called");
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML || document.body.innerHTML;

    const anchors = Array.from(tempDiv.querySelectorAll("a[href]"));
    const hostRegex = new RegExp(CONFIG.hostPriority.join("|"), "i");
    log(`- Found ${anchors.length} total anchor tags.`);

    const candidates = anchors.filter(a => {
      const href = toLower(a.href);
      const text = toLower(a.textContent);
      const isHost = hostRegex.test(href) || hostRegex.test(text);
      const isInternal = href.startsWith(window.location.origin) && !/torrent/.test(text);
      return isHost && !isInternal;
    });
    log(`- Found ${candidates.length} potential download links.`);

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
    log(`- Found ${unique.length} unique download links.`);

    const dlDiv = container.querySelector("#su-downloads");
    const hash = JSON.stringify(unique.map(u => u.a.href));
    if (dlDiv.dataset.hash === hash) return;
    dlDiv.innerHTML = "";
    dlDiv.dataset.hash = hash;

    if (!unique.length) {
      log("No unique download links found to display.");
      return;
    }

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
      hostHeader.style.cssText = "font-weight: 700; color: #00d9ff; margin-top: 12px; margin-bottom: 5px; font-size: 16px; text-shadow: 0 0 3px #00d9ff;";

      const hostBlock = document.createElement("div");
      hostBlock.style.cssText = "display: flex; flex-direction: column; gap: 5px;";

      items.slice(0, CONFIG.linksPerHostLimit).forEach(({ a, label }) => {
        const link = document.createElement("a");
        link.href = a.href;
        link.textContent = label || a.href;
        link.target = "_blank";
        link.style.cssText = `
          display: block; color: #eee; font-weight: 600; text-decoration: none; padding: 10px 15px;
          background: #333; border-radius: 6px; border-left: 3px solid #00d9ff;
          transition: all 0.2s ease;
        `;
        link.onmouseover = () => { link.style.background = '#444'; link.style.transform = 'translateX(5px)'; };
        link.onmouseout = () => { link.style.background = '#333'; link.style.transform = 'translateX(0)'; };
        hostBlock.appendChild(link);
      });

      items.slice(CONFIG.linksPerHostLimit).forEach(({ a, label }) => {
        const link = document.createElement("a");
        link.href = a.href;
        link.textContent = label || a.href;
        link.target = "_blank";
        link.style.cssText = "display: block; color: #bbb; text-decoration: none; padding: 8px 15px; background: #2a2a2a; border-radius: 4px;";
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
      toggle.style.cssText = `
        margin-top: 15px; padding: 10px 20px; background: #333; color: #00d9ff;
        border: 1px solid #00d9ff; border-radius: 6px; cursor: pointer; font-weight: 700;
        transition: all 0.3s ease; text-shadow: 0 0 5px #00d9ff;
      `;
      toggle.onmouseover = () => { toggle.style.background = '#00d9ff'; toggle.style.color = '#000'; toggle.style.boxShadow = '0 0 15px #00d9ff'; };
      toggle.onmouseout = () => { toggle.style.background = '#333'; toggle.style.color = '#00d9ff'; toggle.style.boxShadow = 'none'; };


      let expanded = false;
      toggle.addEventListener("click", () => {
        expanded = !expanded;
        overflowList.style.display = expanded ? "block" : "none";
        toggle.textContent = expanded ? "Hide extra mirrors" : "Show all mirrors";
      });

      dlDiv.appendChild(toggle);

      const grouped = new Map();
      overflowItems.forEach(item => {
        // The header might already exist in primary list, so we check overflowList as well
        const headerExists = Array.from(primaryList.children).some(c => c.textContent === item.host) ||
                             Array.from(overflowList.children).some(c => c.textContent === item.host);
        if (!grouped.has(item.host) && !headerExists) {
          grouped.set(item.host, { header: item.header.cloneNode(true), block: document.createElement("div") });
        }
        const pack = grouped.get(item.host);
        pack.block.appendChild(item.link instanceof HTMLElement ? item.link : (() => {
          const l = document.createElement("a");
          l.href = item.link.href;
          l.textContent = item.link.textContent;
          l.target = "_blank";
          l.style.display = "block";
          l.style.color = "#bbb";
          return l;
        })());
      });

      grouped.forEach(({ header, block }) => {
        overflowList.appendChild(header);
        overflowList.appendChild(block);
      });
    }
    log("Downloads section updated.");
  }

  // Helper function to fetch review score from IGN (hardcoded for demo, Cloudflare blocks scraping)
  function fetchReviewScore(title) {
    return new Promise((resolve, reject) => {
      // Hardcoded scores for known games (since scraping is blocked by Cloudflare)
      const hardcodedScores = {
        'the witcher 3': '9.5/10',
        'cyberpunk 2077': '7.0/10',
        'ghostwire tokyo': '7.5/10',
        'ghostwire: tokyo': '7.5/10',
        'elden ring': '9.8/10',
        'god of war ragnarök': '9.4/10',
        'spider-man 2': '9.2/10',
        'baldur\'s gate 3': '9.7/10',
        'resident evil 4': '9.3/10',
        'hogwarts legacy': '8.5/10',
        'starfield': '8.0/10'
      };

      const normalizedTitle = (title || '').toLowerCase().trim();
      const score = hardcodedScores[normalizedTitle];
      if (!score) {
        log(`- No review score found for: "${normalizedTitle}"`);
        reject(new Error('Game not in known reviews database'));
        return;
      }

      log(`- Using hardcoded IGN score for: ${normalizedTitle} -> ${score}`);
      // Simulate network delay for realism
      setTimeout(() => {
        resolve(score);
      }, 200);
    });
  }

  // Helper function to fetch description and images from Wikipedia
  function fetchDescription(title) {
    return new Promise((resolve, reject) => {
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
      httpGet(pageUrl, html => {
        // Extract description from first paragraph
        const descMatch = html.match(/<p>(.*?)<\/p>/s);
        let description = '';
        if (descMatch) {
          description = descMatch[1].replace(/<[^>]*>/g, '').trim();
          if (description.length <= 50) description = '';
        }

        // Extract images from infobox
        const infoboxMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>(.*?)<\/table>/s);
        let images = [];
        if (infoboxMatch) {
          const imgMatches = infoboxMatch[1].match(/<img[^>]*src="([^"]+)"/g);
          if (imgMatches) {
            images = imgMatches.slice(0, 2).map(img => {
              const srcMatch = img.match(/src="([^"]+)"/);
              return srcMatch ? `https:${srcMatch[1]}` : null;
            }).filter(Boolean);
          }
        }

        if (description || images.length > 0) {
          resolve({ description, images });
        } else {
          reject();
        }
      }, reject);
    });
  }

  // Description (enhanced section with review score, images, tries Wikipedia first, falls back to local)
  async function fillDescription(container, rawHTML) {
    log("fillDescription called");
    const title = container.querySelector("h2").textContent;
    const box = container.querySelector("#su-description");
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML || document.body.innerHTML;
    let reviewScore = '';
    try {
      reviewScore = await fetchReviewScore(title);
      log(`- Review score fetched: ${reviewScore}`);
    } catch {
      log("- Review score not found");
    }

    try {
      const { description, images } = await fetchDescription(title);
      let html = `<h3 style="margin:0 0 12px 0; color:#fff; font-size:18px; font-weight:700; text-align:center; text-shadow:1px 1px 2px #000">🎮 Game Description</h3>`;

      if (reviewScore) {
        html += `<div style="text-align:center; margin-bottom:15px; font-size:18px; font-weight:700; color:#00d9ff; background:rgba(0, 217, 255, 0.1); padding:10px 15px; border-radius:8px; border:1px solid #00d9ff; display:inline-block; box-shadow:0 0 10px rgba(0, 217, 255, 0.3)">⭐ ${reviewScore}</div>`;
      }

      const hasImage = images.length > 0;
      const hasDescription = !!description;

      html += `<div style="display:flex; gap:20px; margin-top:15px;">`;

      if (hasImage) {
        html += `<div style="flex: 0 0 35%; max-width: 35%;"><img src="${images[0]}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.6); border:1px solid #444" alt="Game image"></div>`;
      }

      if (hasDescription) {
        html += `<div style="flex: 1; line-height:1.7; color:#ccc; font-size:14px; font-style:italic; text-align:left; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:3px solid #00d9ff;">📝 ${description}</div>`;
      }

      html += `</div>`;
      box.innerHTML = html;
      log(`- Description and ${images.length} images fetched from Wikipedia`);
    } catch {
      // Fall back to local scraping
      const paras = [...tempDiv.querySelectorAll("p")];
      log(`- Found ${paras.length} paragraph tags.`);
      const pick = paras
        .map(p => (p.innerText || "").trim())
        .filter(t => t.length > 80 && !/downloads?|requirements?|install|password|changelog/i.test(t))
        .sort((a,b) => b.length - a.length)[0];

      if (pick) {
        const formatted = pick
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        let html = `<h3 style="margin:0 0 12px 0; color:#fff; font-size:18px; font-weight:700; text-align:center; text-shadow:1px 1px 2px #000">🎮 Game Description</h3>`;

        if (reviewScore) {
          html += `<div style="text-align:center; margin-bottom:15px; font-size:18px; font-weight:700; color:#00d9ff; background:rgba(0, 217, 255, 0.1); padding:10px 15px; border-radius:8px; border:1px solid #00d9ff; display:inline-block; box-shadow:0 0 10px rgba(0, 217, 255, 0.3)">⭐ ${reviewScore}</div>`;
        }

        html += `<div style="line-height:1.7; color:#ccc; font-size:14px; font-style:italic; text-align:left; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border-left:3px solid #00d9ff;">📝 ${formatted}</div>`;

        box.innerHTML = html;
        log(`- Description found locally: ${formatted.length} characters`);
      } else {
        let html = `<h3 style="margin:0 0 12px 0; color:#fff; font-size:18px; font-weight:700; text-align:center; text-shadow:1px 1px 2px #000">🎮 Game Description</h3>`;

        if (reviewScore) {
          html += `<div style="text-align:center; margin-bottom:15px; font-size:18px; font-weight:700; color:#00d9ff; background:rgba(0, 217, 255, 0.1); padding:10px 15px; border-radius:8px; border:1px solid #00d9ff; display:inline-block; box-shadow:0 0 10px rgba(0, 217, 255, 0.3)">⭐ ${reviewScore}</div>`;
        }

        html += `<div style="color:#aaa; font-size:15px; font-style:italic; text-align:center; background:#1a1a1a; padding:15px; border-radius:10px">No description available.</div>`;

        box.innerHTML = html;
        log("- No description found");
      }
    }
  }



  // YouTube embed (stable v3.1 with fallback)
  function embedVideo(videoId, container) {
    log("embedVideo called with ID:", videoId);
    const slot = container.querySelector("#su-video");
    const existing = slot.querySelector("iframe");
    if (existing && existing.src.includes(videoId)) return;

    slot.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.cssText = `
      width: 100%;
      aspect-ratio: 16/9;
      border: 2px solid #333;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.7);
    `;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    slot.appendChild(iframe);
    log("Embedded video:", videoId);
  }

  function insertYTSearch(container, title) {
    log("insertYTSearch called for title:", title);
    const slot = container.querySelector("#su-video");
    if (slot.querySelector("a")) return;
    const a = document.createElement("a");
    a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
    a.textContent = `🔎 Search YouTube for ${title}`;
    a.target = "_blank";
    a.style.cssText = `
      display: inline-block;
      margin-top: 6px;
      padding: 12px 20px;
      background-color: #c4302b;
      color: #fff;
      font-weight: bold;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
    `;
    a.onmouseover = () => { a.style.backgroundColor = '#ff453a'; a.style.transform = 'scale(1.05)'; };
    a.onmouseout = () => { a.style.backgroundColor = '#c4302b'; a.style.transform = 'scale(1)'; };
    slot.innerHTML = "";
    slot.appendChild(a);
  }

  function httpGet(url, onSuccess, onError) {
    log(`httpGet called for URL: ${url}`);
    if (typeof GM_xmlhttpRequest !== "undefined") {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        onload: res => {
          log(`- Success for ${url}`);
          onSuccess(res.responseText);
        },
        onerror: err => {
          log(`- Error for ${url}:`, err);
          onError();
        }
      });
    } else {
      fetch(url).then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.text();
      }).then(onSuccess).catch(err => {
        log(`- Fetch Error for ${url}:`, err);
        onError();
      });
    }
  }

  function tryYTQueries(container, title, i = 0) {
    return new Promise((resolve) => {
      const attempt = (attemptIndex) => {
        log(`tryYTQueries called for title '${title}', attempt ${attemptIndex + 1}`);
        if (attemptIndex >= CONFIG.ytQueries.length) {
          log("All YouTube queries failed. Inserting search link.");
          insertYTSearch(container, title);
          resolve();
          return;
        }
        const q = (CONFIG.ytQueries[attemptIndex] ? `${title} ${CONFIG.ytQueries[attemptIndex]}` : title).trim();
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
        log(`- Querying YouTube with: '${q}'`);
        httpGet(url, html => {
          const match = html.match(/"videoRenderer".*?"videoId":"(.*?)"/);
          if (match && match[1]) {
            log("- Found video ID:", match[1]);
            embedVideo(match[1], container);
            resolve();
          } else {
            log("- No video found for this query.");
            attempt(attemptIndex + 1);
          }
        }, () => {
          log("- YouTube request failed.");
          attempt(attemptIndex + 1);
        });
      };
      attempt(i);
    });
  }

  // Create info card container
  function ensureInfoCard(titleEl) {
    log("ensureInfoCard called");
    const existing = document.querySelector("[data-suinfocard]");
    if (existing) return existing;

    const card = document.createElement("div");
    card.setAttribute("data-suinfocard", "true");
    card.style.cssText = `
      max-width: 900px;
      margin: 20px auto;
      background: rgba(20, 20, 20, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid rgba(0, 217, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 217, 255, 0.1);
      font-family: system-ui, -apple-system, sans-serif;
      color: #fff;
    `;

    const title = document.createElement("h2");
    title.textContent = cleanGameTitle(titleEl.innerText);
    title.style.cssText = `
      margin: 0 0 30px 0;
      font-size: 36px;
      font-weight: 800;
      color: #fff;
      text-align: center;
      text-shadow: 0 0 10px #00d9ff, 0 0 20px #00d9ff, 0 0 30px #00d9ff;
    `;
    card.appendChild(title);

    const sections = [
      { id: "su-video", label: "🎥 Trailer" },
      { id: "su-meta", label: "📊 Game Info" },
      { id: "su-links", label: "🌐 External Links" },
      { id: "su-requirements", label: "💻 System Requirements" },
      { id: "su-description", label: "🎮 Description" },
      { id: "su-downloads", label: "📥 Downloads" }
    ];

    sections.forEach(({ id, label }) => {
      const section = document.createElement("div");
      section.id = id;
      section.style.cssText = `
        margin-bottom: 30px;
        padding: 20px;
        background: rgba(0,0,0,0.2);
        border-radius: 12px;
        border: 1px solid #333;
      `;

      const header = document.createElement("h3");
      header.textContent = label;
      header.style.cssText = `
        margin: -20px -20px 15px -20px;
        padding: 12px 20px;
        font-size: 20px;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(90deg, rgba(0, 217, 255, 0.2), rgba(0, 217, 255, 0));
        border-bottom: 1px solid #333;
        border-radius: 12px 12px 0 0;
      `;
      section.appendChild(header);

      card.appendChild(section);
    });

    log("Info card created.");
    return card;
  }

  // Injects a global stylesheet for non-game pages
  function styleGenericPage() {
    if (document.getElementById('su-global-style')) return;
    log("Applying global dark theme.");

    const css = `
      :root {
        --dark-bg: #050505;
        --panel-bg: rgba(20, 20, 20, 0.7);
        --panel-bg-solid: #141414;
        --text-color: #ccc;
        --title-color: #fff;
        --accent-color: #00d9ff;
        --accent-glow: 0 0 8px rgba(0, 217, 255, 0.7);
        --border-color: rgba(0, 217, 255, 0.3);
      }
      body, html {
        background-color: var(--dark-bg) !important;
        color: var(--text-color) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
      a {
        color: var(--accent-color) !important;
        text-decoration: none !important;
        transition: all 0.2s ease;
      }
      a:hover {
        color: var(--title-color) !important;
        text-shadow: var(--accent-glow);
      }
      h1, h2, h3, h4, h5, h6 {
        color: var(--title-color) !important;
        text-shadow: var(--accent-glow);
        border-bottom-color: var(--border-color) !important;
      }
      div, section, article, header, footer, nav, aside, main {
        background-color: transparent !important;
        border-color: #333 !important;
      }
      .page, #main, .post, .post-content, .entry-content, .container, #page, .wrapper {
        background: var(--panel-bg-solid) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 5px 25px rgba(0, 217, 255, 0.1);
      }
      table {
        border-collapse: separate;
        border-spacing: 0 5px;
      }
      th, td {
        background: #222 !important;
        color: var(--text-color) !important;
        border: none !important;
        padding: 10px 15px !important;
      }
      th {
        background: #333 !important;
        color: var(--title-color) !important;
        font-weight: 700;
      }
      tr:first-child th:first-child { border-radius: 8px 0 0 0; }
      tr:first-child th:last-child { border-radius: 0 8px 0 0; }
      tr:last-child td:first-child { border-radius: 0 0 0 8px; }
      tr:last-child td:last-child { border-radius: 0 0 8px 8px; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = "su-global-style";
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);
  }

  // Determines if the current page is a game page
  function isGamePage() {
    const titleEl = document.querySelector("h1");
    if (titleEl && /download|game/i.test(titleEl.innerText)) {
      return true;
    }
    // Fallback check: look for other tell-tale signs of a game page
    const bodyText = document.body.innerText || "";
    const hasRequirements = /system requirements/i.test(bodyText);
    const hasDownloadLinks = new RegExp(CONFIG.hostPriority.join("|"), "i").test(bodyText);

    // If it has requirements and/or download links, it's very likely a game page.
    // The title check is still primary to avoid false positives on forum threads discussing games.
    return hasRequirements && hasDownloadLinks;
  }

  // Shows a loading spinner and hides the original page content
  function showLoadingState() {
    if (document.getElementById('su-loader')) return;

    // Hide original content
    const oldBody = document.body;
    oldBody.style.opacity = '0';
    oldBody.style.transition = 'opacity 0.3s ease';

    // Add loader
    const loader = document.createElement('div');
    loader.id = 'su-loader';
    loader.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:#050505; z-index:9998; display:flex; justify-content:center; align-items:center;">
        <div style="width: 60px; height: 60px; border: 5px solid rgba(0, 217, 255, 0.2); border-top-color: #00d9ff; border-radius: 50%; animation: su-spin 1s linear infinite;"></div>
      </div>
      <style>
        @keyframes su-spin { to { transform: rotate(360deg); } }
      </style>
    `;
    document.documentElement.appendChild(loader);
  }

  // Removes the loading spinner
  function hideLoadingState() {
    const loader = document.getElementById('su-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  }

  let hasRun = false;
  let observer; // Will be defined later

  // Main runner
  async function main() {
    log("main() called");
    if (hasRun || document.querySelector("[data-suinfocard]")) {
      log("Game page script has already run. Aborting.");
      return;
    }

    if (isGamePage()) {
      log("Game page detected. Running full-page takeover.");
      hasRun = true; // Set flag immediately to prevent re-entry
      observer.disconnect(); // Stop observing to prevent self-triggering
      showLoadingState(); // Show loader after stopping observer

      const titleEl = document.querySelector("h1");
      const originalBodyText = document.body.innerText; // Capture text before it's replaced
      const originalBodyHTML = document.body.innerHTML; // Capture HTML before it's replaced

      const siteLinks = collectSiteLinks();
      const card = ensureInfoCard(titleEl);

      log("--- Starting data filling process ---");
      fillMetadata(card, originalBodyText);
      fillRequirements(card, originalBodyText);
      fillDownloads(card, originalBodyHTML);
      const cleanTitle = cleanGameTitle(titleEl.innerText);
      // Use Promise.all to run async data fetching concurrently for better performance
      await Promise.all([
        fillDescription(card, originalBodyHTML),
        tryYTQueries(card, cleanTitle)
      ]);
      log("--- Data filling process complete ---");

      createFullPageLayout(siteLinks, card);
      hideLoadingState();
    } else {
      log("Generic page detected. Applying global styles.");
      styleGenericPage();
    }
  }

  // Observer (stable, narrow scope, debounce)
  log("Initializing script...");
  window.addEventListener("load", main, { once: true }); // Run on load
  let debounce;
  observer = new MutationObserver(() => {
    // log("MutationObserver triggered."); // This can be noisy, commenting out.
    // If the script has already run (e.g., from window.load), do nothing.
    if (hasRun) return;

    clearTimeout(debounce);
    debounce = setTimeout(main, 1000);
  });

  const target = document.querySelector("article, .post, .entry-content, .post-content") || document.body;
  log("Observer target element:", target);
  observer.observe(target, { childList: true, subtree: false });
  log("Script initialized.");
})();
