import os
import re

def search_repo():
    patterns = [
        re.compile(r"""(part_of_speech|partOfSpeech|pos)\s*===?\s*['"](noun|adjective)['"]""", re.IGNORECASE),
        re.compile(r"""['"](noun|adjective)['"]\s*===?\s*(part_of_speech|partOfSpeech|pos)""", re.IGNORECASE),
        re.compile(r"""\.(equals|equalsIgnoreCase)\(\s*['"](noun|adjective)['"]\s*\)""", re.IGNORECASE),
        re.compile(r"""case\s+['"](noun|adjective)['"]\s*:""", re.IGNORECASE),
        re.compile(r"""==\s*['"](noun|adjective)['"]""", re.IGNORECASE),
    ]

    folders = ['LeLa_BE', 'LeLa_FE', 'LeLa_Mobile']
    total_found = 0

    for folder in folders:
        if not os.path.exists(folder):
            continue
        print(f"Scanning {folder}...")
        for root, dirs, files in os.walk(folder):
            if any(skip in root for skip in ['node_modules', '.git', 'target', '.idea', 'build', '.gradle']):
                continue
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in ['.java', '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.sql', '.dart', '.kt']:
                    path = os.path.join(root, f)
                    try:
                        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                            for idx, line in enumerate(fp, 1):
                                for p in patterns:
                                    if p.search(line):
                                        print(f"MATCH: {path}:{idx}: {line.strip()}")
                                        total_found += 1
                                        break
                    except Exception as e:
                        pass
    print(f"\nTotal matches found: {total_found}")

if __name__ == '__main__':
    search_repo()
