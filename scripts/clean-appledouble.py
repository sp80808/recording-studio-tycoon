#!/usr/bin/env python3
"""
clean-appledouble.py - Fast auto-cleanup for macOS AppleDouble (._*) and .DS_Store files.

Designed specifically for ExFAT and non-HFS/APFS volumes (e.g. /Volumes/Harry)
where macOS automatically spawns AppleDouble companion files on file edits.

Usage:
  python3 scripts/clean-appledouble.py [paths...]
  python3 scripts/clean-appledouble.py --watch [--interval 3]
  python3 scripts/clean-appledouble.py --quiet
  python3 scripts/clean-appledouble.py --install-hook
"""

import argparse
import os
import sys
import time
from pathlib import Path

# Directories that should NEVER be traversed for AppleDouble cleanup to keep speed <100ms
IGNORE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "dist-ssr",
    ".pnpm-store",
    ".idea",
    ".vscode",
    ".dolt",
    "embeddeddolt",
}


def clean_target(target_dir: str, quiet: bool = False) -> int:
    """Recursively deletes AppleDouble (._*) and .DS_Store files while pruning ignored directories."""
    removed = 0
    target_path = Path(target_dir).resolve()
    if not target_path.exists():
        return 0

    for root, dirs, files in os.walk(str(target_path), topdown=True):
        # Prune heavy directories in-place so os.walk never enters them
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file_name in files:
            if file_name.startswith("._") or file_name == ".DS_Store":
                full_path = os.path.join(root, file_name)
                try:
                    os.remove(full_path)
                    removed += 1
                except OSError as e:
                    if not quiet:
                        print(f"Failed to remove {full_path}: {e}", file=sys.stderr)

    if not quiet and removed > 0:
        print(f"🧹 Cleaned {removed} AppleDouble / .DS_Store files in {target_path}")
    return removed


def install_git_hook(repo_dir: str):
    """Installs cleanup trigger into active Git pre-commit hook."""
    repo_path = Path(repo_dir).resolve()
    # Check if core.hooksPath is configured, otherwise fallback to .git/hooks
    hooks_dir = repo_path / ".git" / "hooks"
    beads_hooks = repo_path / ".beads" / "hooks"
    if beads_hooks.exists():
        hooks_dir = beads_hooks

    hooks_dir.mkdir(parents=True, exist_ok=True)
    hook_file = hooks_dir / "pre-commit"

    hook_snippet = """
# Auto-clean AppleDouble and .DS_Store files before committing
if [ -f "$GIT_DIR/../scripts/clean-appledouble.py" ]; then
  python3 "$GIT_DIR/../scripts/clean-appledouble.py" --quiet "$GIT_DIR/.."
elif [ -f "./scripts/clean-appledouble.py" ]; then
  python3 "./scripts/clean-appledouble.py" --quiet .
fi
"""

    existing_content = ""
    if hook_file.exists():
        existing_content = hook_file.read_text(encoding="utf-8")

    if "clean-appledouble.py" not in existing_content:
        with open(hook_file, "a", encoding="utf-8") as f:
            if not existing_content.startswith("#!"):
                f.write("#!/usr/bin/env sh\n")
            f.write(hook_snippet)
        hook_file.chmod(0o755)
        print(f"✅ Pre-commit hook installed in {hook_file}")
    else:
        print(f"ℹ️ Pre-commit hook already present in {hook_file}")


def watch_loop(target_dirs: list[str], interval: float = 3.0):
    """Runs periodic background sweep."""
    print(f"👀 Watching for AppleDouble files every {interval}s (Ctrl+C to stop)...")
    try:
        while True:
            for d in target_dirs:
                clean_target(d, quiet=False)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopped watch mode.")


def main():
    parser = argparse.ArgumentParser(description="Auto-clear macOS AppleDouble (._*) and .DS_Store files")
    parser.add_argument("paths", nargs="*", default=["."], help="Directories to clean (default: current directory)")
    parser.add_argument("--watch", "-w", action="store_true", help="Run continuously in background watch mode")
    parser.add_argument("--interval", "-i", type=float, default=3.0, help="Check interval in seconds for --watch")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress output unless errors occur")
    parser.add_argument("--install-hook", action="store_true", help="Install into Git pre-commit hook")

    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent

    if args.install_hook:
        install_git_hook(str(repo_root))
        return

    targets = args.paths if args.paths else [str(repo_root)]

    if args.watch:
        watch_loop(targets, interval=args.interval)
    else:
        total = 0
        for target in targets:
            total += clean_target(target, quiet=args.quiet)
        if not args.quiet and total == 0:
            print("✨ Directory is clean. No AppleDouble files found.")


if __name__ == "__main__":
    main()
