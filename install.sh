#!/bin/bash
set -e

APP_NAME="allsee"
TARGET_DIR="/var/www/html/${APP_NAME}"

echo "=========================================="
echo "    Installing AllSee Web Controller      "
echo "=========================================="

# ১. রিপোজিটরি ইউজার চেক করা (আপনার ইউজারনেম নিচে রিপ্লেস করুন)
REPO_URL="${1:-https://github.com/s21sim/allsee.git}"

echo "[1/4] Web ডিরেক্টরি সেটআপ করা হচ্ছে: ${TARGET_DIR}..."
sudo mkdir -p /var/www/html

if [ -d "$TARGET_DIR" ]; then
    echo "বিদ্যমান ডিরেক্টরি ব্যাকআপ/মুছে নতুন করে তৈরি করা হচ্ছে..."
    sudo rm -rf "$TARGET_DIR"
fi

echo "[2/4] গিটহাব থেকে সোর্স কোড ডাউনলোড করা হচ্ছে..."
sudo git clone "$REPO_URL" "$TARGET_DIR"

echo "[3/4] ফাইল পারমিশন কনফিগার করা হচ্ছে..."
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"

echo "[4/4] Asterisk এক্সিকিউশনের জন্য sudoers পারমিশন সেটআপ করা হচ্ছে..."
SUDOERS_FILE="/etc/sudoers.d/allsee-asterisk"
if [ ! -f "$SUDOERS_FILE" ]; then
    echo "www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk" | sudo tee "$SUDOERS_FILE" > /dev/null
    sudo chmod 0440 "$SUDOERS_FILE"
    echo "Sudoers কনফিগারেশন সম্পন্ন হয়েছে।"
else
    echo "Sudoers কনফিগারেশন আগে থেকেই বিদ্যমান।"
fi

# লোকাল আইপি অ্যাড্রেস সংগ্রহ
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "      ইনস্টলেশন সফলভাবে সম্পন্ন হয়েছে!    "
echo "=========================================="
echo "আপনার ব্রাউজার থেকে নিচের লিংকে প্রবেশ করুন:"
echo "http://${LOCAL_IP}/${APP_NAME}"
echo "=========================================="
