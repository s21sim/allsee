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

# Display header banner
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
TARBALL_URL="https://github.com/s21sim/allsee/archive/refs/heads/main.tar.gz"
RELEASE_TGZ_URL="https://raw.githubusercontent.com/s21sim/allsee/main/release/allsee-release.tar.gz"
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

echo -e "\n${BLUE}[1/4]${NC} Detecting System Environment & Web Server..."

# Ensure core package installer tools are ready
if ! command -v curl >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Installing essential helper tools (curl, tar)...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq || true
        apt-get install -y -qq curl tar ca-certificates || true
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm curl tar ca-certificates || true
    elif command -v yum >/dev/null 2>&1; then
        yum install -y -q curl tar ca-certificates || true
    fi
fi

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
        apt-get update -qq || true
        apt-get install -y -qq apache2 php php-cli libapache2-mod-php curl || true
        systemctl enable apache2 2>/dev/null || true
        systemctl restart apache2 2>/dev/null || true
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm apache php php-apache curl || true
        systemctl enable httpd 2>/dev/null || true
        systemctl restart httpd 2>/dev/null || true
    fi
fi

# Install PHP if not present (needed for Asterisk AMI / CLI bridge)
if ! command -v php >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Installing PHP runtime...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq || true
        apt-get install -y -qq php-cli php || true
    fi
fi

echo -e "${GREEN}✓ Web server environment verified.${NC}"

# Preparation of files
echo -e "\n${BLUE}[2/4]${NC} Deploying AllSee Application..."
mkdir -p "${INSTALL_DIR}"

# Backup existing config if any
if [ -f "${INSTALL_DIR}/favorites.ini" ]; then
    cp -f "${INSTALL_DIR}/favorites.ini" "/tmp/allsee_favorites.ini.bak" 2>/dev/null || true
fi

DEPLOYED=0
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Method A: Local dist/ or release package
if [ -d "${CURRENT_DIR}/dist" ] && [ -f "${CURRENT_DIR}/dist/index.html" ]; then
    echo -e "${GREEN}✓ Installing from local build (${CURRENT_DIR}/dist)...${NC}"
    cp -r "${CURRENT_DIR}/dist/"* "${INSTALL_DIR}/"
    DEPLOYED=1
elif [ -f "${CURRENT_DIR}/release/allsee-release.tar.gz" ]; then
    echo -e "${GREEN}✓ Extracting local release bundle...${NC}"
    tar -xzf "${CURRENT_DIR}/release/allsee-release.tar.gz" -C "${INSTALL_DIR}/"
    DEPLOYED=1
elif [ -f "${CURRENT_DIR}/index.html" ] && [ -d "${CURRENT_DIR}/assets" ]; then
    echo -e "${GREEN}✓ Installing from current directory assets...${NC}"
    cp -r "${CURRENT_DIR}/"* "${INSTALL_DIR}/"
    DEPLOYED=1
fi

# Method B: Fetch pre-built fast package from GitHub (No Node.js compilation required!)
if [ "$DEPLOYED" -eq 0 ]; then
    echo -e "${CYAN}Downloading pre-built AllSee release from GitHub...${NC}"
    if curl -sSL -f "${RELEASE_TGZ_URL}" | tar -xz -C "${INSTALL_DIR}/" 2>/dev/null; then
        echo -e "${GREEN}✓ Downloaded and extracted pre-compiled AllSee package.${NC}"
        DEPLOYED=1
    fi
fi

# Method C: If archive wasn't found, try clone or tarball
if [ "$DEPLOYED" -eq 0 ]; then
    TMP_CLONE="/tmp/allsee_pkg_$$"
    rm -rf "${TMP_CLONE}"
    mkdir -p "${TMP_CLONE}"

    echo -e "${YELLOW}Fetching repository archive...${NC}"
    if command -v git >/dev/null 2>&1 && git clone --depth 1 "${REPO_URL}" "${TMP_CLONE}" 2>/dev/null; then
        :
    elif curl -sSL "${TARBALL_URL}" | tar -xz -C "${TMP_CLONE}" --strip-components=1 2>/dev/null; then
        :
    fi

    if [ -f "${TMP_CLONE}/release/allsee-release.tar.gz" ]; then
        tar -xzf "${TMP_CLONE}/release/allsee-release.tar.gz" -C "${INSTALL_DIR}/"
        DEPLOYED=1
    elif [ -d "${TMP_CLONE}/dist" ] && [ -f "${TMP_CLONE}/dist/index.html" ]; then
        cp -r "${TMP_CLONE}/dist/"* "${INSTALL_DIR}/"
        DEPLOYED=1
    fi
    rm -rf "${TMP_CLONE}"
fi

# Verify core files exist in target
if [ ! -f "${INSTALL_DIR}/index.html" ]; then
    echo -e "${RED}[ERROR] Installation files could not be found or downloaded.${NC}"
    echo -e "${YELLOW}Please ensure your server has internet access or clone the repository with release package.${NC}"
    exit 1
fi

# Ensure api.php is deployed
if [ ! -f "${INSTALL_DIR}/api.php" ]; then
    if [ -f "${CURRENT_DIR}/public/api.php" ]; then
        cp -f "${CURRENT_DIR}/public/api.php" "${INSTALL_DIR}/api.php"
    elif [ -f "${CURRENT_DIR}/api.php" ]; then
        cp -f "${CURRENT_DIR}/api.php" "${INSTALL_DIR}/api.php"
    fi
fi

# Ensure uninstall.sh is in place
if [ ! -f "${INSTALL_DIR}/uninstall.sh" ]; then
    if [ -f "${CURRENT_DIR}/uninstall.sh" ]; then
        cp -f "${CURRENT_DIR}/uninstall.sh" "${INSTALL_DIR}/uninstall.sh"
    elif [ -f "${CURRENT_DIR}/public/uninstall.sh" ]; then
        cp -f "${CURRENT_DIR}/public/uninstall.sh" "${INSTALL_DIR}/uninstall.sh"
    fi
fi
chmod +x "${INSTALL_DIR}/uninstall.sh" 2>/dev/null || true

# Restore favorites.ini if it existed
if [ -f "/tmp/allsee_favorites.ini.bak" ]; then
    cp -f "/tmp/allsee_favorites.ini.bak" "${INSTALL_DIR}/favorites.ini"
    rm -f "/tmp/allsee_favorites.ini.bak"
fi

# Permissions and Asterisk Privileges
echo -e "\n${BLUE}[3/4]${NC} Setting Web Permissions & Asterisk CLI access..."
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
echo -e "\n${BLUE}[4/4]${NC} Finalizing Installation..."
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "${IP_ADDR}" ]; then
    IP_ADDR="127.0.0.1"
fi

echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD} AllSee Installation Completed Successfully!${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "\nYou can now open AllSee from your browser at:"
echo -e "  ${CYAN}${BOLD}http://${IP_ADDR}/allsee${NC}"
echo -e "  (or: ${CYAN}http://$(hostname)/allsee${NC})"
echo -e "\n${YELLOW}Management commands:${NC}"
echo -e "  - Uninstall AllSee: ${BOLD}sudo bash ${INSTALL_DIR}/uninstall.sh${NC}"
echo -e "  - Check Asterisk:   ${BOLD}asterisk -rx 'rpt nodes <node>'${NC}\n"
