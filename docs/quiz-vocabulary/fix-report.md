# Sửa XP, lọc dữ liệu và đa dạng quiz — 14/11/2026

## Kết quả

Hai dạng mới đã cộng XP thật vào profile/daily activity và lưu streak, vẫn dùng `DailyLearningActivityService.logActivity`. Điểm và API các dạng quiz cũ được giữ; có test riêng xác nhận quiz chỉ có dạng cũ không đi vào nhánh thưởng mới. Không backfill 330 XP của tài khoản audit cũ.

### Bước 1 — XP và streak

- Lỗi gốc: `QuizAttemptServiceImpl.submit` chỉ đặt `attempt.xpAwarded`; không gọi `logActivity`. Luồng Voice/SRS dùng `logActivity` để cập nhật daily activity, tổng XP và SSE.
- Thêm `VocabularyQuizRewards` gọi đúng service đó trong transaction nộp bài, sau khi đã xác nhận chưa submit. State của attempt được khóa; `submittedAt`, XP, activity và streak commit/rollback cùng nhau. Không thêm bảng hoặc endpoint XP riêng.
- Lưu `streak_current`, `streak_longest`, `last_activity_date` cho bài mới. Phiên có tương tác hoặc hết thời gian thật vẫn ghi quiz activity kể cả award=0. Thoát chưa làm gì không nhận XP.
- Web invalidate/refetch `profile`, `auth/me`, daily activity hôm nay/lịch sử và lịch sử quiz sau nộp. Test header quan sát XP/streak đổi 0→1. Mobile refresh profile ở kết quả hai dạng mới.
- Voice fixture regression: **14 pass / 1 skip / 0 fail**; baseline pre-change test is opt-in. Initial run lacked the fixture server; rerun with Vite on 127.0.0.1:5180 passed. No live AI calls. Log: `LeLa_FE/vocabulary-voice-regression.log`.
- Bài trộn giữ trọng số/điểm câu cũ, kết hợp phần thưởng cấu hình cho câu mới và nộp một lần. Pure legacy quiz giữ cách chấm và `xp_awarded` trước thay đổi.

### Bước 2 — Cân bằng XP

Bảng này đã báo trong hội thoại trước khi đổi mức thưởng:

| Hoạt động | Trước | Sau |
|---|---|---|
| Quiz cũ | 10 XP/câu đúng trong attempt | Giữ nguyên |
| Chọn nghĩa mới | 10 XP/câu, tối đa 200/20 câu; mẫu audit 10 câu =100 | 1 XP/câu; bài 20 câu =20 |
| Ghép cặp mới | 10 XP/cặp, tối đa 200/20 cặp | 2 XP/cặp; bài 20 cặp =40 |
| Voice | min(lượt×2,20) + round(điểm/10) + min(từ đúng×3,15), tối đa 45 | Giữ công thức; dùng số dư XP ngày chung |
| SRS | Rating 1/2/3/4: 2/5/10/15 XP | Không đổi |
| Typing | 2×từ + 5×stage +20 khi thắng; trần module 150/ngày | Không đổi |

XP bài mới = min(XP thô, trần attempt, số dư ngày). `QUIZ_XP_PER_MEANING=1`, `QUIZ_XP_PER_PAIR=2`, `QUIZ_MAX_XP_PER_ATTEMPT=40`. Trần ngày dùng `app.voice.daily-xp-cap`, cấu hình bằng `DAILY_XP_CAP=150`.

`DailyXpBudget` đọc `daily_learning_activities.xp_earned` dưới khóa user và daily row. Voice và quiz từ vựng cùng dùng số dư này; không còn chỉ đếm riêng các phiên Voice. Đây là trần cấp thưởng của Voice/quiz mới, không phải thay đổi trần của mọi module khác. Thưởng achievement và cách SRS/typing ghi XP giữ nguyên; những nguồn đó vẫn được tính vào số dư khi cấp XP cho Voice/quiz mới.

Test near-cap đã tách bonus achievement đầu tiên của Voice (100 XP) bằng tiền điều kiện “đã sở hữu badge”, để kiểm chứng chính xác 149→150. Không sửa logic thưởng achievement chung.

### Bước 3 — Lọc nguồn

Không cập nhật flashcards/decks. Cùng một `VocabularyGenerator.inspect` được dùng khi sinh bài và khi xuất CSV:

