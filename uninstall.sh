#!/usr/bin/env bash
# ==============================================================================
# AllSee - AllStarLink Web Controller Uninstaller
# GitHub: https://github.com/s21sim/allsee
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear 2>/dev/null || true

echo -e "${RED}${BOLD}"
echo "  █████  ██      ██      ███████ ███████ ███████ "
echo " ██   ██ ██      ██      ██      ██      ██      "
echo " ███████ ██      ██      ███████ █████   █████   "
echo " ██   ██ ██      ██           ██ ██      ██      "
echo " ██   ██ ███████ ███████ ███████ ███████ ███████ "
echo -e "${NC}"
echo -e "${RED}======================================================${NC}"
echo -e "${BOLD} AllSee - AllStarLink Web Controller Uninstaller${NC}"
echo -e "${RED}======================================================${NC}"

# Check for root / sudo privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This uninstaller must be run as root or with sudo.${NC}"
    echo -e "${YELLOW}Please re-run as:${NC} sudo bash uninstall.sh"
    exit 1
fi

INSTALL_DIRS=(
    "/var/www/html/allsee"
    "/srv/http/allsee"
)

SUDOERS_FILE="/etc/sudoers.d/allsee"

echo -e "\n${YELLOW}Are you sure you want to completely uninstall AllSee from this system? [y/N]${NC} "
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Uninstallation cancelled.${NC}"
    exit 0
fi

echo -e "\n${BLUE}[1/3]${NC} Removing AllSee web application files..."
for dir in "${INSTALL_DIRS[@]}"; do
    if [ -d "$dir" ] || [ -L "$dir" ]; then
        # Check if favorites.ini exists and offer backup
        if [ -f "$dir/favorites.ini" ]; then
            BACKUP_PATH="/root/allsee_favorites_backup_$(date +%Y%m%d_%H%M%S).ini"
            cp "$dir/favorites.ini" "$BACKUP_PATH" 2>/dev/null || true
            echo -e "${GREEN}✓ Favorites saved to ${BACKUP_PATH}${NC}"
        fi
        rm -rf "$dir"
        echo -e "${GREEN}✓ Removed: $dir${NC}"
    fi
done

echo -e "\n${BLUE}[2/3]${NC} Removing sudoers permissions..."
if [ -f "$SUDOERS_FILE" ]; then
    rm -f "$SUDOERS_FILE"
    echo -e "${GREEN}✓ Removed sudoers config: $SUDOERS_FILE${NC}"
fi

echo -e "\n${BLUE}[3/3]${NC} Cleaning up cache..."
sync

echo -e "\n${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD} AllSee has been successfully uninstalled.${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "Your AllStarLink node configuration and Asterisk services remain untouched.\n"
