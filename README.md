# AllSee - AllStarLink (ASL) Web Controller 📻

AllStarLink (ASL) রেডিও নোড কন্ট্রোল করার জন্য একটি ওয়েব-ভিত্তিক লাইটওয়েট ও মডার্ন ডার্ক-থিম অ্যাপ। এটি সার্ভারে ইনস্টল করার পর ব্রাউজারে `http://<my-node-ip>/allsee` লিখলে সরাসরি ওপেন হবে।

## ⚡ দ্রুত ইনস্টলেশন (One-Command Quick Install)

আপনার AllStarLink / Raspberry Pi / Debian সার্ভারের টার্মিনালে নিচের এক লাইনের কমান্ডটি রান করুন:

```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/install.sh | sudo bash
```

> **নোট:** ইনস্টলেশন সম্পন্ন হলে স্ক্রিনে আপনার নোডের সরাসরি লিংক দেখানো হবে (যেমন: `http://192.168.0.249/allsee`)।

---

## 📦 ম্যানুয়াল ইনস্টলেশন (Manual Installation via Git)

```bash
cd /tmp
git clone https://github.com/s21sim/allsee.git
cd allsee
sudo bash install.sh
```

---

## 📂 ফাইলসমূহের বিবরণ (File Structure)

- `index.html`: রেসপনসিভ ডার্ক-মোড ইউজার ইন্টারফেস ও লাইভ কনসোল
- `api.php`: Asterisk CLI (`app_rpt`) কমান্ড রান করার সুরক্ষিত ব্যাকএন্ড
- `install.sh`: এক ক্লিকে সম্পূর্ণ অটোমেটিক ইনস্টলার স্ক্রিপ্ট
