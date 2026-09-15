#!/usr/bin/env bash
# ==============================================================================
# AllSee - Modern Dark UI AllStarLink Web Controller Installer
# GitHub: https://github.com/s21sim/allsee
# ==============================================================================

set -e

# Color definitions
CYAN='\033[0;36m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Clear terminal screen
clear 2>/dev/null || true

# Display required header banner
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

# Check for root / sudo privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This installer must be run as root or with sudo.${NC}"
    echo -e "${YELLOW}Please re-run as:${NC} sudo bash install.sh"
    exit 1
fi

INSTALL_DIR="/var/www/html/allsee"
REPO_URL="https://github.com/s21sim/allsee.git"
WEB_USER="www-data"

# Check OS and web server user
if id -u "http" >/dev/null 2>&1; then
    WEB_USER="http"
elif id -u "www-data" >/dev/null 2>&1; then
    WEB_USER="www-data"
elif id -u "apache" >/dev/null 2>&1; then
    WEB_USER="apache"
elif id -u "nginx" >/dev/null 2>&1; then
    WEB_USER="nginx"
fi

echo -e "\n${BLUE}[1/6]${NC} Detecting System Environment & Web Server..."

# Ensure target web root directory exists
if [ ! -d "/var/www/html" ]; then
    if [ -d "/srv/http" ]; then
        mkdir -p /srv/http/allsee
        ln -sfn /srv/http/allsee /var/www/html/allsee 2>/dev/null || true
        INSTALL_DIR="/srv/http/allsee"
    else
        mkdir -p /var/www/html
    fi
fi

# Ensure web server & PHP are present (Apache or Nginx or Lighttpd)
if ! command -v apache2 >/dev/null 2>&1 && ! command -v nginx >/dev/null 2>&1 && ! command -v httpd >/dev/null 2>&1 && ! command -v lighttpd >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Web server not detected. Installing Apache2 and PHP...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq
        apt-get install -y -qq apache2 php php-cli libapache2-mod-php curl git
        systemctl enable apache2 || true
        systemctl restart apache2 || true
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm apache php php-apache git curl
        systemctl enable httpd || true
        systemctl restart httpd || true
    fi
fi

# Install PHP if not present (needed for Asterisk AMI / CLI bridge)
if ! command -v php >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Installing PHP runtime...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq
        apt-get install -y -qq php-cli php || true
    fi
fi

echo -e "${GREEN}✓ Web server environment verified.${NC}"

# Preparation of files
echo -e "\n${BLUE}[2/6]${NC} Preparing AllSee Application Files..."

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
BUILD_SOURCE=""

if [ -f "${CURRENT_DIR}/package.json" ] && [ -d "${CURRENT_DIR}/src" ]; then
    echo -e "${GREEN}✓ Local repository source detected at ${CURRENT_DIR}${NC}"
    BUILD_SOURCE="${CURRENT_DIR}"
else
    # Clone repository from github
    TMP_CLONE="/tmp/allsee_build_$$"
    echo -e "${CYAN}Cloning latest AllSee from ${REPO_URL}...${NC}"
    rm -rf "${TMP_CLONE}"
    git clone --depth 1 "${REPO_URL}" "${TMP_CLONE}"
    BUILD_SOURCE="${TMP_CLONE}"
fi

# Compile / Build Frontend
echo -e "\n${BLUE}[3/6]${NC} Building AllSee Production Assets..."
cd "${BUILD_SOURCE}"

if [ -d "${BUILD_SOURCE}/dist" ] && [ -f "${BUILD_SOURCE}/dist/index.html" ]; then
    echo -e "${GREEN}✓ Pre-built production package found.${NC}"
else
    if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
        echo -e "${YELLOW}[!] Node.js not detected. Installing Node.js LTS...${NC}"
        if command -v apt-get >/dev/null 2>&1; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y -qq nodejs
        elif command -v pacman >/dev/null 2>&1; then
            pacman -Sy --noconfirm nodejs npm
        fi
    fi

    echo -e "${CYAN}Installing dependencies & building Vite bundle...${NC}"
    npm install --silent
    npm run build
fi

# Deploy files to /var/www/html/allsee
echo -e "\n${BLUE}[4/6]${NC} Deploying to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"

# Backup existing config if any
if [ -f "${INSTALL_DIR}/favorites.ini" ]; then
    cp -f "${INSTALL_DIR}/favorites.ini" "/tmp/allsee_favorites.ini.bak"
fi

# Copy dist contents
cp -r "${BUILD_SOURCE}/dist/"* "${INSTALL_DIR}/"

# Ensure api.php is deployed
if [ -f "${BUILD_SOURCE}/public/api.php" ]; then
    cp -f "${BUILD_SOURCE}/public/api.php" "${INSTALL_DIR}/api.php"
fi

# Restore favorites.ini if existed
if [ -f "/tmp/allsee_favorites.ini.bak" ]; then
    cp -f "/tmp/allsee_favorites.ini.bak" "${INSTALL_DIR}/favorites.ini"
    rm -f "/tmp/allsee_favorites.ini.bak"
fi

# Clean up temporary clone if created
if [ -n "${TMP_CLONE:-}" ] && [ -d "${TMP_CLONE:-}" ]; then
    rm -rf "${TMP_CLONE}"
fi

# Permissions and Asterisk Privileges
echo -e "\n${BLUE}[5/6]${NC} Setting Permissions and Asterisk Permissions..."
chown -R "${WEB_USER}:${WEB_USER}" "${INSTALL_DIR}"
chmod -R 755 "${INSTALL_DIR}"

# Setup sudoers rule so web user can execute asterisk commands safely
SUDOERS_FILE="/etc/sudoers.d/allsee"
ASTERISK_BIN="$(command -v asterisk || echo '/usr/sbin/asterisk')"

if [ -f "${ASTERISK_BIN}" ]; then
    echo "${WEB_USER} ALL=(ALL) NOPASSWD: ${ASTERISK_BIN} -rx *" > "${SUDOERS_FILE}"
    chmod 0440 "${SUDOERS_FILE}"
    echo -e "${GREEN}✓ Asterisk CLI permission configured in ${SUDOERS_FILE}${NC}"
fi

# Detect Local Server IP
echo -e "\n${BLUE}[6/6]${NC} Finalizing Installation..."
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "${IP_ADDR}" ]; then
    IP_ADDR="127.0.0.1"
fi

echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD} AllSee Installation Completed Successfully!${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "\nYou can now access AllSee from any web browser at:"
echo -e "  ${CYAN}${BOLD}http://${IP_ADDR}/allsee${NC}"
echo -e "  (or: ${CYAN}http://$(hostname)/allsee${NC})"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  - Uninstall AllSee: ${BOLD}sudo bash ${INSTALL_DIR}/uninstall.sh${NC} (or from repo)"
echo -e "  - Check Asterisk:   ${BOLD}asterisk -rx 'rpt nodes <node>'${NC}\n"
