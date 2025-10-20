# 🎬 Steam Underground Youtube Review Embedder

**SUYouTubeEmbed** is a Chrome/Edge extension that automatically embeds the **top YouTube review video** for any game page on [SteamUnderground](https://steamunderground.net).  
It scrapes YouTube’s search results directly (no API key required) and injects a responsive player right under the game title. If no video is found, it shows a clear fallback button linking to YouTube search.

---

## ✨ Features
- 🔎 Cleans messy game titles (removes “PC Game”, “Direct Download”, version numbers, etc.)
- 🎥 Scrapes YouTube search results and embeds the **top video** inline
- 📺 Responsive iframe player (mobile‑friendly, scales with page width)
- 🛠️ Extended fallback queries (`review`, `gameplay`, `playtest`, `trailer`, `impressions`, `first look`, `overview`, `early access`)
- 🚨 Visible fallback button if no video is found:  
  **“🔎 Search YouTube for <Game Title>”**
- ⚡ Lightweight, no API quota limits, no external dependencies

---

## 🚀 Quick Install

Click below to install directly with Tampermonkey or Violentmonkey:

[![Install Userscript](https://img.shields.io/badge/Install-Userscript-blue)](https://github.com/Callmesnake5561/SUYouTubeEmbed/raw/main/SUYouTubeEmbed.user.js)

> Requires a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
