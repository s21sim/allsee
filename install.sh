#!/bin/bash
set -e

APP_NAME="allsee"
TARGET_DIR="/var/www/html/${APP_NAME}"
REPO_URL="https://github.com/s21sim/allsee.git"

echo "=========================================="
echo "    Installing AllSee Node Web Manager    "
echo "=========================================="

echo "[1/4] ওয়েব ডিরেক্টরি সেটআপ করা হচ্ছে..."
sudo mkdir -p /var/www/html

if [ -d "$TARGET_DIR" ]; then
    echo "বিদ্যমান ডিরেক্টরি পরিষ্কার করা হচ্ছে..."
    sudo rm -rf "$TARGET_DIR"
fi

echo "[2/4] গিটহাব থেকে কোড ক্লোন করা হচ্ছে..."
sudo git clone "$REPO_URL" "$TARGET_DIR"

echo "[3/4] পারমিশন ও ওনারশিপ কনফিগার করা হচ্ছে..."
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"

echo "[4/4] Asterisk এক্সিকিউশন পারমিশন কনফিগার করা হচ্ছে..."
SUDOERS_FILE="/etc/sudoers.d/allsee-asterisk"
if [ ! -f "$SUDOERS_FILE" ]; then
    echo "www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk" | sudo tee "$SUDOERS_FILE" > /dev/null
    sudo chmod 0440 "$SUDOERS_FILE"
    echo "Sudoers কনফিগারেশন যুক্ত করা হয়েছে।"
else
    echo "Sudoers কনফিগারেশন আগে থেকেই প্রস্তুত।"
fi

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
echo "      ইনস্টলেশন সফলভাবে সম্পন্ন হয়েছে!    "
echo "=========================================="
echo "আপনার ব্রাউজার থেকে নিচের লিংকে প্রবেশ করুন:"
echo "http://${LOCAL_IP}/${APP_NAME}"
echo "ডিফল্ট ইউজার: admin | পাসওয়ার্ড: admin123"
echo "=========================================="
