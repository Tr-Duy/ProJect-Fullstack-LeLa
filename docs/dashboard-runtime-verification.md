# Dashboard runtime verification — 2026-11-14

## Kết luận và giới hạn bằng chứng

Dashboard đã hoạt động lại sau khi khởi động lại Vite và tạo lại dependency cache. Người dùng xác nhận trên đúng Chrome profile từng lỗi rằng `/dashboard` hiển thị bình thường sau hai lần F5. Không tái hiện được lỗi `Cannot read properties of null (reading 'useContext')` trong phiên chẩn đoán này, kể cả bằng đúng user có 44 XP, streak hiển thị 1 ngày, và bằng tài khoản thử được sao chép dữ liệu quiz/voice.

**Chưa xác định được stack/component/library gây lỗi ban đầu.** Đã tạm đổi `componentDidCatch` để in `error.stack` cùng `info.componentStack`, nhưng dashboard không phát sinh lỗi để thu stack; log tạm đã được hoàn nguyên. Cache/module graph cũ là giả thuyết phù hợp nhất với diễn biến khôi phục, chưa phải bằng chứng xác định chính xác nguyên nhân ở mức thư viện. Không kết luận hai bản motion là nguyên nhân, hoặc dữ liệu quiz/voice bị lỗi.

## Kiểm tra giả thuyết

| Giả thuyết | Bằng chứng | Kết quả |
| --- | --- | --- |
| a. React trùng hoặc không khớp renderer | `npm ls react react-dom @types/react @types/react-dom react-is --all` exit 0; React/DOM 19.2.7, các consumer `deduped`; tìm thư mục sâu 4 tầng chỉ có một package React runtime | Loại trừ trong cài đặt hiện tại; không có stack/runtime ban đầu để hồi cứu |
| b. Vite dependency cache cũ | Lần khởi động đầu tự re-optimize; sau đó cache được chuyển sang `.auth/dashboard-vite-cache-before`, xác nhận `.vite` không còn, chạy `vite --force`; user xác nhận profile cũ hết lỗi | Hỗ trợ giả thuyết; không có phép đo trước/sau với stack ban đầu |
| c. Package quiz/voice mới kéo thêm React | `git log -p` package/lock: thay đổi dependency gần nhất ở `1540749` thêm framer-motion 14.2.0, canvas-confetti và types; thay đổi quiz/voice gần đây không thêm dependency | Loại trừ package quiz/voice mới trong lịch sử đã kiểm tra |
| d. Widget dashboard thiếu Provider | Kiểm tra `App.tsx`, route/layout và các widget; QueryClientProvider, AuthProvider, BrowserRouter, ConfigProvider đều bao dashboard; learner dashboard không import recharts | Không phát hiện lỗi; user thật và dữ liệu sao chép render được |
| e. Hook ngoài component hoặc hai context khác nhau | Kiểm tra Stagger, Pressable, CountUp, ProgressRing, TodayMilestones, useStreakData và hooks dashboard; motion 12.42.2 có framer-motion 12.43.0 lồng, ngoài ra có framer-motion 14.2.0; cả hai bundle Vite import cùng `./react.js`; peer React hỗ trợ 18/19 | Không có bằng chứng hook sai chỗ hoặc hai React dispatcher trong trạng thái hiện tại |
| f. Chỉ lỗi dev hay cả production | Build/preview cùng backend thật, dùng port 5173 để giữ origin CORS đã được backend cho phép | Xem ma trận xác minh bên dưới |

`@types/react` 19.2.17, `@types/react-dom` 19.2.3. `react-is` 18.3.1 đến từ recharts/rc-component; đây không phải package React renderer thứ hai. Không reinstall hay thay lockfile vì không phát hiện React runtime trùng.

## Dữ liệu và môi trường tái hiện

- Định vị đúng user trong DB local theo tên người dùng cung cấp. Không đổi dữ liệu user thật, không đọc/xuất mật khẩu hoặc email vào báo cáo.
- Snapshot chọn các trường nghiệp vụ: user 44 XP; 1 daily activity ngày 2026-11-13, `voice_session_count=2`, `xp_earned=144`; 1 quiz đã nộp, 5 câu, 2 đúng, 40%, 20 XP; 13 voice sessions có cả COMPLETED/ABANDONED và `overall_score=null`. Sự khác nhau giữa XP lịch sử và XP tổng được giữ nguyên, không sửa nghiệp vụ để che lỗi.
- DB lưu `streak_current=0` ở thời điểm đọc; API/header tính và hiển thị streak 1 ngày. Đã xác nhận trực tiếp screenshot user thật hiển thị **1 ngày, 44 XP**.
- Tạo access token local có hạn 1 giờ cho user thật theo JwtService hiện có, chỉ lưu trong `.auth/` bị gitignore. Không thay mật khẩu hay phiên đăng nhập của user thật.
- Sao chép daily activities, quiz attempt headers và voice session headers sang learner thử, đổi ID công khai/idempotency key, đặt XP 44, streak lưu 1 và cùng exam/level. Không sao chép nội dung hội thoại hoặc câu trả lời riêng tư. Dashboard không đọc các bảng turn/answer đó.
- Thu các JSON API dashboard (profile đã bỏ email, activity/history, SRS, enrollments, voice status, quizzes, subscription, leaderboard), console và ảnh vào `.auth/`. Các API dashboard quan sát được trả HTTP 200. Profile sạch mỗi test: context mới, không có cookie/cache/localStorage ngoài access token thử.

## Thay đổi

