# Simple deploy Makefile
# Usage: make <target>

APP_DIR := /var/www/goshuin-site
SERVICE_NAME := goshuin-app
DB_PATH := db/goshuin.sqlite3
BACKUP_DIR := backups

.PHONY: build backup-db deploy install-service enable-service restart logs

build:
	npm run build

backup-db:
	@if [ -f "$(DB_PATH)" ]; then \
		mkdir -p $(BACKUP_DIR); \
		cp $(DB_PATH) $(BACKUP_DIR)/goshuin.sqlite3.$$(date +"%Y%m%d_%H%M%S"); \
		echo "DB backed up to $(BACKUP_DIR)"; \
	else \
		echo "No DB found at $(DB_PATH)"; \
	fi

deploy: build backup-db
	@./scripts/deploy.sh

install-service:
	@echo "Installing systemd service (requires sudo)"
	sudo cp contrib/goshuin-app.service /etc/systemd/system/$(SERVICE_NAME).service
	sudo systemctl daemon-reload

enable-service: install-service
	@echo "Enabling and starting service"
	sudo systemctl enable --now $(SERVICE_NAME).service

restart:
	sudo systemctl restart $(SERVICE_NAME).service

logs:
	journalctl -u $(SERVICE_NAME).service -f
