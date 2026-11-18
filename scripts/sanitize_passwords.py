import os

for f in os.listdir('scripts'):
    if f.endswith('.py'):
        p = os.path.join('scripts', f)
        with open(p, 'r', encoding='utf-8') as fp:
            content = fp.read()
        if "os.environ.get('DB_PASSWORD', '')" in content:
            new_content = content.replace("os.environ.get('DB_PASSWORD', '')", "os.environ.get('DB_PASSWORD', '')")
            # Avoid duplicate os.environ.get
            new_content = new_content.replace("os.environ.get('DB_PASSWORD', '')", "os.environ.get('DB_PASSWORD', '')")
            with open(p, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            print(f"Sanitized {p}")
