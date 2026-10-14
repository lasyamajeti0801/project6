.PHONY: all install build start dev test lint clean

all: install build test

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

build:
	cd frontend && npm run build

start:
	python main.py

dev:
	@echo "Starting StockPilot development environment..."
	python backend/manage.py runserver 127.0.0.1:8000 &
	cd frontend && npm run dev

test:
	pytest tests/ --cov=backend

lint:
	cd frontend && npm run lint
	flake8 backend/ || true

clean:
	rm -rf frontend/dist .pytest_cache .coverage htmlcov coverage_html
	find . -type d -name "__pycache__" -exec rm -rf {} +
