#!/usr/bin/env python3
"""
StockPilot Codebase Metric & Line-of-Code Measurement Script
Accurately categorizes and reports:
- Production Backend (Python / Django)
- Backend Test Suites
- Production Frontend (TypeScript / React / CSS)
- Architecture, Documentation & Config
Excludes dependencies, build outputs, and caches.
"""

import os
import sys

EXCLUDE_DIRS = {
    'node_modules',
    'dist',
    'build',
    '.git',
    '.gemini',
    '__pycache__',
    'migrations',
    '.venv',
    'venv',
    '.idea',
    '.vscode'
}

EXTENSIONS = {
    '.py': 'Python',
    '.ts': 'TypeScript',
    '.tsx': 'React TSX',
    '.css': 'CSS',
    '.html': 'HTML',
    '.json': 'JSON Config',
    '.md': 'Markdown / Docs',
}

def analyze_directory(base_dir):
    stats = {
        'backend_production': {'files': 0, 'lines': 0, 'blank': 0, 'comment': 0},
        'backend_tests': {'files': 0, 'lines': 0, 'blank': 0, 'comment': 0},
        'frontend_production': {'files': 0, 'lines': 0, 'blank': 0, 'comment': 0},
        'documentation_and_config': {'files': 0, 'lines': 0, 'blank': 0, 'comment': 0},
    }

    file_breakdown = []

    for root, dirs, files in os.walk(base_dir):
        # Exclude directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        rel_root = os.path.relpath(root, base_dir)

        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in EXTENSIONS:
                continue

            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, base_dir)

            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
            except Exception:
                continue

            total_lines = len(lines)
            blank_lines = sum(1 for line in lines if not line.strip())
            comment_lines = sum(1 for line in lines if line.strip().startswith(('#', '//', '/*', '*')))
            code_lines = total_lines - blank_lines - comment_lines

            # Determine category
            category = 'documentation_and_config'
            if ext == '.md' or ext == '.json':
                category = 'documentation_and_config'
            elif 'backend' in rel_path.replace('\\', '/').split('/'):
                if 'test' in filename.lower():
                    category = 'backend_tests'
                else:
                    category = 'backend_production'
            elif 'frontend' in rel_path.replace('\\', '/').split('/'):
                category = 'frontend_production'

            stats[category]['files'] += 1
            stats[category]['lines'] += total_lines
            stats[category]['blank'] += blank_lines
            stats[category]['comment'] += comment_lines

            file_breakdown.append({
                'path': rel_path,
                'category': category,
                'total': total_lines,
                'code': code_lines,
                'blank': blank_lines,
                'comments': comment_lines,
            })

    return stats, file_breakdown

def main():
    workspace_dir = os.path.abspath(os.path.dirname(__file__))
    print("=" * 72)
    print(" STOCKPILOT — CODEBASE METRICS & AUDIT REPORT")
    print(f" Target Directory: {workspace_dir}")
    print("=" * 72)

    stats, breakdown = analyze_directory(workspace_dir)

    total_files = sum(s['files'] for s in stats.values())
    total_lines = sum(s['lines'] for s in stats.values())
    total_blank = sum(s['blank'] for s in stats.values())
    total_comments = sum(s['comment'] for s in stats.values())
    total_pure_code = total_lines - total_blank - total_comments

    print(f"\n{'Category':<32} | {'Files':>6} | {'Total Lines':>12} | {'Code Lines':>12} | {'Comments':>10}")
    print("-" * 72)
    for cat_name, data in stats.items():
        pure = data['lines'] - data['blank'] - data['comment']
        display_name = cat_name.replace('_', ' ').title()
        print(f"{display_name:<32} | {data['files']:>6} | {data['lines']:>12,d} | {pure:>12,d} | {data['comment']:>10,d}")

    print("-" * 72)
    print(f"{'GRAND TOTAL':<32} | {total_files:>6} | {total_lines:>12,d} | {total_pure_code:>12,d} | {total_comments:>10,d}")
    print("=" * 72)
    print(f"Audited on: Python 3.12 (Asia/Kolkata)")
    print("=" * 72)

if __name__ == '__main__':
    main()