- `LeLa_FE/vite.config.ts`: `optimizeDeps.force: true` tạo lại dev dependency graph mỗi lần khởi động; `resolve.dedupe: ['react', 'react-dom']` giữ một React cho renderer và lazy/linked imports. Đây là phòng ngừa cache/runtime identity, không phải chứng minh npm đã cài hai React. Đổi lại có chi phí tối ưu dependency khi khởi động dev.
- `LeLa_FE/tests/e2e/dashboard-runtime.spec.ts`: kiểm tra các vùng dashboard, hai reload, header XP khi được cấu hình, chuyển qua voice/quizzes/decks/my-decks/typing/AI tutor/final-level-tests rồi click Tổng quan; bắt pageerror và React/hook console error, lưu toàn bộ console error và ảnh. Hộp thoại mục tiêu ngày được đóng bằng nút Bỏ qua khi xuất hiện; không bypass UI bằng force-click.
- `LeLa_FE/playwright.dashboard.config.ts`: chạy Chromium và Chrome sạch, hỗ trợ credentials thử hoặc storage state cục bộ.
- Sửa selector lỗi thời trong global setup/login page object/auth/API-failure/learner tests: nhãn mật khẩu khớp chính xác, chữ hoa/thường nút đăng nhập, placeholder và tiêu đề dashboard hiện tại. Không đổi UI hay logic học tập.

## Ma trận xác minh cuối

| Môi trường / dữ liệu | Chromium | Chrome | Reload / điều hướng / React-hook error |
| --- | --- | --- | --- |
| Dev cache mới, user thật 44 XP | PASS (26.3s) | PASS (48.6s) | 2 reload + 7 tuyến và quay về dashboard; 0 lỗi |
| Dev cache mới, learner sao chép | PASS (26.7s) | PASS (55.0s) | 2 reload + 7 tuyến và quay về dashboard; 0 lỗi |
| Production preview, user thật 44 XP | PASS (12.1s) | PASS (19.7s) | 2 reload + 7 tuyến và quay về dashboard; 0 lỗi |
| Production preview, learner sao chép | PASS (15.0s) | PASS (23.0s) | 2 reload + 7 tuyến và quay về dashboard; 0 lỗi |

- Không có Error Boundary ở dashboard hay các trang được kiểm tra. Mỗi trang đích phải render heading riêng (AI Tutor phải có textbox), không chỉ kiểm tra layout chung. Mỗi lần quay về dashboard kiểm tra lại các phần nội dung và header 44 XP trong ma trận dữ liệu thật/sao chép.
- Người dùng xác nhận Chrome profile cũ hết lỗi sau 2 F5. Ảnh Chromium kiểm tra trực quan xác nhận cả dev và preview render đầy đủ với header 1 ngày, 44 XP.
- `npx tsc --noEmit`, `npx tsc -p tsconfig.app.json --noEmit`, `npx tsc -p tests/tsconfig.json --noEmit`: exit 0, 0 lỗi.
- `npm run build`: exit 0; 6,730 modules; 1.76s cho bước Vite. Còn cảnh báo bundle lớn; không có lỗi build.
- E2E chính `npx playwright test --config playwright.config.ts --project chromium --reporter list`: dev **13 pass / 0 fail** (46.4s); preview **13 pass / 0 fail** (35.2s).
- Node tests `node --test tests/speech-recognition.test.mjs tests/speech-recognition-v2.test.mjs`: **2 file pass / 0 fail**, tổng 9 tình huống assertion bên trong.
- Console dashboard dev chỉ có 2 cảnh báo deprecated API của Ant Design Drawer (`width`, `classNames.content/styles.content`); 0 React/hook/page error. Lần thu console riêng trên dashboard production: **0 console error**. Các API dashboard trong snapshot đều HTTP 200.

Các thất bại trong các lượt kiểm tra trước khi ổn định harness: selector đăng nhập/tiêu đề cũ; timeout 30s cho vòng nhiều trang trên Chrome; hộp thoại mục tiêu ngày chặn click; selector “Mục tiêu hôm nay” trùng tiêu đề modal. Đã kiểm tra snapshot/trace rồi sửa test: selector đúng UI, tổng thời hạn 120s, xử lý modal bằng nút Bỏ qua và scope nội dung trong `main`. Không có stack `useContext` trong các thất bại đó. Không tắt assertion để bỏ qua lỗi ứng dụng.

Bằng chứng cục bộ bị gitignore: `.auth/dashboard-data.json`, `.auth/dashboard-api.json` (dev), `.auth/dashboard-api-preview.json`, `.auth/dashboard-real-dev.png`, `.auth/dashboard-real-preview.png`, `.auth/dashboard-npm-ls.log`, `.auth/dashboard-final-build.log`, các thư mục `.auth/final-*-results/.last-run.json`. Không đưa các file này lên Git.

## Chạy lại

Chạy backend local và `npm run dev` trong `LeLa_FE`. Đặt `PLAYWRIGHT_USERNAME`, `PLAYWRIGHT_PASSWORD` bằng credentials learner thử; chạy:

```powershell
npx playwright test --config playwright.dashboard.config.ts
```

Hoặc đặt `PLAYWRIGHT_STORAGE_STATE` đến file local bị gitignore đã chuẩn bị. `DASHBOARD_EXPECT_XP=44` bật kiểm tra header 44 XP cho bộ dữ liệu tái hiện. Không cung cấp credentials thì mặc định dùng `.auth/user.json` đã đăng nhập trước đó. Để kiểm tra production, dừng dev và chạy `npm run build`, `npm run preview -- --port 5173 --strictPort`, rồi chạy cùng test. Không chạy dev/preview cùng cổng một lúc.

Các suite fixture voice/vocabulary và các phép thử gọi AI bên ngoài không nằm trong vòng xác minh này. Snapshot/token/ảnh user thật, audio, manifest và private-results không đưa vào commit.
