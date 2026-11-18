import os
import xml.etree.ElementTree as ET

reports_dir = "LeLa_BE/target/surefire-reports"
skipped_tests = []

for f in os.listdir(reports_dir):
    if f.startswith("TEST-") and f.endswith(".xml"):
        tree = ET.parse(os.path.join(reports_dir, f))
        root = tree.getroot()
        for tc in root.findall("testcase"):
            skipped = tc.find("skipped")
            if skipped is not None:
                classname = tc.get("classname")
                name = tc.get("name")
                msg = skipped.get("message", "")
                skipped_tests.append((classname, name, msg))

print(f"Total skipped tests found: {len(skipped_tests)}")
for c, n, m in sorted(skipped_tests):
    print(f"{c}#{n}: {m}")
