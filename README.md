# AllSee - Modern Dark UI AllStarLink Web Controller

```
  █████  ██      ██      ███████ ███████ ███████ 
 ██   ██ ██      ██      ██      ██      ██      
 ███████ ██      ██      ███████ █████   █████   
 ██   ██ ██      ██           ██ ██      ██      
 ██   ██ ███████ ███████ ███████ ███████ ███████ 
======================================================
 AllSee - AllStarLink Web Controller
======================================================
```

**AllSee** is a high-performance, modern dark-themed web management interface and automated node scanner designed specifically for **AllStarLink (ASL2 / ASL3 / HamVOIP)** repeaters and simplex nodes.

---

## 🚀 Quick Install (GitHub: `s21sim/allsee`)

Log in to your AllStarLink server (via SSH or local console) and run:

```bash
git clone https://github.com/s21sim/allsee.git
cd allsee
sudo bash install.sh
```

Or install with a single command:
```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/install.sh | sudo bash
```

Once installed, open your web browser and navigate to:
```
http://<your-node-ip>/allsee
```
*(Example: `http://192.168.1.50/allsee` or `http://myaslnode.local/allsee`)*

---

## 🗑️ Uninstall AllSee

To remove AllSee and restore your server:

```bash
sudo bash /var/www/html/allsee/uninstall.sh
```
*(or run `sudo bash uninstall.sh` from the cloned `allsee` directory)*

Your core Asterisk configurations (`rpt.conf`, `modules.conf`) and radio operations will remain completely intact.

---

## 🌟 Key Features

- **Automated Favorite Scanner**: Dwell-timer hopping through configured favorites with automatic voice carrier hold (`pauseOnCos`) and hang time.
- **Active Link Monitor**: Live visibility of connected nodes, link direction, audio keying states, and one-click Disconnect (`*1`) or mode switching (`*3` Transceive / `*2` Monitor).
- **DTMF Audio Keypad**: Real-time dual-tone multi-frequency synthesizer with 16 buttons and instant macro shortcuts (`*70` status, `*81` say IP, `*82` time, `*76` disconnect all).
- **RF Spectrum & Audio Scope**: Web Audio API waveform and frequency spectrum analyzer, hardware-style LED S-Meter, and repeater roger beep generator.
- **Node Directory Search**: Searchable database of world-wide AllStarLink nodes and reflectors with 1-click connect and bookmarking.
- **Hardware & System Stats**: Real-time CPU temperature, memory usage, load averages, uptime, and Asterisk service controls.
- **Sleek Modern Dark UI**: Obsidian Charcoal, Midnight Navy, and OLED True Black themes with custom cyber-emerald and electric-cyan accents.

---

## 📄 License & Credits

Created by [s21sim](https://github.com/s21sim). Designed for the global Amateur Radio Community.  
Licensed under the Apache-2.0 License.
