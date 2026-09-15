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
TARBALL_URL="https://github.com/s21sim/allsee/archive/refs/heads/main.tar.gz"
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

echo -e "\n${BLUE}[1/5]${NC} Detecting System Environment & Web Server..."

# Ensure core package installer tools are ready
if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Installing required helper tools (git, curl, tar)...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq || true
        apt-get install -y -qq git curl tar ca-certificates || true
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm git curl tar ca-certificates || true
    elif command -v yum >/dev/null 2>&1; then
        yum install -y -q git curl tar ca-certificates || true
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
        apt-get install -y -qq apache2 php php-cli libapache2-mod-php curl git || true
        systemctl enable apache2 2>/dev/null || true
        systemctl restart apache2 2>/dev/null || true
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm apache php php-apache git curl || true
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
echo -e "\n${BLUE}[2/5]${NC} Fetching AllSee Application Files..."

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
BUILD_SOURCE=""
TMP_CLONE="/tmp/allsee_pkg_$$"

if [ -f "${CURRENT_DIR}/dist/index.html" ] || [ -f "${CURRENT_DIR}/index.html" ]; then
    echo -e "${GREEN}✓ Local AllSee files detected at ${CURRENT_DIR}${NC}"
    BUILD_SOURCE="${CURRENT_DIR}"
else
    rm -rf "${TMP_CLONE}"
    mkdir -p "${TMP_CLONE}"
    
    # Try git first if available
    CLONED=0
    if command -v git >/dev/null 2>&1; then
        echo -e "${CYAN}Cloning AllSee repository via git...${NC}"
        if git clone --depth 1 "${REPO_URL}" "${TMP_CLONE}" 2>/dev/null; then
            CLONED=1
        fi
    fi

    # If git wasn't available or failed, fallback to curl/wget tarball directly from GitHub
    if [ "$CLONED" -eq 0 ]; then
        echo -e "${CYAN}Downloading latest AllSee package archive from GitHub...${NC}"
        if command -v curl >/dev/null 2>&1; then
            curl -sSL "${TARBALL_URL}" | tar -xz -C "${TMP_CLONE}" --strip-components=1
            CLONED=1
        elif command -v wget >/dev/null 2>&1; then
            wget -qO- "${TARBALL_URL}" | tar -xz -C "${TMP_CLONE}" --strip-components=1
            CLONED=1
        fi
    fi

    if [ "$CLONED" -eq 0 ]; then
        echo -e "${RED}[ERROR] Unable to download AllSee from GitHub. Please install git or curl and try again.${NC}"
        exit 1
    fi

    BUILD_SOURCE="${TMP_CLONE}"
fi

# Deploying Files to /var/www/html/allsee
echo -e "\n${BLUE}[3/5]${NC} Installing AllSee to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"

# Backup existing config if any
if [ -f "${INSTALL_DIR}/favorites.ini" ]; then
    cp -f "${INSTALL_DIR}/favorites.ini" "/tmp/allsee_favorites.ini.bak"
fi

# Check if dist/ folder exists in source
if [ -d "${BUILD_SOURCE}/dist" ] && [ -f "${BUILD_SOURCE}/dist/index.html" ]; then
    echo -e "${GREEN}✓ Deploying pre-compiled AllSee production bundle...${NC}"
    cp -r "${BUILD_SOURCE}/dist/"* "${INSTALL_DIR}/"
elif [ -f "${BUILD_SOURCE}/index.html" ] && [ -d "${BUILD_SOURCE}/assets" ]; then
    # Direct pre-built assets
    echo -e "${GREEN}✓ Deploying AllSee assets...${NC}"
    cp -r "${BUILD_SOURCE}/"* "${INSTALL_DIR}/"
else
    # Need to build if node/npm is available
    echo -e "${YELLOW}Pre-built dist not found in repository. Checking for Node.js...${NC}"
    if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
        echo -e "${YELLOW}[!] Node.js not detected. Installing Node.js LTS...${NC}"
        if command -v apt-get >/dev/null 2>&1; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || true
            apt-get install -y -qq nodejs || true
        fi
    fi
    cd "${BUILD_SOURCE}"
    npm install --silent
    npm run build
    cp -r "${BUILD_SOURCE}/dist/"* "${INSTALL_DIR}/"
fi

# Ensure api.php is deployed
if [ -f "${BUILD_SOURCE}/public/api.php" ]; then
    cp -f "${BUILD_SOURCE}/public/api.php" "${INSTALL_DIR}/api.php"
elif [ -f "${BUILD_SOURCE}/api.php" ]; then
    cp -f "${BUILD_SOURCE}/api.php" "${INSTALL_DIR}/api.php"
fi

# Ensure uninstall.sh is in the installation directory
if [ -f "${BUILD_SOURCE}/uninstall.sh" ]; then
    cp -f "${BUILD_SOURCE}/uninstall.sh" "${INSTALL_DIR}/uninstall.sh"
    chmod +x "${INSTALL_DIR}/uninstall.sh"
elif [ -f "${BUILD_SOURCE}/public/uninstall.sh" ]; then
    cp -f "${BUILD_SOURCE}/public/uninstall.sh" "${INSTALL_DIR}/uninstall.sh"
    chmod +x "${INSTALL_DIR}/uninstall.sh"
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
echo -e "\n${BLUE}[4/5]${NC} Setting Web Permissions & Asterisk CLI access..."
chown -R "${WEB_USER}:${WEB_USER}" "${INSTALL_DIR}"
chmod -R 755 "${INSTALL_DIR}"
chmod +x "${INSTALL_DIR}/uninstall.sh" 2>/dev/null || true

# Setup sudoers rule so web user can execute asterisk commands safely
SUDOERS_FILE="/etc/sudoers.d/allsee"
ASTERISK_BIN="$(command -v asterisk || echo '/usr/sbin/asterisk')"

if [ -f "${ASTERISK_BIN}" ]; then
    echo "${WEB_USER} ALL=(ALL) NOPASSWD: ${ASTERISK_BIN} -rx *" > "${SUDOERS_FILE}"
    chmod 0440 "${SUDOERS_FILE}"
    echo -e "${GREEN}✓ Asterisk CLI permission configured in ${SUDOERS_FILE}${NC}"
fi

# Detect Local Server IP
echo -e "\n${BLUE}[5/5]${NC} Finalizing Installation..."
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
