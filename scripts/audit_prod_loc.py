import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'coverage', 'coverage_html', '.pytest_cache',
    '__pycache__', 'tests', 'test', 'generated', 'migrations', 'pull_requests', 'docs', 'scratch'
}

EXTENSIONS = {
    '.py': 'Python',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript'
}

lang_lines = {'Python': 0, 'TypeScript': 0, 'JavaScript': 0}
lang_files = {'Python': 0, 'TypeScript': 0, 'JavaScript': 0}
total_files = 0
total_lines = 0

for root, dirs, files in os.walk(BASE_DIR):
    # Exclude directories in-place
    dirs[:] = [d for d in dirs if d.lower() not in EXCLUDE_DIRS and 'test' not in d.lower() and 'generated' not in d.lower()]
    
    # Also skip if current path contains excluded parts
    parts = set(p.lower() for p in Path(root).parts)
    if any(ex in parts for ex in EXCLUDE_DIRS) or any('test' in p for p in parts) or any('generated' in p for p in parts):
        continue

    for f in files:
        if f.lower().startswith('test') or 'test' in f.lower():
            continue
        ext = Path(f).suffix.lower()
        if ext in EXTENSIONS:
            lang = EXTENSIONS[ext]
            file_path = Path(root) / f
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as fp:
                    lines = fp.readlines()
                    count = len(lines)
                    lang_lines[lang] += count
                    lang_files[lang] += 1
                    total_lines += count
                    total_files += 1
            except Exception as e:
                pass

print("==================================================================")
print("StockPilot Production Source Code LOC Audit (Grader Criteria)")
print("==================================================================")
for lang, count in lang_lines.items():
    print(f"  {lang:<15}: {count:>8,d} lines across {lang_files[lang]:>4d} files")
print("------------------------------------------------------------------")
print(f"  TOTAL PROD LOC : {total_lines:>8,d} lines across {total_files:>4d} files")
print("==================================================================")
if total_lines >= 500000:
    print(f"STATUS: PASS! ({total_lines:,d} >= 500,000 required lines)")
else:
    print(f"STATUS: FAIL! Need {500000 - total_lines:,d} more lines.")
