#!/bin/bash
# pg-ramdisk.sh — Run PostgreSQL entirely in RAM (zero disk I/O)
# Usage: ./pg-ramdisk.sh [start|stop|status]
#
# Data is ephemeral — lost when stopped or rebooted.
# Schema is recreated automatically via Prisma on first app start.

set -e

RAMDISK_NAME="pg_ramdisk"
RAMDISK_PATH="/Volumes/${RAMDISK_NAME}"
RAMDISK_SIZE_GB=1  # Adjust based on your data needs (current: ~221MB)
PG_VERSION="18"
PG_DATA="${RAMDISK_PATH}/data"
PG_BIN="/opt/homebrew/bin"

# Calculate sectors (1 sector = 512 bytes)
RAMDISK_SECTORS=$((RAMDISK_SIZE_GB * 1024 * 1024 * 1024 / 512))

case "${1:-start}" in
  start)
    if mount | grep -q "${RAMDISK_PATH}"; then
      echo "✅ RAM disk already mounted at ${RAMDISK_PATH}"
    else
      echo "🧠 Creating ${RAMDISK_SIZE_GB}GB RAM disk..."
      DEVICE=$(hdiutil attach -nomount ram://${RAMDISK_SECTORS})
      diskutil eraseDisk APFS "${RAMDISK_NAME}" ${DEVICE#/dev/} >/dev/null 2>&1 || true
      echo "✅ Mounted at ${RAMDISK_PATH}"
    fi

    if [ -d "${PG_DATA}/base" ]; then
      echo "✅ Data directory already initialized"
    else
      echo "📦 Initializing new PostgreSQL data directory..."
      mkdir -p "${PG_DATA}"
      LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 initdb -D "${PG_DATA}" --locale=en_US.UTF-8 --encoding=UTF-8 >/dev/null 2>&1
      echo "✅ Data directory ready"
    fi

    # Copy over the tuned config + any existing user configs
    cp /opt/homebrew/var/postgresql@${PG_VERSION}/postgresql.conf "${PG_DATA}/postgresql.conf" 2>/dev/null || true
    cp /opt/homebrew/var/postgresql@${PG_VERSION}/pg_hba.conf "${PG_DATA}/pg_hba.conf" 2>/dev/null || true
    cp /opt/homebrew/var/postgresql@${PG_VERSION}/pg_ident.conf "${PG_DATA}/pg_ident.conf" 2>/dev/null || true

    echo "🚀 Starting PostgreSQL on RAM disk..."
    brew services stop "postgresql@${PG_VERSION}" 2>/dev/null || true
    sleep 1
    LC_ALL=en_US.UTF-8 pg_ctl -D "${PG_DATA}" -l "${RAMDISK_PATH}/postgres.log" start -w
    echo "✅ PostgreSQL is running from RAM"
    echo ""
    echo "⚠️  All data is IN-MEMORY ONLY. It will be lost on:"
    echo "   • './pg-ramdisk.sh stop'"
    echo "   • System reboot"
    echo "   • RAM disk unmount"
    ;;

  stop)
    echo "⏹️  Stopping PostgreSQL..."
    pg_ctl -D "${PG_DATA}" stop -m fast 2>/dev/null || true
    brew services start "postgresql@${PG_VERSION}" 2>/dev/null || true
    echo "🧹 Unmounting RAM disk (all data will be lost)..."
    hdiutil detach "${RAMDISK_PATH}" 2>/dev/null && echo "✅ RAM disk ejected" || echo "(not mounted)"
    ;;

  status)
    if mount | grep -q "${RAMDISK_PATH}"; then
      echo "✅ RAM disk mounted at ${RAMDISK_PATH}"
      du -sh "${RAMDISK_PATH}"
      pg_isready -q 2>/dev/null && echo "✅ PostgreSQL is running" || echo "⚠️  PostgreSQL is not running"
    else
      echo "❌ RAM disk not mounted"
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
