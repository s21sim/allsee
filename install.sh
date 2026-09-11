#!/usr/bin/env bash
# ==============================================================================
# AllSee - AllStarLink (ASL) Web Controller Installer
# Target directory: /var/www/html/allsee
# Access URL: http://<your-node-ip>/allsee
# ==============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "    AllSee - AllStarLink Node Web Controller Installer   "
echo "=========================================================="
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root (use sudo bash install.sh)${NC}"
    exit 1
fi

TARGET_DIR="/var/www/html/allsee"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_FILE="/etc/sudoers.d/allsee"

# Target directory
TARGET_DIR="/var/www/html/allsee"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_FILE="/etc/sudoers.d/allsee"
GH_USER="${GITHUB_USER:-s21sim}"

# 2. Check and Install Apache2 & PHP if not present
echo -e "${YELLOW}[1/5] Checking Apache & PHP packages...${NC}"
MISSING_PKGS=()
if ! command -v apache2 &> /dev/null && ! command -v httpd &> /dev/null; then
    MISSING_PKGS+=("apache2")
fi
if ! command -v php &> /dev/null; then
    MISSING_PKGS+=("php" "libapache2-mod-php")
fi

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
    echo -e "${CYAN}Installing missing packages: ${MISSING_PKGS[*]}...${NC}"
    apt-get update -y
    apt-get install -y "${MISSING_PKGS[@]}"
fi

# 3. Create Web Directory
mkdir -p "$TARGET_DIR"

# 4. Copy or Download Web Files
echo -e "${YELLOW}[2/5] Deploying web files to ${TARGET_DIR}...${NC}"

# Priority 1: Check local files if cloned via git
if [ -f "$SCRIPT_DIR/allsee/index.html" ] && [ -f "$SCRIPT_DIR/allsee/api.php" ]; then
    cp -v "$SCRIPT_DIR/allsee/index.html" "$TARGET_DIR/"
    cp -v "$SCRIPT_DIR/allsee/api.php" "$TARGET_DIR/"
elif [ -f "$SCRIPT_DIR/index.html" ] && [ -f "$SCRIPT_DIR/api.php" ]; then
    cp -v "$SCRIPT_DIR/index.html" "$TARGET_DIR/"
    cp -v "$SCRIPT_DIR/api.php" "$TARGET_DIR/"
else
    # Priority 2: Remote download from user's GitHub repo (s21sim/allsee)
    echo -e "${CYAN}Downloading latest files from github.com/${GH_USER}/allsee...${NC}"
    
    # Try root level first, then allsee/ subfolder with HTTP 200 check
    DOWNLOAD_SUCCESS=0
    for BASE_URL in \
        "https://raw.githubusercontent.com/${GH_USER}/allsee/main" \
        "https://raw.githubusercontent.com/${GH_USER}/allsee/main/allsee" \
        "https://raw.githubusercontent.com/${GH_USER}/allsee/master" \
        "https://raw.githubusercontent.com/${GH_USER}/allsee/master/allsee"; do
        
        # Test if index.html exists and returns 200 (not 404 text)
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/index.html" || true)
        if [ "$HTTP_STATUS" = "200" ]; then
            echo -e "${GREEN}Found valid repository source at: ${BASE_URL}${NC}"
            curl -sSL "${BASE_URL}/index.html" -o "$TARGET_DIR/index.html"
            curl -sSL "${BASE_URL}/api.php" -o "$TARGET_DIR/api.php"
            DOWNLOAD_SUCCESS=1
            break
        fi
    done

    if [ "$DOWNLOAD_SUCCESS" -ne 1 ]; then
        echo -e "${RED}[ERROR] Could not fetch valid index.html from https://github.com/${GH_USER}/allsee.${NC}"
        echo -e "${YELLOW}Please ensure you have pushed index.html and api.php to your repository.${NC}"
        exit 1
    fi
fi

