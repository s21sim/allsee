#!/usr/bin/env bash
# ==============================================================================
# AllSee - AllStarLink (ASL) Web Controller Automated Installer
# Supported OS: Debian 10/11/12, Raspberry Pi OS, HamVOIP, ASL 2.0 / 3.0
# Target Directory: /var/www/html/allsee
# Target URL: http://<your-node-ip>/allsee
# ==============================================================================

set -e

# Colors for terminal styling
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "  █████  ██      ██      ███████ ███████ ███████ "
echo " ██   ██ ██      ██      ██      ██      ██      "
echo " ███████ ██      ██      ███████ █████   █████   "
echo " ██   ██ ██      ██           ██ ██      ██      "
echo " ██   ██ ███████ ███████ ███████ ███████ ███████ "
echo -e "${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "${BOLD} AllSee - AllStarLink Web Controller Installer${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] This installer must be run as root.${NC}"
  echo -e "${YELLOW}Please re-run with:${NC} sudo bash $0"
  exit 1
fi

TARGET_DIR="/var/www/html/allsee"
SUDOERS_FILE="/etc/sudoers.d/allsee"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# GitHub default repository URL (can be customized)
GITHUB_REPO_URL="${ALLSEE_REPO_URL:-https://github.com/ssniloy-bd/allsee.git}"
RAW_BASE_URL="${ALLSEE_RAW_URL:-https://raw.githubusercontent.com/ssniloy-bd/allsee/main}"

echo -e "\n${CYAN}[1/6] Checking system requirements and web server...${NC}"

# Detect Package Manager
if command -v apt-get >/dev/null 2>&1; then
  PKG_MANAGER="apt"
elif command -v pacman >/dev/null 2>&1; then
  PKG_MANAGER="pacman"
else
  PKG_MANAGER="unknown"
fi

# Install Apache2 and PHP if missing
if ! command -v apache2 >/dev/null 2>&1 && ! command -v lighttpd >/dev/null 2>&1 && ! command -v nginx >/dev/null 2>&1; then
  echo -e "${YELLOW}[!] No web server found. Installing Apache2 and PHP...${NC}"
  if [ "$PKG_MANAGER" = "apt" ]; then
    apt-get update -y
    apt-get install -y apache2 php libapache2-mod-php php-curl php-json curl git
  else
    echo -e "${RED}[!] Please install a web server with PHP support manually.${NC}"
  fi
fi

# Ensure PHP is installed
if ! command -v php >/dev/null 2>&1; then
  echo -e "${YELLOW}[!] PHP not detected. Installing PHP...${NC}"
  if [ "$PKG_MANAGER" = "apt" ]; then
    apt-get update -y
    apt-get install -y php php-curl php-json
  fi
fi

echo -e "${GREEN}[✓] Web server and PHP are ready.${NC}"

# 2. Check Asterisk CLI
echo -e "\n${CYAN}[2/6] Detecting Asterisk / AllStarLink installation...${NC}"
ASTERISK_BIN=""
for bin in /usr/sbin/asterisk /usr/bin/asterisk /usr/local/sbin/asterisk; do
  if [ -x "$bin" ]; then
    ASTERISK_BIN="$bin"
    break
  fi
done

if [ -n "$ASTERISK_BIN" ]; then
  echo -e "${GREEN}[✓] Found Asterisk binary at:${NC} $ASTERISK_BIN"
else
  echo -e "${YELLOW}[!] Warning: Asterisk binary not found in standard paths.${NC}"
  echo -e "    AllSee will still install, but Asterisk commands require ASL installed."
  ASTERISK_BIN="/usr/sbin/asterisk"
fi

# 3. Create target directory
echo -e "\n${CYAN}[3/6] Setting up target directory at ${TARGET_DIR}...${NC}"
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/data"

# 4. Deploy Files
echo -e "\n${CYAN}[4/6] Deploying \"AllSee\" V1.0 files...${NC}"

# Check if installing from local directory containing the files
if [ -f "$SCRIPT_DIR/standalone/index.html" ] || [ -f "$SCRIPT_DIR/api.php" ]; then
  echo -e "    Copying files from local workspace (${SCRIPT_DIR})..."
  if [ -f "$SCRIPT_DIR/standalone/index.html" ]; then
    cp "$SCRIPT_DIR/standalone/index.html" "$TARGET_DIR/index.html"
  elif [ -f "$SCRIPT_DIR/index.html" ]; then
    cp "$SCRIPT_DIR/index.html" "$TARGET_DIR/index.html"
  fi

  if [ -f "$SCRIPT_DIR/public/allsee-icon.svg" ]; then
    cp "$SCRIPT_DIR/public/allsee-icon.svg" "$TARGET_DIR/allsee-icon.svg"
  elif [ -f "$SCRIPT_DIR/allsee-icon.svg" ]; then
    cp "$SCRIPT_DIR/allsee-icon.svg" "$TARGET_DIR/allsee-icon.svg"
  fi

  if [ -f "$SCRIPT_DIR/api.php" ]; then
    cp "$SCRIPT_DIR/api.php" "$TARGET_DIR/api.php"
  fi

  if [ -f "$SCRIPT_DIR/uninstall.sh" ]; then
    cp "$SCRIPT_DIR/uninstall.sh" "$TARGET_DIR/uninstall.sh"
  fi

  if [ -f "$SCRIPT_DIR/README.md" ]; then
    cp "$SCRIPT_DIR/README.md" "$TARGET_DIR/README.md"
  fi