- Bỏ placeholder, thiếu cấp độ/nghĩa, ký tự/định dạng từ không hợp lệ, hậu tố POS rác, nghĩa lẫn mục từ Anh, POS không hợp lệ.
- Đối chiếu POS cột với `POS:` trong note hoặc POS đầu hint khi nguồn khai báo rõ. Bỏ dấu hiệu nghĩa danh từ “Sự/Việc/Người…” ở thẻ v/adj/adv.
- Quy tắc rà soát các ca đã biết: Appeal, Target, File, Inventory, Regardless, Regularly, Relatively; thêm adequate và Investigative phát hiện ở lượt API sau sửa. Giữ biến thể có POS/nghĩa hợp lệ; không tự sửa hoặc bịa bản dịch.
- Thiếu đủ số từ/cặp sau lọc trả lỗi tiếng Việt nêu số có/số cần; không lấp bằng từ hoặc nghĩa giả.

Kết quả DB thật: **3151 thẻ nguồn → 860 từ phân biệt được giữ, 2291 thẻ bị loại**. Phân bố từ được giữ sau khử trùng toàn kho: {"1": 334, "2": 228, "3": 181, "4": 117}. Đây là phân bố tập toàn kho; một truy vấn riêng cấp độ có thể giữ biến thể khác của cùng từ.

| Lý do | Số thẻ có lý do |
|---|---:|
| DUPLICATE_ENGLISH | 218 |
| ENGLISH_IN_VIETNAMESE_MEANING | 1978 |
| GARBAGE_POS_SUFFIX | 7 |
| INVALID_ENGLISH_TEXT | 42 |
| KNOWN_MEANING_REVIEW | 2 |
| KNOWN_POS_MEANING_REVIEW | 9 |
| MISSING_LEVEL | 165 |
| NOUN_MEANING_WITH_NON_NOUN_POS | 4 |
| PLACEHOLDER_MEANING | 1971 |
| SOURCE_POS_METADATA_CONFLICT | 141 |

Một thẻ có thể có nhiều lý do. CSV chỉ ở máy, **không commit**:

- `tests/experiments/private-results/vocabulary-fix-20261114/verified/rejected-vocabulary.csv`: 2291 dòng, có ID, từ, nghĩa, POS hiện tại/POS nguồn, level và mã lý do.
- `.../verified/known-pos-review.csv`: 13 dòng cho nhóm từ đã biết, gồm cả biến thể hợp lệ để người dùng đối chiếu trước khi sửa DB.
- `.../verified/filter-summary.json`: số liệu bộ lọc.

Tái xuất: chạy `mvnw.cmd -Dtest=VocabularyDataExportTest -Dvocabulary.audit.dir=<thư-mục-riêng> test`.

### Bước 4 — Đa dạng lựa chọn

- Mỗi câu xáo lại nguồn nhiễu, ưu tiên cùng POS, bắt buộc cùng level. Trong một attempt không tái dùng cùng nhóm bốn lựa chọn hoặc cùng bộ ba nhiễu; nếu không thể tạo đủ thì báo thiếu nguồn.
- Ghép cặp xáo hai cột độc lập; nếu bốn cặp đều trùng hàng thì xáo lại cột phải, có bước xoay bảo đảm thoát trường hợp vẫn trùng hoàn toàn.
- Unit test chạy nhiều bài sinh ngẫu nhiên, kiểm tra hai tập signature và tình huống bốn cặp ban đầu cùng hàng.

### Bước 5 — API thật sau restart cuối

WAR đã rebuild, tắt devtools restart. Dừng PID 10776, xác nhận 8080 đóng, khởi động PID **11800**. WAR SHA256 `5CCBA1394991CE9F568CD19C8F702AEC770F84635C7F9B70045D8CE00F5EEC26`. Backend bản này còn chạy ở 8080.

Tài khoản thử **177** mới, chưa học deck; gọi API thật, không fixture, không chỉnh thời gian DB. **183 request HTTP200**, không lỗi HTTP. Các lần chạy trước cũng được giữ trong private-results, không chọn lại riêng các câu đẹp.

| Mốc | users.xp_total | streak_current | last_activity_date | daily xp_earned | daily quiz_count |
|---|---:|---:|---|---:|---:|
| Trước | 0 | 0 | NULL | 0 | 0 |
| Đúng 20 câu nghĩa + nộp lại 2 lần | 20 | 1 | 2026-11-14 | 20 | 1 |
| Ghép đủ 20 cặp + nộp lại 2 lần | 60 | 1 | 2026-11-14 | 60 | 2 |
| Thoát sau 2 cặp, rồi nộp lại | 64 | 1 | 2026-11-14 | 64 | 3 |
| Sau các bài đưa XP tới trần | 150 | 1 | 2026-11-14 | 150 | 6 |
| Làm thêm 1 câu đúng, nhận 0 XP; nộp lại 2 lần | 150 | 1 | 2026-11-14 | 150 | 7 |

