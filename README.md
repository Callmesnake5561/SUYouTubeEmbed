# 🎬 SUYouTubeEmbed

**SUYouTubeEmbed** is a Tampermonkey/Violentmonkey userscript that transforms [SteamUnderground](https://steamunderground.net/) game pages into clean, info‑rich dashboards.  
It automatically embeds a top YouTube review or gameplay video, cleans messy titles, adds quick external links, parses system requirements, and organizes download mirrors into a neat, expandable list.

---

## ✨ Features

- 🧹 **Smart title cleaner**  
  Removes clutter like “PC Game”, “Free Download”, version tags, and parentheses.

- 🎥 **Automatic YouTube embed**  
  ▸ Scrapes YouTube search results (no API key needed)  
  ▸ Tries multiple queries (`review`, `gameplay`, `trailer`, etc.)  
  ▸ Embeds the top video inline under the game title  
  ▸ Shows a clear red “Search YouTube” button if no video is found

- 📊 **Info card overlay**  
  Displays release date, version, and scene group right under the title.

- 🖥️ **System requirements table**  
  Parses the requirements block into a clean, two‑column table.

- 🔗 **Quick external links**  
  One‑click buttons for Metacritic, SteamDB, and YouTube search.

- 📥 **Download mirrors organizer**  
  ▸ Detects links from hosts like DataNodes, Gofile, AkiraBox, MediaFire, Pixeldrain, etc.  
  ▸ Deduplicates and groups by host  
  ▸ Shows top 3 hosts with 1 mirror each by default  
  ▸ Extra mirrors hidden behind a “Show all mirrors” toggle

- ⚡ **Lightweight & resilient**  
  ▸ No API quotas or external dependencies  
  ▸ Debounced observer prevents flicker  
  ▸ Guards ensure video and tables don’t re‑render unnecessarily

---

## 🚀 Installation

1. Install a userscript manager:  
   - [Tampermonkey](https://www.tampermonkey.net/)  
   - [Violentmonkey](https://violentmonkey.github.io/)

2. Click to install the script:  
   [**Install SUYouTubeEmbed**](https://github.com/Callmesnake5561/SUYouTubeEmbed/raw/main/SUYouTubeEmbed.user.js)

3. Visit any SteamUnderground game page — the overlay will appear automatically.

---

## 🛠️ Development

- Written in plain JavaScript, no frameworks  
- Uses `GM_xmlhttpRequest` (with `fetch` fallback) for YouTube scraping  
- MutationObserver with debounce ensures compatibility with dynamic pages  
- Configurable host priority and link limits in the `CONFIG` object

---

## 🤝 Contributing

Pull requests and feature suggestions are welcome!  
If you find a bug or want a new host supported, open an issue.

---

## 📜 License

MIT License — free to use, modify, and share.
