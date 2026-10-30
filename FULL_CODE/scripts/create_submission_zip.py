"""Builds the submission zip the way the participant guidelines ask: one fresh `git clone` of the committed project, zipped.

Usage (from the repository root, after committing everything):
    python3 FULL_CODE/scripts/create_submission_zip.py [TEAM-000498_B2]
A fresh clone keeps `.git` and leaves out everything ignored (.env, data, node_modules, build output).
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_NAME = "TEAM-000498_B2"


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_NAME
    repo = Path(__file__).resolve().parents[2]
    if subprocess.run(["git", "status", "--porcelain"], cwd=repo, capture_output=True, text=True, check=True).stdout.strip():
        sys.exit("There are uncommitted changes. Commit everything first, because the zip is built from a fresh clone.")
    with tempfile.TemporaryDirectory() as tmp:
        clone = Path(tmp) / name
        subprocess.run(["git", "clone", "--quiet", str(repo), str(clone)], check=True)
        archive = shutil.make_archive(str(repo.parent / name), "zip", root_dir=tmp, base_dir=name)
    print(f"Created {archive}")


if __name__ == "__main__":
    main()
