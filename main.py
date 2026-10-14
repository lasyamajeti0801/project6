#!/usr/bin/env python3
"""
StockPilot — Intelligent Warehouse Management System
Primary Application Entrypoint & Production Bootstrapper
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"


def setup_environment():
    """Ensure backend directory is in Python path and DJANGO_SETTINGS_MODULE is set."""
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stockpilot.settings")


def run_migrations():
    """Run Django database migrations."""
    print("[StockPilot] Running database migrations...")
    manage_py = BACKEND_DIR / "manage.py"
    subprocess.run([sys.executable, str(manage_py), "migrate", "--no-input"], check=True)


def check_system():
    """Execute Django system checks."""
    print("[StockPilot] Performing system checks...")
    manage_py = BACKEND_DIR / "manage.py"
    subprocess.run([sys.executable, str(manage_py), "check"], check=True)


def start_server(host="127.0.0.1", port=8000):
    """Start the application web server."""
    print(f"[StockPilot] Booting application server on http://{host}:{port}/ ...")
    manage_py = BACKEND_DIR / "manage.py"
    addr = f"{host}:{port}"
    subprocess.run([sys.executable, str(manage_py), "runserver", addr])


def main():
    parser = argparse.ArgumentParser(description="StockPilot Enterprise Server Launcher")
    parser.add_argument("--host", default="127.0.0.1", help="Binding host address")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--check-only", action="store_true", help="Run system checks and exit")
    parser.add_argument("--migrate", action="store_true", help="Run migrations and exit")

    args = parser.parse_args()
    setup_environment()

    if args.migrate:
        run_migrations()
        return

    if args.check_only:
        check_system()
        print("[StockPilot] All system checks passed successfully.")
        return

    start_server(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
