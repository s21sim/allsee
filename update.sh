#!/usr/bin/env bash
# ==============================================================================
# AllSee v2.0 - One-Line Updater Script
# Update AllSee without reinstalling from scratch or losing configuration!
# Command: curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/update.sh | sudo bash
# Shortcut: sudo allsee-update
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
echo "          AllSee v2.0 - One-Line Safe Updater             "
echo "=========================================================="
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root. Use: sudo bash update.sh${NC}"
    exit 1
fi

TARGET_DIR="/var/www/html/allsee"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GH_USER="${GITHUB_USER:-s21sim}"
SUDOERS_FILE="/etc/sudoers.d/allsee"

mkdir -p "$TARGET_DIR"

echo -e "${YELLOW}[1/4] Preserving user configuration and favorites...${NC}"
# Backup existing files safely
BACKUP_DIR="${TARGET_DIR}/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "$TARGET_DIR/index.html" ]; then
    cp "$TARGET_DIR/index.html" "$BACKUP_DIR/index.html.bak"
fi
if [ -f "$TARGET_DIR/api.php" ]; then
    cp "$TARGET_DIR/api.php" "$BACKUP_DIR/api.php.bak"
fi
echo -e "${GREEN}Created backup snapshot in ${BACKUP_DIR}.${NC}"

echo -e "${YELLOW}[2/4] Downloading latest AllSee v2.0 release...${NC}"

# Download from GitHub repo
DOWNLOAD_SUCCESS=0
for BASE_URL in \
    "https://raw.githubusercontent.com/${GH_USER}/allsee/main" \
    "https://raw.githubusercontent.com/${GH_USER}/allsee/main/allsee" \
    "https://raw.githubusercontent.com/${GH_USER}/allsee/master" \
    "https://raw.githubusercontent.com/${GH_USER}/allsee/master/allsee"; do

    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/index.html" || true)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}Fetching updates from: ${BASE_URL}${NC}"
        curl -sSL "${BASE_URL}/index.html" -o "$TARGET_DIR/index.html"
        curl -sSL "${BASE_URL}/api.php" -o "$TARGET_DIR/api.php"
        DOWNLOAD_SUCCESS=1
        break
    fi
done

# If remote download fails, check local script directory
if [ "$DOWNLOAD_SUCCESS" -ne 1 ]; then
    if [ -f "$SCRIPT_DIR/allsee/index.html" ] && [ -f "$SCRIPT_DIR/allsee/api.php" ]; then
        echo -e "${GREEN}Copying local release files...${NC}"
        cp "$SCRIPT_DIR/allsee/index.html" "$TARGET_DIR/"
        cp "$SCRIPT_DIR/allsee/api.php" "$TARGET_DIR/"
        DOWNLOAD_SUCCESS=1
    elif [ -f "$SCRIPT_DIR/index.html" ] && [ -f "$SCRIPT_DIR/api.php" ]; then
        echo -e "${GREEN}Copying local release files...${NC}"
        cp "$SCRIPT_DIR/index.html" "$TARGET_DIR/"
        cp "$SCRIPT_DIR/api.php" "$TARGET_DIR/"
        DOWNLOAD_SUCCESS=1
    fi
fi

if [ "$DOWNLOAD_SUCCESS" -ne 1 ]; then
    echo -e "${RED}[ERROR] Could not fetch latest release. Your previous files remain intact.${NC}"
    exit 1
fi

echo -e "${YELLOW}[3/4] Updating sudoers permissions & system CLI helper...${NC}"

# Ensure Sudoers has all permissions
cat << 'EOF' > "$SUDOERS_FILE"
# AllSee v2.0 - Asterisk CLI & Service Control Permissions
www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /usr/bin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart asterisk
www-data ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart asterisk
EOF
chmod 0440 "$SUDOERS_FILE"

# Install shortcut command /usr/local/bin/allsee-update
cat << 'EOF' > /usr/local/bin/allsee-update
#!/usr/bin/env bash
curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/update.sh | sudo bash
EOF
chmod +x /usr/local/bin/allsee-update

echo -e "${YELLOW}[4/4] Setting file permissions and reloading services...${NC}"
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

if command -v systemctl &> /dev/null; then
    systemctl reload apache2 2>/dev/null || systemctl restart apache2 2>/dev/null || true
fi

NODE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$NODE_IP" ]; then
    NODE_IP="<your-node-ip>"
fi

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}       AllSee Successfully Updated to Latest Version! 🚀   ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo ""
echo -e "Access URL: ${CYAN}http://${NODE_IP}/allsee${NC}"
echo -e "Future one-click update: ${YELLOW}sudo allsee-update${NC}"
echo ""
