# 🎬 SUYouTubeEmbed

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

## 📦 Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Callmesnake5561/SUYouTubeEmbed.git