Các bài thêm gần trần lần lượt nhận **40, 40, 6 XP**. Nộp lặp không đổi XP, streak, daily count hay version attempt. Streak 7→8 khi chạm trần được kiểm chứng bằng integration test, không bằng thay đổi ngày hệ thống ở API thật.

Checksum các trường nguồn đã kiểm (ID, từ, nghĩa, POS, related_words, level, deck_code) trước/sau giống nhau: `e025d52d34052267e9fd7b74dc321e0856be7f87b9298c93ce8ac4c56448d742`. Bộ lọc không ghi DB từ vựng gốc; API chỉ tạo tài khoản và dữ liệu học thử.

## 10 câu đầu của bài nghĩa thật

Đáp án đúng in đậm, lựa chọn giữ thứ tự API. Cờ REVIEW là nhận xét ngôn ngữ cần biên tập; không phải khẳng định bộ lọc đã chứng minh toàn bộ kho sạch.

| # | Nghĩa | Lựa chọn API | Level/POS đáp án | Đánh giá |
|---|---|---|---|---|
| 1 | kèn xắc-xô-phôn | **Saxophone** · Layout · Inquiry · Submission | 1 / n | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 2 | Tương đương, bằng nhau | **Equivalent** · Exact · General · Forgetful | 3 / adj | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 3 | Sưu tầm | Alternate · **Collect** · Admit · Emphasize | 4 / v | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 4 | Người giám sát | Shipper · Asset · **Supervisor** · Exploration | 2 / n | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 5 | cẩm nang / tờ gấp giới thiệu | Bellhop · **Brochure** · Code · Customs | 1 / n | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 6 | Đòi | Preclude · **Claim** · Validate · Assist | 3 / v | REVIEW nghĩa quá ngắn: “Đòi” chưa nêu đối tượng/ngữ cảnh. |
| 7 | Đường giới hạn, hạn chót | Comfort · Automation · **Deadline** · Level | 2 / n | REVIEW: “Đường giới hạn” trong nghĩa Deadline cần biên tập; “hạn chót” rõ hơn. |
| 8 | Nguồn, nguồn gốc | **Source** · Balance · Priority · Accounting | 2 / n | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |
| 9 | Thay đổi, biến đổi | Warn · Benefit · **Vary** · Looked to | 1 / v | REVIEW: Looked to là dạng biến tố/cụm cần ngữ cảnh; không phải hậu tố rác. |
| 10 | giả định, sự cho rằng | **assumption** · Returns · Charge · Fluctuation | 2 / n | Không thấy placeholder/hậu tố rác/nhóm lặp trong mẫu. |

Toàn bài 20 câu có **20 nhóm bốn lựa chọn và 20 bộ ba nhiễu phân biệt**. Không thấy placeholder/hậu tố POS rác trong mẫu; metadata đáp án/nhiễu lấy từ nguồn đã qua lọc, chưa thẩm định từ điển từng mục trong toàn kho.

## 5 màn ghép cặp thật

Bảng là mapping đáp án từ snapshot server để đối chiếu. Hai cột xáo và ID thực nằm trong `matching-5.json` của log riêng.

| Màn | Bốn cặp từ–nghĩa | Cặp đúng cùng hàng sau xáo | Đánh giá |
|---|---|---:|---|
| 1 | Thorough ↔ Kỹ lưỡng, thấu đáo; Alternate ↔ Thay phiên; Scrutinize ↔ Nhìn kỹ, chăm chú; Conditional ↔ Có điều kiện | 2/4 | Không thấy lỗi cấu trúc trong mẫu. |
| 2 | Raise ↔ Sự tăng lương; Reserve ↔ Để dành; Enterprise ↔ Công trình, dự án lớn; Accommodation ↔ Sự thích nghi, chỗ ở | 1/4 | Accommodation/Enterprise có nhiều nghĩa; bản dịch khá rộng, cần ngữ cảnh khi biên tập. |
| 3 | Joint ↔ Nối, gia nhập, chung; Advertisement ↔ bài quảng cáo; Occur ↔ Xảy ra, xuất hiện; Perceive ↔ Nhận thấy, nhận biết | 0/4 | REVIEW rõ: Joint chứa “Nối, gia nhập, chung”; “nối/gia nhập” dễ lẫn với Join. Không tự đổi nghĩa DB. |
| 4 | Charge ↔ Phí tổn; Saxophone ↔ kèn xắc-xô-phôn; Deduction ↔ khoản khấu trừ lương; Range ↔ Phạm vi | 0/4 | Không thấy lỗi cấu trúc trong mẫu. |
| 5 | Practice ↔ Sự thực hành, thói quen; Restriction ↔ Hạn chế, giới hạn; Period ↔ Giai đoạn, thời kỳ; System ↔ Hệ thống | 2/4 | Không thấy lỗi cấu trúc trong mẫu. |

