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

 ![Screenshot_21-10-2025_194846_steamunderground net](https://github.com/user-attachments/assets/6a53e005-b128-4c93-9ad4-9a682e0d6dc4)
![Screenshot_21-10-2025_194831_steamunderground net](https://github.com/user-attachments/assets/94e5e9f2-32d3-49c9-af83-8c192fd57ff4)
![Screenshot_21-10-2025_19486_steamunderground net](https://github.com/user-attachments/assets/557a9be3-ef84-46fc-bfbb-a33b51850cf8)
![Screenshot_21-10-2025_194743_steamunderground net](https://github.com/user-attachments/assets/17198c07-96ee-42e1-9dfd-c6900c06a98a)


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