# Verify deployed files exist
if [ ! -f "$TARGET_DIR/index.html" ] || [ ! -f "$TARGET_DIR/api.php" ]; then
    echo -e "${RED}[ERROR] Failed to place index.html or api.php in ${TARGET_DIR}.${NC}"
    exit 1
fi
echo -e "${GREEN}Files deployed successfully.${NC}"

# 5. Configure Sudoers for www-data (Asterisk CLI execution)
echo -e "${YELLOW}[4/6] Configuring Sudoers permissions for www-data...${NC}"

# Find Asterisk executable
AST_PATH="/usr/sbin/asterisk"
if [ ! -f "$AST_PATH" ]; then
    AST_PATH="/usr/bin/asterisk"
fi

cat << 'EOF' > "$SUDOERS_FILE"
# AllSee AllStarLink Web Controller Sudoers rule
# Allows web server user (www-data) to run asterisk commands without password
www-data ALL=(ALL) NOPASSWD: /usr/sbin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /usr/bin/asterisk -rx *
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart asterisk
www-data ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart asterisk
EOF

chmod 0440 "$SUDOERS_FILE"

# Validate sudoers syntax
if command -v visudo &> /dev/null; then
    if ! visudo -cf "$SUDOERS_FILE"; then
        echo -e "${RED}[ERROR] Sudoers file syntax check failed! Removing bad file.${NC}"
        rm -f "$SUDOERS_FILE"
        exit 1
    fi
fi
echo -e "${GREEN}Sudoers rule configured in ${SUDOERS_FILE}.${NC}"

# Optional: Add www-data to asterisk group if it exists
if getent group asterisk >/dev/null 2>&1; then
    usermod -a -G asterisk www-data 2>/dev/null || true
    echo -e "${GREEN}Added www-data to asterisk group.${NC}"
fi

# 6. Set File Ownership and Permissions
echo -e "${YELLOW}[5/6] Setting directory ownership and permissions...${NC}"
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"

# Ensure Apache service is enabled and active
if command -v systemctl &> /dev/null; then
    systemctl enable apache2 2>/dev/null || true
    systemctl restart apache2 2>/dev/null || true
elif [ -f /etc/init.d/apache2 ]; then
    /etc/init.d/apache2 restart 2>/dev/null || true
fi

# 7. Test Asterisk Accessibility
echo -e "${YELLOW}[6/6] Verifying Asterisk CLI status...${NC}"
if command -v asterisk &> /dev/null || [ -x /usr/sbin/asterisk ]; then
    AST_VER=$(sudo -u www-data sudo "$AST_PATH" -rx "core show version" 2>/dev/null || true)
    if [ -n "$AST_VER" ]; then
        echo -e "${GREEN}Asterisk is active and accessible: ${AST_VER:0:45}...${NC}"
    else
        echo -e "${YELLOW}[NOTE] Asterisk service might be stopped or starting. Sudoers is properly configured.${NC}"
    fi
else
    echo -e "${YELLOW}[WARNING] Asterisk binary not found. Please ensure AllStarLink / Asterisk is installed.${NC}"
fi

# Detect Local IP Address
NODE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$NODE_IP" ]; then
    NODE_IP=$(ip -4 addr show scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
fi
if [ -z "$NODE_IP" ]; then
    NODE_IP="<your-node-ip>"
fi

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}    AllSee Web Controller Successfully Installed! 🎉    ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo ""
echo -e "Open the app in your browser at:"
echo -e "  ${CYAN}${BOLD}http://${NODE_IP}/allsee${NC}"
echo ""
echo -e "Features ready to use:"
echo -e "  - Local & Target Node control"
echo -e "  - Connect (*3), Monitor (*2), Disconnect (*1), Disconnect All (*76)"
echo -e "  - Check Status (*70) & List Nodes (rpt nodes)"
echo -e "  - Live Asterisk CLI Console output"
echo ""
