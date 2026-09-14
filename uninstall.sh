#!/usr/bin/env bash
# ==============================================================================
# AllSee - AllStarLink (ASL) Web Controller Uninstaller
# Completely removes AllSee web files and Asterisk sudo permissions.
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${RED}${BOLD}======================================================${NC}"
echo -e "${RED}${BOLD}        AllSee Uninstaller (AllStarLink Controller)    ${NC}"
echo -e "${RED}${BOLD}======================================================${NC}"

# Root check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] This uninstaller must be run as root.${NC}"
  echo -e "${YELLOW}Please re-run with:${NC} sudo bash $0"
  exit 1
fi

# Confirmation prompt if not forced
FORCE=false
if [ "$1" = "-y" ] || [ "$1" = "--force" ]; then
  FORCE=true
fi

if [ "$FORCE" = false ]; then
  echo -e "${YELLOW}This will completely remove:${NC}"
  echo "  - /var/www/html/allsee directory"
  echo "  - /etc/sudoers.d/allsee permission file"
  echo "  - /usr/local/bin/allsee-uninstall command"
  echo ""
  read -r -p "Are you sure you want to proceed with uninstallation? [y/N]: " response
  case "$response" in
    [yY][eE][sS]|[yY])
      ;;
    *)
      echo -e "${CYAN}Uninstallation cancelled. Nothing was modified.${NC}"
      exit 0
      ;;
  esac
fi

echo -e "\n${CYAN}Removing AllSee files and configurations...${NC}"

# 1. Remove web directory
if [ -d "/var/www/html/allsee" ]; then
  rm -rf /var/www/html/allsee
  echo -e "${GREEN}[✓] Removed /var/www/html/allsee directory.${NC}"
else
  echo -e "    /var/www/html/allsee not found (already removed)."
fi

# 2. Remove sudoers rule
if [ -f "/etc/sudoers.d/allsee" ]; then
  rm -f /etc/sudoers.d/allsee
  echo -e "${GREEN}[✓] Removed /etc/sudoers.d/allsee permissions.${NC}"
fi

# 3. Remove command binary
if [ -f "/usr/local/bin/allsee-uninstall" ]; then
  rm -f /usr/local/bin/allsee-uninstall
  echo -e "${GREEN}[✓] Removed /usr/local/bin/allsee-uninstall.${NC}"
fi

# 4. Reload web server
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload apache2 2>/dev/null || true
  systemctl reload lighttpd 2>/dev/null || true
  systemctl reload nginx 2>/dev/null || true
fi

echo -e "\n${GREEN}${BOLD}AllSee has been completely and cleanly removed from this server.${NC}\n"
