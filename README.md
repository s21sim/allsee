# AllSee - AllStarLink Web Controller

AllStarLink (ASL) রেডিও নোড পরিচালনা করার জন্য একটি সহজ ও আধুনিক ডার্ক-মোড ওয়েব ইন্টারফেস।

## ফিচারসমূহ
- আধুনিক ও রেসপনসিভ ডার্ক থিম
- দ্রুত নোড Connect (*3), Disconnect (*1) এবং Disconnect All (*76)
- লাইভ নোড স্ট্যাটাস দেখার সুবিধা
- রিয়েল-টাইম টার্মিনাল কনসোল আউটপুট

## ইনস্টলেশন নির্দেশিকা

### ধাপ ১: GitHub-এ ফাইল আপলোড
আপনার লোকাল মেশিনে একটি ফোল্ডার খুলে তাতে `index.html`, `api.php`, `install.sh` এবং `README.md` রাখুন এবং আপনার GitHub রিপোজিটরিতে পুশ করুন:

```bash
git init
git add .
git commit -m "Initial commit for AllSee"
git branch -M main
git remote add origin [https://github.com/YOUR_GITHUB_USERNAME/allsee.git](https://github.com/YOUR_GITHUB_USERNAME/allsee.git)
git push -u origin main
