# AllSee v2.0 - AllStarLink (ASL) Web Controller
## সম্পূর্ণ ব্যবহার নির্দেশিকা ও টেকনিক্যাল ম্যানুয়াল

AllSee হলো AllStarLink (ASL) রেডিও নোড পরিচালনার জন্য একটি আধুনিক, লাইটওয়েট এবং নিরাপদ ওয়েব কন্ট্রোলার। এটি যেকোনো Raspberry Pi, Debian বা Ubuntu বেসড AllStarLink নোড সার্ভারে সরাসরি চলে।

---

### ১. এক কমান্ডে ইনস্টলেশন (One-Line Installer)
আপনার AllStarLink নোড সার্ভারের টার্মিনালে SSH দিয়ে লগইন করে নিচের কমান্ডটি কপি করে চালান:

```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/install.sh | sudo bash
```

ইনস্টলার যা যা স্বয়ংক্রিয়ভাবে করবে:
- Apache2 ও PHP মডিউল ইনস্টলেশন ও কনফিগারেশন
- `/var/www/html/allsee` ডিরেক্টরিতে ওয়েব ফাইল ডিপ্লয়মেন্ট
- `/etc/sudoers.d/allsee` ফাইলে নিরাপদ পারমিশন রুলস তৈরি
- `sudo allsee-update` এবং `sudo allsee-uninstall` শর্টকাট কমান্ড তৈরি
- Apache ওয়েব সার্ভার রিলোড করে ব্রাউজার অ্যাক্সেস URL প্রদর্শন

---

### ২. এক কমান্ডে আপডেট (One-Line Updater)
যদি অলসি কন্ট্রোলারে কোনো নতুন ফিচার আসে বা কোড পরিবর্তন করা হয়, তবে সম্পূর্ণ সিস্টেম নতুন করে ইনস্টল না দিয়ে ১-কমান্ডে আপডেট করুন:

```bash
sudo allsee-update
```
অথবা:
```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/update.sh | sudo bash
```

*নোট: আপডেটের সময় আপনার নোড সেটিংস ও কাস্টম ফেভারিট নোড অক্ষুণ্ণ রাখা হয়।*

---

### ৩. অলসি সম্পূর্ণ আনইনস্টল (Uninstaller)
সিস্টেম থেকে অলসি সম্পূর্ণরূপে মুছে ফেলতে:

```bash
sudo allsee-uninstall
```
অথবা:
```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/uninstall.sh | sudo bash
```

---

### ৪. লগইন ও ডিফল্ট ক্রিডেনশিয়াল
- **ব্রাউজার URL:** `http://<YOUR-NODE-IP>/allsee`
- **ডিফল্ট ইউজারনেম:** `admin`
- **ডিফল্ট পাসওয়ার্ড:** `admin` (অথবা `admin66538`)
- *পাসওয়ার্ড পরিবর্তন:* টপ বারের **Cfgs & Parameters** অথবা Settings অপশন থেকে নতুন ইউজারনেম ও পাসওয়ার্ড সেট করতে পারেন।

---

### ৫. রেডিও কন্ট্রোল ফাংশন ও DTMF পরিচিতি

| ফাংশন | DTMF কোড | Asterisk CLI কমান্ড | বিবরণ |
| :--- | :--- | :--- | :--- |
| **Connect** | `*3<node>` | `rpt fun <local> *3<target>` | সাধারণ ট্রান্সসিভ মোড সংযোগ (Rx & Tx উভয়ই চালু) |
| **Permanent Link** | `*73<node>` | `rpt fun <local> *73<target>` | স্থায়ী সংযোগ। নোড রিস্টার্ট হলেও স্বয়ংক্রিয়ভাবে রিকানেক্ট হবে |
| **Monitor** | `*2<node>` | `rpt fun <local> *2<target>` | শুধুমাত্র শোনার মোড (Rx Only)। আপনার অডিও ট্রান্সমিট হবে না |
| **Local Mon** | `*2<local>` | `rpt fun <local> *2<local>` | লোকাল রিসিভার অডিও মনিটর করার জন্য |
| **Disconnect** | `*1<node>` | `rpt fun <local> *1<target>` | নির্দিষ্ট কোনো রিমোট নোডের সাথে লিংক বিচ্ছিন্ন করা |
| **Disconnect All**| `*76` | `rpt fun <local> *76` | সমস্ত সক্রিয় রিমোট সংযোগ একসাথে বিচ্ছিন্ন করা |
| **Node Status** | `*70` | `rpt fun <local> *70` | সিস্টেম ভয়েস স্ট্যাটাস চেক |

---

### ৬. সিস্টেম ফাইল পরিচিতি ও পাথ

1. `/var/www/html/allsee/index.html` - সিঙ্গেল পেইজ রেসপন্সিভ ওয়েব ইন্টারফেস (HTML5, Tailwind, JS)
2. `/var/www/html/allsee/api.php` - Asterisk CLI ও app_rpt ইন্টিগ্রেশন ব্যাকএন্ড API
3. `/var/www/html/allsee/favorites.ini` - ফেভারিট নোড ডেটাবেস
4. `/var/www/html/allsee/config.json` - নোড নাম্বার, কলসাইন, ফ্রিকোয়েন্সি ও কনফিগারেশন
5. `/etc/sudoers.d/allsee` - www-data ইউজারের জন্য Asterisk রুলস
6. `/usr/local/bin/allsee-update` - কুইক আপডেট হেল্পার
7. `/usr/local/bin/allsee-uninstall` - কুইক আনইনস্টল হেল্পার

---

### ৭. ট্রাবলশুটিং (Troubleshooting)

**সমস্যা ১: "Permission Error: sudo: a password is required"**
- সমাধান: টার্মিনালে কমান্ড দিন:
  `sudo chmod 0440 /etc/sudoers.d/allsee && sudo systemctl restart apache2`

**সমস্যা ২: "Asterisk binary not found"**
- সমাধান: নিশ্চিত করুন AllStarLink (Asterisk) ইনস্টল আছে। সাধারণত পাথ হয় `/usr/sbin/asterisk`।

**সমস্যা ৩: তাপমাত্রা দেখাচ্ছে না**
- সমাধান: Raspberry Pi-তে `sudo usermod -a -G video www-data` দিয়ে Apache রিস্টার্ট দিন।
