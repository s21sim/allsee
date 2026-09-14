# AllSee - AllStarLink (ASL) Web Controller 📻

**AllSee** হলো একটি আধুনিক, লাইটওয়েট এবং ডার্ক-থিম (Dark Theme) ভিত্তিক ওয়েব অ্যাপ্লিকেশন যা দিয়ে খুব সহজেই ব্রাউজার থেকে আপনার **AllStarLink (ASL)** রেডিও নোড পরিচালনা করা যায়।

ইনস্টলেশনের পর ব্রাউজারে `http://<my-node-ip>/allsee` লিংকে ভিজিট করলেই সরাসরি কন্ট্রোলার চালু হয়ে যাবে।

---

## ✨ মূল ফিচারসমূহ (Key Features)

- 🎨 **আধুনিক ডার্ক-মোড UI**: নিওন সায়ান ও ভায়োলেট অ্যাকসেন্টসহ রেসপন্সিভ ইন্টারফেস (মোবাইল ও পিসিতে সমান সুন্দর)।
- ⚡ **রিয়েল-টাইম Asterisk CLI কনসোল**: নিচে রয়েছে একটি কালো টার্মিনাল বক্স যেখানে প্রতিটি কমান্ড ও Asterisk-এর লাইভ আউটপুট সরাসরি দেখা যায়।
- 🔄 **ফুল নোড কন্ট্রোল**:
  - **Local Node** এবং **Target Node** ইনপুট
  - **Connect Modes**: Transceive (`*3`), Monitor (`*2`), Permanent Transceive (`*73`), Permanent Monitor (`*72`)
  - **Disconnect**: Target Disconnect (`*1`) এবং Disconnect All Links (`*76`)
  - **Quick DTMF বাটন**: Say Time (`*81`), Force ID (`*80`), Announce Status (`*70`), Say IP (`*83`)
- ⭐ **Favorite Nodes**: ঘন ঘন ব্যবহৃত নোড বা হাবগুলো (যেমন WAN System, East Coast Hub, WIN System ইত্যাদি) সংরক্ষণ এবং ১-ক্লিকে কানেক্ট করার সুবিধা।
- 🛡️ **সুরক্ষিত PHP ব্যাকএন্ড (`api.php`)**: ইনপুট স্যানিটাইজেশন, রেজেক্স নোড ভ্যালিডেশন এবং নিরাপদ `sudo` রুলস।

---

## 🚀 এক কমান্ডে ইনস্টলেশন (1-Command Install)

আপনার AllStarLink সার্ভারের (Raspberry Pi বা Debian) টার্মিনালে নিচের কমান্ডটি রান করুন:

```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/install.sh | sudo bash
```
---

## 🛠️ ম্যানুয়াল ইনস্টলেশন (Git Clone Method)

যদি আপনি গিট ক্লোন করে রান করতে চান:

```bash
# ১. গিটহাব থেকে ক্লোন করুন
git clone https://github.com/<YOUR-GITHUB-USERNAME>/allsee.git

# ২. ডিরেক্টরিতে প্রবেশ করুন
cd allsee

# ৩. ইনস্টলার রান করুন
sudo bash install.sh
```

ইনস্টলেশন সফল হলে টার্মিনালে অ্যাক্সেস লিংক দেখাবে:
👉 **`http://<your-node-ip>/allsee`**

---

## 📤 গিটহাবে আপলোড করার নিয়ম (GitHub Upload Guide)

আপনার লোকাল পিসি বা সার্ভার থেকে প্রজেক্টটি গিটহাবে তুলতে নিচের কমান্ডগুলো চালান:

```bash
# গিট রিপোজিটরি ইনিশিয়ালাইজ করুন
git init

# ফাইলগুলো অ্যাড করুন
git add .

# কমিট করুন
git commit -m "Initial commit of AllSee ASL Web Controller"

# মেইন ব্রাঞ্চ সিলেক্ট করুন
git branch -M main

# আপনার গিটহাব রিপোর লিংক যুক্ত করুন
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/allsee.git

# কোড পুশ করুন
git push -u origin main
```

---

## 📂 ফাইল স্ট্রাকচার (Repository Structure)

```text
├── index.html        # মূল ডার্ক-মোড ওয়েব ইন্টারফেস (/var/www/html/allsee/index.html)
├── api.php           # Asterisk CLI রান করার সুরক্ষিত ব্যাকএন্ড
├── install.sh        # অটোমেটিক ফুল ইনস্টলেশন ব্যাশ স্ক্রিপ্ট
├── uninstall.sh      # সম্পূর্ণ আনইনস্টলার স্ক্রিপ্ট
└── README.md         # প্রজেক্ট ডকুমেন্টেশন
```

---

## 🎛️ AllStarLink DTMF ফাংশন রেফারেন্স

| ফাংশন | DTMF কোড | Asterisk CLI কমান্ড | বিবরণ |
| :--- | :--- | :--- | :--- |
| **Connect Transceive** | `*3<target>` | `rpt fun <local> *3<target>` | উভয়মুখী অডিও কানেকশন (RX/TX) |
| **Connect Monitor** | `*2<target>` | `rpt fun <local> *2<target>` | শুধু শোনার কানেকশন (RX Only) |
| **Disconnect** | `*1<target>` | `rpt fun <local> *1<target>` | নির্দিষ্ট নোড ডিসকানেক্ট |
| **Disconnect All** | `*76` | `rpt fun <local> *76` | সব কানেক্টেড লিংক ডিসকানেক্ট |
| **Perm Transceive** | `*73<target>` | `rpt fun <local> *73<target>` | রিবুট হলেও স্বয়ংক্রিয়ভাবে রিকানেক্ট হবে |
| **Say Time** | `*81` | `rpt fun <local> *81` | স্থানীয় সময় ঘোষণা করবে |
| **Say ID** | `*80` | `rpt fun <local> *80` | নোড কলসাইন আইডেন্টিফাই করবে |
| **Node Status** | `*70` | `rpt nodes <local>` | সক্রিয় নোডসমূহের লিস্ট দেখাবে |

---

## 🗑️ আনইনস্টল করার নিয়ম (Uninstall)

AllSee আপনার সার্ভার থেকে সম্পূর্ণ মুছে ফেলতে চাইলে রান করুন:

```bash
sudo allsee-uninstall
# অথবা
sudo bash /var/www/html/allsee/uninstall.sh
```

এটি স্বয়ংক্রিয়ভাবে `/var/www/html/allsee` ফোল্ডার এবং `/etc/sudoers.d/allsee` পারমিশন ক্লিন করে দেবে।

---

## 🔒 সিকিউরিটি নোট (Security)
- `api.php` ফাইলে শুধুমাত্র বৈধ সংখ্যাসূচক নোড নম্বর (`^[0-9]{2,8}$`) অনুমোদিত, ফলে কোনো শেল ইনজেকশন সম্ভব নয়।
- আপনি চাইলে `Settings`-এ একটি **API Security Token** সেট করতে পারেন যা অপশনাল অথেনটিকেশন হিসেবে কাজ করবে।

---
**73 de AllSee Team** • Happy Ham Radio Operating!
