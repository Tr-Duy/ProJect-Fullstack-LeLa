# Hướng dẫn Cài đặt Git Pre-Commit Hook Bảo Mật

Hook này tự động kiểm tra các thay đổi đang được stage (`git add`) trước mỗi lần commit nhằm:
1. Chặn tuyệt đối việc commit các file dữ liệu bảng `.csv` vào Git repo.
2. Quét và phát hiện các chuỗi mật khẩu viết cứng (`password = "..."`, `DB_PASSWORD = "..."`, `root:...@`).

## 1. Cài đặt trên Linux / macOS / Git Bash
Chạy lệnh sau từ thư mục gốc của repository:
```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 2. Cài đặt trên Windows (PowerShell)
```powershell
Copy-Item scripts/hooks/pre-commit .git/hooks/pre-commit
```

## 3. Nội dung file hook mẫu (`.git/hooks/pre-commit`)
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
