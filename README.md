# AllSee - AllStarLink (ASL) Web Controller 📻

AllStarLink (ASL) রেডিও নোড কন্ট্রোল করার জন্য একটি ওয়েব-ভিত্তিক লাইটওয়েট ও মডার্ন ডার্ক-থিম অ্যাপ। এটি সার্ভারে ইনস্টল করার পর ব্রাউজারে `http://<my-node-ip>/allsee` লিখলে সরাসরি ওপেন হবে।

![AllSee UI](https://raw.githubusercontent.com/s21sim/allsee/main/preview.png)

---

## ⚡ দ্রুত ইনস্টলেশন (One-Command Quick Install)

আপনার AllStarLink / Raspberry Pi / Debian সার্ভারের টার্মিনালে নিচের এক লাইনের কমান্ডটি রান করুন:

```bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/install.sh | sudo bash
```

> **নোট:** ইনস্টলেশন সম্পন্ন হলে স্ক্রিনে আপনার নোডের সরাসরি লিংক দেখানো হবে (যেমন: `http://192.168.1.50/allsee`)।

---

## 📦 ম্যানুয়াল ইনস্টলেশন (Manual Installation via Git)

```bash
# ১. গিটহব থেকে ক্লোন করুন
cd /tmp
git clone https://github.com/s21sim/allsee.git
cd allsee

# ২. ইনস্টলার রান করুন
sudo bash install.sh
```

ইনস্টলার স্ক্রিপ্ট স্বয়ংক্রিয়ভাবে:
1. প্রয়োজনীয় `apache2` এবং `php` প্যাকেজ ইনস্টল বা যাচাই করবে।
2. `/var/www/html/allsee` ফোল্ডার তৈরি করে `index.html` এবং `api.php` স্থাপন করবে।
3. `/etc/sudoers.d/allsee` ফাইলে নিরাপদ পারমিশন কনফিগার করবে যাতে `www-data` ইউজার `asterisk -rx` কমান্ড রান করতে পারে।
4. সঠিক ইউজার পারমিশন (`chown -R www-data:www-data`) সেট করবে।

---

## 📂 ফাইলসমূহের বিবরণ (File Structure)

```text
allsee/
├── index.html       # রেসপনসিভ ডার্ক-মোড ইউজার ইন্টারফেস ও লাইভ কনসোল
├── api.php          # Asterisk CLI (app_rpt) কমান্ড রান করার সুরক্ষিত ব্যাকএন্ড
├── install.sh       # এক ক্লিকে সম্পূর্ণ অটোমেটিক ইনস্টলার স্ক্রিপ্ট
└── README.md        # ইনস্টলেশন ও ব্যবহার নির্দেশিকা
```

---

## 🛠 ফিচারসমূহ (Core Features)

- **Local Node Input:** আপনার হোস্ট রেডিও নোড নম্বর (যেমন: `1999` বা `54321`) দিন। এটি ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।
- **Target Node Input:** রিমোট নোড নম্বর প্রবেশ করান।
- **Connect (*3):** Transceive লিংক সংযোগ করে (`rpt fun <local> *3<target>`)।
- **Monitor (*2):** কেবল শোনার জন্য RX Monitor মোডে সংযোগ করে (`rpt fun <local> *2<target>`)।
- **Disconnect (*1):** নির্দিষ্ট নোডের সাথে সংযোগ বিচ্ছিন্ন করে (`rpt fun <local> *1<target>`)।
- **Disconnect All (*76):** সকল সক্রিয় লিংক এক ক্লিকে বন্ধ করে (`rpt fun <local> *76`)।
- **Check Status (*70):** নোড ও সিস্টেম স্ট্যাটাস যাচাই করে।
- **List Nodes:** বর্তমানে সংযুক্ত নোডগুলোর তালিকা (`rpt nodes <local>`) দেখায়।
- **Custom DTMF:** কাস্টম DTMF কোড (যেমন `*81` টাইম চেক) পাঠানোর ব্যবস্থা।
- **Live Console Box:** অ্যাসটেরিস্ক টার্মিনালের লাইভ আউটপুট, টাইমস্ট্যাম্প সহ দেখার সুব্যবস্থা।

---

## 🔒 নিরাপত্তা ও পারমিশন (Security Configuration)

`api.php` ব্যাকএন্ডে কঠোর ইনপুট ভ্যালিডেশন দেওয়া আছে। শুধু সংখ্যা (`/^[0-9]{3,8}$/`) ছাড়া কোনো ক্যারেক্টার অনুমোদিত নয়, যা যে কোনো কমান্ড ইনজেকশন প্রতিরোধ করে।

ইনস্টলার স্ক্রিপ্টটি `/etc/sudoers.d/allsee` কনফিগার করে:
```sudoers
www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /usr/bin/asterisk -rx *
```

---

## ❓ সাধারণ সমস্যা ও সমাধান (Troubleshooting)

1. **Permission Denied এরর দেখালে:**
   টার্মিনালে নিশ্চিত করুন sudoers ফাইলটি সঠিকভাবে আছে কিনা:
   ```bash
   sudo visudo -cf /etc/sudoers.d/allsee
   ```
2. **Asterisk Not Found:**
   নিশ্চিত করুন AllStarLink সার্ভিস চালু আছে:
   ```bash
   sudo asterisk -rx "core show version"
   ```
3. **ব্রাউজারে পেজ না আসলে:**
   Apache চালু আছে কিনা দেখে রিস্টার্ট করুন:
   ```bash
   sudo systemctl restart apache2
   ```

লাইসেন্স: MIT &bull; রেডিও কমিউনিটি ও হ্যাম রেডিও অপারেটরদের জন্য উন্মুক্ত।
