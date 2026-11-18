import subprocess
import re
import sys

# Generic security patterns to detect hardcoded secrets and prohibited files in staged git changes.
# Note: This script contains NO hardcoded secrets.
PATTERNS = [
    re.compile(r"""password\s*[:=]\s*['"][a-zA-Z0-9@#$%^&*_!]{4,}['"]""", re.IGNORECASE),
    re.compile(r"""DB_PASSWORD\s*[:=]\s*['"][^'"]+['"]"""),
    re.compile(r"""root:[^@\s]+@"""),
]

def main():
    try:
        staged_status = subprocess.check_output(['git', 'diff', '--cached', '--name-status'], text=True).splitlines()
    except Exception as e:
        print(f"Error checking staged files: {e}")
        sys.exit(1)

    violations = []
    for entry in staged_status:
        if not entry.strip():
            continue
        parts = entry.split(None, 1)
        status = parts[0]
        f = parts[1]

        # 1. Reject staged CSV files unconditionally
        if f.endswith('.csv'):
            violations.append((f, "Staged CSV file detected! Committing CSV files to git repository is strictly prohibited."))

        # 2. Skip deleted files
        if status.startswith('D'):
            continue

        # 3. Skip checking the hook script itself
        if f == 'scripts/hooks/check_staged_secrets.py':
            continue

        # 4. Scan code and configuration files
        if not (f.endswith('.py') or f.endswith('.java') or f.endswith('.sql') or f.endswith('.js') or f.endswith('.ts') or f.endswith('.yml') or f.endswith('.yaml')):
            continue

        try:
            diff_text = subprocess.check_output(['git', 'diff', '--cached', '--', f], text=True)
            for line in diff_text.splitlines():
                if line.startswith('+') and not line.startswith('+++'):
                    for p in PATTERNS:
                        if p.search(line):
                            violations.append((f, line.strip()))
        except Exception as e:
            print(f"Warning reading diff for {f}: {e}")

    if violations:
        print("FATAL: Security violations detected in staged changes:")
        for v in violations:
            print(" ", v)
        print("Commit aborted by pre-commit hook.")
        sys.exit(1)
    else:
        print("PASS: No hardcoded secrets or prohibited CSV files found in staged changes.")
        sys.exit(0)

if __name__ == '__main__':
    main()
