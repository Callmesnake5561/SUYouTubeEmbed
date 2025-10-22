# 💎 SU Refined – Full Site Dark Theme  

🚀 **Transform Steam Underground into a sleek, futuristic dashboard.**  
This userscript overhauls game pages with **dark mode**, **YouTube embeds**, **clean info cards**, and **modular tables** — all styled for clarity and speed.  

---

## ✨ Features  

- 🌑 **Full‑site dark theme** with neon accents  
- 🎥 **Automatic YouTube trailer embeds** (with smart fallbacks)  
- 📊 **Game info cards** (release date, version, scene group)  
- 💻 **System requirements tables** (clean, responsive, styled)  
- 📥 **Download links grouped by host** with mirror toggles  
- 📝 **Game descriptions** pulled from Wikipedia or fallback scraping  
- 🌐 **External quick links** (SteamDB, YouTube search)  
- ⚡ **Optimized performance** with async data fetching and mutation observer  

---

## 📸 Screenshots  

<p 


  <img src="![Screenshot_21-10-2025_194831_steamunderground net](https://github.com/user-attachments/assets/bc6c0429-2991-496e-bca8-e3bdeb613ba0)" width="300"/>
  <img src="assets/screenshot2.png" width="300"/>
  <img src="assets/screenshot3.png" width="300"/>
</p>



---

## 🛠️ Installation  

1. 📦 Install a userscript manager:  
   - [Violentmonkey](https://violentmonkey.github.io/)  
   - [Tampermonkey](https://www.tampermonkey.net/)  

2. 🔗 [Click here to install the script](https://github.com/Callmesnake5561/SUYouTubeEmbed/raw/main/SUYouTubeEmbed.user.js)  

3. ✅ Refresh any **Steam Underground** page and enjoy the upgrade!  

---

## ⚙️ Configuration  

The script includes a **config block** you can tweak:  

```js
const CONFIG = {
  stripWords: ["PC Game", "Free Download", "Direct Download", "Download"],
  ytQueries: ["review", "gameplay", "trailer", "overview", ""],
  hostPriority: ["datanodes", "torrent", "gofile", "akirabox", "mediafire"],
  primaryHostLimit: 3,
  linksPerHostLimit: 1
};
