🎬 SUYouTubeEmbed
SUYouTubeEmbed is a Tampermonkey/Violentmonkey userscript that transforms SteamUnderground game pages into clean, info‑rich dashboards. It automatically embeds a top YouTube review or gameplay video, cleans messy titles, adds quick external links, parses system requirements, and organizes download mirrors into a neat, expandable list.

✨ Features
🧹 Smart title cleaner Removes clutter like “PC Game”, “Free Download”, version tags, and parentheses.

🎥 Automatic YouTube embed Scrapes YouTube search results (no API key needed) and embeds the top review/gameplay video inline. ▸ Includes fallback queries (review, gameplay, trailer, etc.) ▸ Shows a clear red “Search YouTube” button if no video is found.

📊 Info card overlay Displays release date, version, and scene group right under the game title.

🖥️ System requirements table Parses the requirements block into a clean, two‑column table.

🔗 Quick external links One‑click buttons for Metacritic, SteamDB, and YouTube search.

📥 Download mirrors organizer ▸ Detects links from hosts like DataNodes, Gofile, AkiraBox, MediaFire, Pixeldrain, etc. ▸ Deduplicates and groups by host. ▸ Shows top 3 hosts with 1 mirror each by default. ▸ Extra mirrors hidden behind a “Show all mirrors” toggle.

⚡ Lightweight & resilient ▸ No API quotas or external dependencies. ▸ Debounced observer prevents flicker. ▸ Guards ensure video and tables don’t re‑render unnecessarily.

🚀 Installation
Install a userscript manager:

Tampermonkey

Violentmonkey

Click to install the script: Install SUYouTubeEmbed

Visit any SteamUnderground game page — the overlay will appear automatically.

📸 Screenshots (optional)
Add before/after screenshots here to show the cleaned title, info card, YouTube embed, and download list.

🛠️ Development
Written in plain JavaScript, no frameworks.

Uses GM_xmlhttpRequest (with fetch fallback) for YouTube scraping.

MutationObserver with debounce ensures compatibility with dynamic pages.

Configurable host priority and link limits in the CONFIG object.

🤝 Contributing
Pull requests and feature suggestions are welcome! If you find a bug or want a new host supported, open an issue.

📜 License
MIT License — free to use, modify, and share.

👉 This version highlights all the improvements you’ve coded (download grouping, flicker fix, system requirements parsing) and makes the project look polished and approachable.

Would you like me to also draft a short “Before vs After” GIF demo section for the README so people instantly see the transformation? That tends to boost adoption a lot.
