# Hướng dẫn Cài đặt Git Pre-Commit Hook Bảo Mật

Hook này tự động kiểm tra các thay đổi đang được stage (`git add`) trước mỗi lần commit nhằm:
1. Chặn tuyệt đối việc commit các file dữ liệu bảng `.csv` vào Git repo.
2. Quét và phát hiện các chuỗi mật khẩu viết cứng trong các file code, kịch bản, tài liệu và cấu hình (`.py`, `.java`, `.sql`, `.js`, `.ts`, `.yml`, `.yaml`, `.mjs`, `.md`, `.json`, `.env`, `.properties`, `.sh`, `.ps1`, `.txt`).

## 1. Kích hoạt hook thông qua `core.hooksPath` (Khuyên dùng)
Chạy lệnh sau từ thư mục gốc của repository:
```bash
git config core.hooksPath scripts/hooks
```

Lệnh trên trỏ trực tiếp Git sang thư mục `scripts/hooks` trong repo, dùng chung cho cả Windows (Git Bash/PowerShell) và Linux/macOS.

## 2. Hoặc cài đặt thủ công vào `.git/hooks/`

### Trên Linux / macOS / Git Bash:
```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Trên Windows (PowerShell):
```powershell
Copy-Item scripts/hooks/pre-commit .git/hooks/pre-commit
```

## 3. Nội dung file hook (`scripts/hooks/pre-commit`)
```sh
#!/bin/sh
python scripts/hooks/check_staged_secrets.py
STATUS=$?
if [ $STATUS -ne 0 ]; then
  echo "Commit bi chan boi pre-commit security hook (phat hien mat khau hoac file CSV)."
  exit 1
fi
exit 0
```
