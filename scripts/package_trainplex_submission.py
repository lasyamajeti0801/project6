"""
StockPilot TrainPlex Submission Packager & Sandbox Validator
Packages the workspace into a clean submission ZIP file containing the full .git history,
and automatically tests the archive in an isolated sandbox.
"""

import os
import sys
import zipfile
import subprocess
import tempfile
import shutil
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Output ZIP paths
DESKTOP_ZIP = Path("C:/Users/BABI/Desktop/stockpilot_trainplex_submission.zip")
WORKSPACE_ZIP = BASE_DIR / "StockPilot_Submission.zip"

EXCLUDE_DIRS = {
    'node_modules', 'dist', 'build', '__pycache__', '.pytest_cache',
    'coverage_html', 'scratch', '.venv', 'venv', 'env'
}

EXCLUDE_FILES = {
    '.coverage', 'coverage.xml', 'db.sqlite3-journal',
    'StockPilot_Submission.zip', 'StockPilot_Submission_With_Git.zip',
    'stockpilot_trainplex_submission.zip'
}

def package_archive(output_path: Path):
    print(f"\n[StockPilot] Creating TrainPlex submission archive at: {output_path}...")
    file_count = 0
    git_file_count = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, dirs, files in os.walk(BASE_DIR):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for f in files:
                if f in EXCLUDE_FILES or f.endswith('.pyc') or f.endswith('.zip') or f.startswith('.env'):
                    continue

                full_path = Path(root) / f
                rel_path = full_path.relative_to(BASE_DIR)

                zf.write(full_path, arcname=str(rel_path).replace('\\', '/'))
                file_count += 1
                total_uncompressed_bytes += full_path.stat().st_size
                if str(rel_path).replace('\\', '/').startswith('.git/'):
                    git_file_count += 1

    size_mb = output_path.stat().st_size / (1024 * 1024)
    raw_mb = total_uncompressed_bytes / (1024 * 1024)
    print(f"[StockPilot] Archive generated successfully:")
    print(f"  • Destination : {output_path}")
    print(f"  • Total files : {file_count:,d} (including {git_file_count:,d} .git internal objects)")
    print(f"  • Raw size    : {raw_mb:.2f} MB")
    print(f"  • Zip size    : {size_mb:.2f} MB")
    return output_path

def validate_archive(zip_path: Path):
    print(f"\n[StockPilot] Executing Phase 7 Sandbox Validation on {zip_path.name}...")
    with tempfile.TemporaryDirectory() as tmpdir:
        sandbox_dir = Path(tmpdir)
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(sandbox_dir)

        # 1. Verify .git exists at root
        git_dir = sandbox_dir / ".git"
        check1 = git_dir.is_dir()
        print(f"  1. Git Directory Detection (.git at root): {'PASS' if check1 else 'FAIL'} (exists={check1})")

        # 2. Verify git rev-parse --is-inside-work-tree
        p_worktree = subprocess.run(
            ["git", "-C", str(sandbox_dir), "rev-parse", "--is-inside-work-tree"],
            capture_output=True, text=True
        )
        is_worktree = p_worktree.stdout.strip() == "true"
        print(f"  2. Git Worktree Verification (is-inside-work-tree): {'PASS' if is_worktree else 'FAIL'} (output='{p_worktree.stdout.strip()}')")

        # 3. Verify Commit count
        p_commits = subprocess.run(
            ["git", "-C", str(sandbox_dir), "rev-list", "--count", "HEAD"],
            capture_output=True, text=True
        )
        commit_count = int(p_commits.stdout.strip()) if p_commits.returncode == 0 else 0
        check3 = commit_count >= 100
        print(f"  3. Meaningful Commits: {'PASS' if check3 else 'FAIL'} ({commit_count:,d} commits detected, required: >= 100)")

        # 4. Verify Pull Requests (merge commits)
        p_prs = subprocess.run(
            ["git", "-C", str(sandbox_dir), "log", "--grep=Merge pull request", "--oneline"],
            capture_output=True, text=True
        )
        pr_count = len([line for line in p_prs.stdout.splitlines() if line.strip()])
        check4 = pr_count >= 100
        print(f"  4. Meaningful Pull Requests: {'PASS' if check4 else 'FAIL'} ({pr_count:,d} PR merges detected, required: >= 100)")

        # 5. Verify Distinct Collaborators
        p_authors = subprocess.run(
            ["git", "-C", str(sandbox_dir), "log", "--format=%an <%ae>"],
            capture_output=True, text=True
        )
        authors = sorted(list(set(line.strip() for line in p_authors.stdout.splitlines() if line.strip())))
        check5 = len(authors) >= 2
        print(f"  5. Distinct Commit Authors: {'PASS' if check5 else 'FAIL'} ({len(authors)} distinct authors detected, required: >= 2)")
        for author in authors:
            print(f"     • {author}")

        # 6. Verify License is Proprietary (UNLICENSED, not MIT/Apache/GPL)
        pkg_file = sandbox_dir / "package.json"
        with open(pkg_file, 'r', encoding='utf-8') as f:
            pkg = json.load(f)
        lic = pkg.get("license")
        check6 = lic in ["UNLICENSED", "Proprietary", None]
        print(f"  6. Proprietary License (No Open Source MIT/Apache/GPL): {'PASS' if check6 else 'FAIL'} (license='{lic}')")

        # 7. Verify Executable Entry Points
        entry_points = ["Dockerfile", "docker-compose.yml", "package.json", "Makefile", "main.py", "app.py"]
        all_entries = all((sandbox_dir / ep).exists() for ep in entry_points)
        print(f"  7. Executable Indicators: {'PASS' if all_entries else 'FAIL'} (all 6 entry points present)")

        all_passed = all([check1, is_worktree, check3, check4, check5, check6, all_entries])
        print(f"\n[StockPilot] Overall Sandbox Test Result: {'ALL 7 CHECKS PASSED' if all_passed else 'SOME CHECKS FAILED'}")
        return all_passed

if __name__ == "__main__":
    # Package to Desktop
    package_archive(DESKTOP_ZIP)
    # Also package copy to workspace root
    package_archive(WORKSPACE_ZIP)
    # Validate the Desktop zip
    validate_archive(DESKTOP_ZIP)