20 từ khác nhau giữa màn, bốn nghĩa phân biệt mỗi màn; không màn nào có cả bốn cặp cùng hàng. Các cờ ngôn ngữ còn lại được giữ nguyên để duyệt nguồn, không tự bịa sửa nghĩa.

## Kiểm tra và giới hạn

- BE: **442 test = 409 pass / 33 skip / 0 fail / 0 error**. Lượt cuối có bật export bằng `-Dvocabulary.audit.dir=.../verified`.
- Web: **10/10 pass**, gồm test refetch XP/streak header và hồi quy ba dạng cũ. `npx tsc --noEmit`, `npm run build` pass.
- Node unit runner: **2/2 file pass** (speech recognition).
- E2E web mặc định đã thử bằng tài khoản test riêng nhưng **bị chặn ở global setup**, chưa chạy các ca: `tests/globalSetup.ts:34` dùng selector mật khẩu khớp cả input và nút “Hiện mật khẩu”, gây strict-mode violation. Không sửa test đăng nhập ngoài phạm vi này. Log local `LeLa_FE/vocabulary-full-e2e.log`; không khẳng định toàn bộ E2E web pass.
- Mobile: **11/11 pass**, `npx tsc --noEmit`, Android Hermes export pass. Lint toàn mobile còn baseline **62 lỗi/72 cảnh báo** như trước lượt sửa; không mở rộng sang các module cũ.
- Không thay ngữ pháp, prompt, AI model, quota thoại hoặc các sửa voice đang dang dở ngoài file finalizer XP. Không thêm migration.
- Chưa thử thiết bị thật, APK/iOS ký số, SSE trên mạng thật, submit đồng thời/stress hoặc đua cập nhật với SRS/typing. Các test/API submit lặp ở trên là tuần tự.
- Trần mới chỉ kiểm soát cấp thưởng Voice/quiz từ vựng. Các nguồn khác và bonus achievement vẫn theo hành vi cũ; không khẳng định toàn hệ thống mọi nguồn XP luôn dưới 150.
- Dữ liệu nguồn vẫn cần biên tập thủ công; ngoài placeholder/POS/hậu tố, còn nghĩa quá rộng, biến tố hoặc lẫn từ như các cờ trong mẫu. Không coi 860 từ sau lọc là kho đã được chuyên gia thẩm định toàn bộ.
- Không backfill XP audit 330 trước đây. Không commit credential, log riêng, CSV hay private-results. Dừng để người dùng duyệt sau commit/push.

## Bằng chứng riêng và file sửa

Thư mục `tests/experiments/private-results/vocabulary-fix-20261114/verified/`: `http.jsonl` đã bỏ payload/token đăng nhập; `live-summary.json`, `meaning-10.json`, `meaning-20.json`, `matching-5.json`, `meaning-full-and-retries.json`, `matching-full-and-retries.json`, `partial-exit.json`, `daily-cap-and-zero-xp-activity.json`, `db-attempts.json`, `restart.json`, hai CSV và `filter-summary.json`.

Các file chính: `VocabularyQuizRewards`, `DailyXpBudget`, repository daily activity; `QuizAttemptServiceImpl`; `TimedQuizEngine/Properties`, `VocabularyGenerator/Repository`; `VoiceSessionFinalizer`; `application.yaml`; test BE (generator/integration/export/Voice); component quiz web và fixture/test header; mobile `QuizResultScreen`; memory và báo cáo này.

Đối chiếu hai trường hợp tìm thêm ở lượt đầu: [adequate](https://dictionary.cambridge.org/dictionary/english/adequate), [investigative](https://dictionary.cambridge.org/dictionary/english/investigative). Các phiên bản log trước lọc bổ sung vẫn nằm ở thư mục cha và `final/`.