else
  echo -e "    Downloading files from GitHub repository (${RAW_BASE_URL})..."
  curl -sSL "$RAW_BASE_URL/standalone/index.html" -o "$TARGET_DIR/index.html" || \
    curl -sSL "$RAW_BASE_URL/index.html" -o "$TARGET_DIR/index.html"
  curl -sSL "$RAW_BASE_URL/public/allsee-icon.svg" -o "$TARGET_DIR/allsee-icon.svg" || true
  curl -sSL "$RAW_BASE_URL/api.php" -o "$TARGET_DIR/api.php"
  curl -sSL "$RAW_BASE_URL/uninstall.sh" -o "$TARGET_DIR/uninstall.sh"
  curl -sSL "$RAW_BASE_URL/README.md" -o "$TARGET_DIR/README.md"
fi

# Copy uninstall.sh to /usr/local/bin for convenience
if [ -f "$TARGET_DIR/uninstall.sh" ]; then
  chmod +x "$TARGET_DIR/uninstall.sh"
  cp "$TARGET_DIR/uninstall.sh" /usr/local/bin/allsee-uninstall 2>/dev/null || true
fi

echo -e "${GREEN}[✓] Files successfully placed in ${TARGET_DIR}.${NC}"

# 5. Configure Permissions & Sudoers for www-data
echo -e "\n${CYAN}[5/6] Configuring Asterisk execution permissions for www-data...${NC}"

# Add www-data to asterisk group if group exists
if getent group asterisk >/dev/null 2>&1; then
  usermod -a -G asterisk www-data 2>/dev/null || true
  echo -e "${GREEN}[✓] Added www-data user to 'asterisk' group.${NC}"
fi

# Setup sudoers entry so www-data can run Asterisk CLI commands securely
cat << 'EOF' > "$SUDOERS_FILE.tmp"
# AllSee Web Controller permissions for Asterisk CLI
www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk
www-data ALL=(ALL) NOPASSWD: /usr/bin/asterisk
EOF

# Validate syntax with visudo
if visudo -cf "$SUDOERS_FILE.tmp" >/dev/null 2>&1; then
  mv "$SUDOERS_FILE.tmp" "$SUDOERS_FILE"
  chmod 0440 "$SUDOERS_FILE"
  echo -e "${GREEN}[✓] Sudoers rule validated and created at ${SUDOERS_FILE}.${NC}"
else
  rm -f "$SUDOERS_FILE.tmp"
  echo -e "${RED}[ERROR] Sudoers rule validation failed. Sudo entry not applied.${NC}"
fi

# Set directory permissions
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

# Restart or reload Apache if present
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload apache2 2>/dev/null || systemctl restart apache2 2>/dev/null || true
  systemctl reload lighttpd 2>/dev/null || true
  systemctl reload nginx 2>/dev/null || true
fi

# 6. Success Output and IP Detection
echo -e "\n${CYAN}[6/6] Verifying setup and detecting IP addresses...${NC}"

# Detect local IP
NODE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$NODE_IP" ]; then
  NODE_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
fi
if [ -z "$NODE_IP" ]; then
  NODE_IP="127.0.0.1"
fi

echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD}       ALLSEE INSTALLATION COMPLETED SUCCESSFULLY!    ${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "\n${BOLD}You can now access your AllStarLink Web Controller at:${NC}"
echo -e "  ${CYAN}${BOLD}http://${NODE_IP}/allsee${NC}"
echo -e "  (or http://<your-node-ip>/allsee)"
echo -e "\n${BOLD}Files Installed:${NC}"
echo -e "  - Web Interface: ${TARGET_DIR}/index.html"
echo -e "  - API Backend:   ${TARGET_DIR}/api.php"
echo -e "  - Uninstaller:   ${TARGET_DIR}/uninstall.sh"
echo -e "  - Sudo Rules:    ${SUDOERS_FILE}"
echo -e "\n${BOLD}To uninstall anytime, simply run:${NC}"
echo -e "  ${YELLOW}sudo allsee-uninstall${NC}  or  ${YELLOW}sudo bash ${TARGET_DIR}/uninstall.sh${NC}"
echo -e "\n${BLUE}73 & Happy Operating!${NC}\n"
