#!/usr/bin/env bash
# ==============================================================================
# AllSee - AllStarLink (ASL) Web Controller Installer
# Target directory: /var/www/html/allsee
# Access URL: http://<your-node-ip>/allsee
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "    AllSee - AllStarLink Node Web Controller Installer   "
echo "=========================================================="
echo -e "${NC}"

# Check Root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root (use sudo bash install.sh)${NC}"
    exit 1
fi

TARGET_DIR="/var/www/html/allsee"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_FILE="/etc/sudoers.d/allsee"

# 1. Install Apache2 & PHP if not present
echo -e "${YELLOW}[1/5] Checking Apache & PHP packages...${NC}"
MISSING_PKGS=()
if ! command -v apache2 &> /dev/null && ! command -v httpd &> /dev/null; then
    MISSING_PKGS+=("apache2")
fi
if ! command -v php &> /dev/null; then
    MISSING_PKGS+=("php" "libapache2-mod-php")
fi

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
    echo -e "${CYAN}Installing packages: ${MISSING_PKGS[*]}...${NC}"
    apt-get update -y
    apt-get install -y "${MISSING_PKGS[@]}"
fi

# 2. Create Target Directory
mkdir -p "$TARGET_DIR"

# 3. Deploy Web Files
echo -e "${YELLOW}[2/5] Deploying web files to ${TARGET_DIR}...${NC}"
if [ -f "$SCRIPT_DIR/allsee/index.html" ] && [ -f "$SCRIPT_DIR/allsee/api.php" ]; then
    cp -v "$SCRIPT_DIR/allsee/index.html" "$TARGET_DIR/"
    cp -v "$SCRIPT_DIR/allsee/api.php" "$TARGET_DIR/"
elif [ -f "$SCRIPT_DIR/index.html" ] && [ -f "$SCRIPT_DIR/api.php" ]; then
    cp -v "$SCRIPT_DIR/index.html" "$TARGET_DIR/"
    cp -v "$SCRIPT_DIR/api.php" "$TARGET_DIR/"
else
    GITHUB_RAW_URL="${ALLSEE_REPO_RAW:-https://raw.githubusercontent.com/ssniloy-bd/allsee/main/allsee}"
    curl -sSL "${GITHUB_RAW_URL}/index.html" -o "$TARGET_DIR/index.html"
    curl -sSL "${GITHUB_RAW_URL}/api.php" -o "$TARGET_DIR/api.php"
fi

# 4. Configure Sudoers for Asterisk CLI
echo -e "${YELLOW}[3/5] Configuring Sudoers permissions for www-data...${NC}"
cat << 'EOF' > "$SUDOERS_FILE"
# AllSee AllStarLink Web Controller Sudoers rule
www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /usr/bin/asterisk -rx *
EOF
chmod 0440 "$SUDOERS_FILE"

if command -v visudo &> /dev/null; then
    visudo -cf "$SUDOERS_FILE"
fi

# Add www-data to asterisk group if exists
if getent group asterisk >/dev/null 2>&1; then
    usermod -a -G asterisk www-data 2>/dev/null || true
fi

# 5. Set Permissions & Restart Web Server
echo -e "${YELLOW}[4/5] Setting file permissions...${NC}"
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

if command -v systemctl &> /dev/null; then
    systemctl enable apache2 2>/dev/null || true
    systemctl restart apache2 2>/dev/null || true
fi

# 6. Detect IP
NODE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$NODE_IP" ] && NODE_IP="<your-node-ip>"

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}    AllSee Web Controller Successfully Installed! 🎉    ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo ""
echo -e "Access your AllStarLink Web Controller at:"
echo -e "  ${CYAN}${BOLD}http://${NODE_IP}/allsee${NC}"
echo ""