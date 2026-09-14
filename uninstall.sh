#!/usr/bin/env bash
# ==============================================================================
# AllSee v2.0 - Clean Uninstaller Script
# Command: curl -sSL https://raw.githubusercontent.com/s21sim/allsee/main/uninstall.sh | sudo bash
# Shortcut: sudo allsee-uninstall
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root. Use: sudo bash uninstall.sh${NC}"
    exit 1
fi

TARGET_DIR="/var/www/html/allsee"
SUDOERS_FILE="/etc/sudoers.d/allsee"

echo -e "${CYAN}${BOLD}==========================================================${NC}"
echo -e "${CYAN}${BOLD}       AllSee - Web Controller Clean Uninstaller          ${NC}"
echo -e "${CYAN}${BOLD}==========================================================${NC}"

# Ask confirmation if interactive
if [ -t 0 ] && [ "$1" != "-y" ] && [ "$1" != "--yes" ]; then
    read -p "Are you sure you want to completely uninstall AllSee from this system? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Uninstallation cancelled.${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}[1/4] Removing web files from ${TARGET_DIR}...${NC}"
if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo -e "${GREEN}Removed ${TARGET_DIR}.${NC}"
fi

echo -e "${YELLOW}[2/4] Removing sudoers rules for www-data...${NC}"
if [ -f "$SUDOERS_FILE" ]; then
    rm -f "$SUDOERS_FILE"
    echo -e "${GREEN}Removed ${SUDOERS_FILE}.${NC}"
fi

echo -e "${YELLOW}[3/4] Removing system helper shortcuts...${NC}"
rm -f /usr/local/bin/allsee-update /usr/bin/allsee-update 2>/dev/null || true
rm -f /usr/local/bin/allsee-uninstall /usr/bin/allsee-uninstall 2>/dev/null || true
echo -e "${GREEN}Removed CLI shortcuts.${NC}"

echo -e "${YELLOW}[4/4] Reloading Apache web server...${NC}"
if command -v systemctl &> /dev/null; then
    systemctl reload apache2 2>/dev/null || systemctl restart apache2 2>/dev/null || true
elif [ -f /etc/init.d/apache2 ]; then
    /etc/init.d/apache2 reload 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}    AllSee has been successfully uninstalled! 🧹           ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "Your Asterisk and AllStarLink configurations remain completely untouched."
echo ""
