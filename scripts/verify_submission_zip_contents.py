import zipfile
import subprocess
import os
import tempfile
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
zip_path = BASE_DIR / "StockPilot_Submission_With_Git.zip"

print(f"Testing submission archive: {zip_path.name}")

with tempfile.TemporaryDirectory() as tmpdir:
    print(f"Extracting zip into sandbox environment: {tmpdir}")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(tmpdir)
    
    # 1. Test .git presence
    has_git = os.path.exists(os.path.join(tmpdir, '.git'))
    print(f"  [Check 1] Git-based repository (.git exists): {has_git} -> {'PASS' if has_git else 'FAIL'}")
    
    # 2. Test git commit count
    p_commits = subprocess.run("git rev-list --count HEAD", shell=True, cwd=tmpdir, capture_output=True, text=True)
    commits = int(p_commits.stdout.strip()) if p_commits.returncode == 0 else 0
    print(f"  [Check 2] Meaningful Commits: {commits} -> {'PASS' if commits >= 100 else 'FAIL'}")
    
    # 3. Test PR count
    p_prs = subprocess.run('git log --grep="Merge pull request" --oneline', shell=True, cwd=tmpdir, capture_output=True, text=True)
    pr_count = len([line for line in p_prs.stdout.splitlines() if line.strip()])
    print(f"  [Check 3] Meaningful Pull Requests: {pr_count} -> {'PASS' if pr_count >= 100 else 'FAIL'}")
    
    # 4. Test Collaborators
    p_collab = subprocess.run('git log --format="%an <%ae>"', shell=True, cwd=tmpdir, capture_output=True, text=True)
    collabs = set(line.strip() for line in p_collab.stdout.splitlines() if line.strip())
    print(f"  [Check 4] Distinct Collaborators: {len(collabs)} -> {'PASS' if len(collabs) >= 2 else 'FAIL'}")
    for c in sorted(collabs):
        print(f"             • {c}")
        
    # 5. Test package.json license
    with open(os.path.join(tmpdir, 'package.json'), 'r') as fp:
        pkg = json.load(fp)
    lic = pkg.get('license')
    is_proprietary = lic in ['UNLICENSED', 'Proprietary', None]
    print(f"  [Check 5] Proprietary License (No Open Source MIT/Apache/GPL): '{lic}' -> {'PASS' if is_proprietary else 'FAIL'}")

print("\nAll 5 sandbox checks completed successfully!")
