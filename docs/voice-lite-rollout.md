# Voice: full prompt + flash-lite, 13/11/2026

## Quyết định và phạm vi

Đạt hai điều kiện chất lượng yêu cầu: câu 7 không còn đánh giá bịa sau chuẩn hóa BE; câu 10 chào kết thúc và `isCompleted=true`. Dùng `gemini-flash-lite-latest` cho lượt hội thoại, giữ prompt đầy đủ. Không đưa compact prompt v3, thay đổi TTS hay các tối ưu dang dở trước vào commit này.

Alias lite trong cả 10 phép đo chất lượng được Google trả về là `gemini-3.5-flash-lite`; alias có thể đổi phiên bản về sau. `application.yaml` cấu hình model lượt thoại riêng, fallback và tổng kết mặc định theo model mạnh `gemini-3.5-flash`, cho phép override bằng biến môi trường. Không đổi model toàn cục của các tính năng khác.

## An toàn và hành vi

- BE xóa `grammarCheck`, `suggestedImprovement`, `correctedSentence` và `grammarErrors` khi `offTopic=true` **hoặc** `intentConfidence=LOW`, sau mọi bước điền mặc định/đọc định dạng cũ. Báo cáo không hiện cách nói tự nhiên hơn cho lượt chưa được đánh giá, kể cả dữ liệu cũ còn câu sửa.
- Prompt giữ toàn bộ ngữ cảnh hiện có; thêm quy tắc kết thúc với “That is all”, “No thanks”, “That's it”, “Nothing else”; không mời thêm món. “No sugar please” không phải lời kết thúc. Giải thích ngữ pháp bằng ví dụ đúng như “I like” với “I”.
- Một deadline AI dùng đồng hồ monotonic, tính từ trước tạo prompt: tổng 8s, dành 200ms cho phần trả kết quả; mỗi lần primary tối đa 4s, cần tối thiểu 2,5s. Dành ít nhất 3s cho fallback và 200ms chuyển model; fallback dùng thời gian còn lại trừ 50ms parse. Hủy future khi hết hạn. Đây là ngân sách AI trong lượt, không phải bảo đảm mạng trình duyệt/DB luôn hoàn tất trong 8s.
- Chỉ retry 503 trên lite tối đa một lần, đợi 400ms, khi còn đủ ngân sách thực cho lần thử và fallback. `Retry-After` dài thì bỏ retry. 429, kể cả hết quota ngày, chuyển model ngay; fallback không retry. Bộ đếm attempts/retries/model được trả kèm để kiểm chứng.
- Tổng kết gọi model mạnh sau khi transaction chấm điểm đã commit. Không sửa XP, streak, độ khó. Có cache kết quả theo phiên để tránh gọi lại; lỗi model không làm hỏng báo cáo đã tính. Không có correction thì không gọi model để tránh bịa nhận xét.

## 10 transcript cố định: chất lượng

Chạy tuần tự đúng 10 request, nghỉ 4,5s giữa request, không retry/fallback; cùng bộ transcript đã duyệt, prompt lấy trực tiếp từ builder production. Cả 10 HTTP 200. Bảng dưới dùng response thật được parse và chuẩn hóa bằng policy BE; đây không phải 10 lượt qua endpoint. `intendedUtterance` giữ lỗi ngữ pháp, chỉ sửa nghe nhầm theo ngữ cảnh.

| # | intendedUtterance | Confidence | aiReply | Completed | Gemini ms | Input/output tokens |
|---|---|---|---|---|---:|---:|
| 1 | I would like a hot coffee please | HIGH | One hot coffee, coming up! Would you like anything to eat with your coffee? | False | 1921 | 1380/292 |
| 2 | I would like hot coffee | HIGH | One hot coffee coming up! Would you like anything to eat with that, maybe a pastry? | False | 2338 | 1395/329 |
| 3 | I would like iced latte | HIGH | Sure, an iced latte! Would you like a small, medium, or large? | False | 2137 | 1393/331 |
| 4 | I likes hot coffee | HIGH | One hot coffee coming up! Would you like anything to eat with that? | False | 2142 | 1369/321 |
| 5 | No sugar please | HIGH | Got it, no sugar. Would you like a hot coffee or an iced coffee? | False | 2031 | 1368/311 |
| 6 | Yesterday I buy coffee here | HIGH | Oh, welcome back! What would you like to drink today? | False | 1937 | 1372/332 |
| 7 | purple satellites blarg triangle | LOW | Sorry, I didn't catch that. What would you like to drink? | False | 1808 | 1372/278 |
| 8 | Could you say that again please | HIGH | Sure! I asked, what would you like to drink today? | False | 2106 | 1377/292 |
| 9 | Can I have two cup of tea | HIGH | Sure, two cups of tea! Would you like hot or iced tea? | False | 2596 | 1380/326 |
| 10 | That is all thank you | HIGH | Thank you for visiting LeLa Coffee. Have a wonderful day! | True | 3547 | 1374/321 |

Câu 2 sửa horse → hot; câu 3 sửa eyes → iced. Câu 4 giữ “I likes” trong intended và giải thích đúng: “Với chủ ngữ 'I', chúng ta dùng 'like' thay vì 'likes'. Câu đúng là 'I like hot coffee'.” Câu 6 giữ “buy”, câu 9 giữ “cup” trong intended để đánh giá riêng. Không thấy đổi nghĩa hay lỗi bịa mới trong bộ này. Câu 3 vẫn được model coi ngữ pháp đúng dù gợi ý thêm “an”: khả năng bỏ sót mạo từ còn tồn tại, không coi 10 ca là bảo đảm chất lượng mọi tình huống.

Câu 7: `LOW`, `offTopic=true`, cả bốn trường sửa lỗi rỗng; không còn câu bịa. Câu 10: `isCompleted=true`, không mời thêm món. Bốn biến thể kết thúc có test mock riêng; chỉ biến thể câu 10 trong bảng được gọi Gemini thật.

## 10 lượt qua BE thật: gửi → feedback

Chrome chạy FE thật + BE thật + Gemini thật, mỗi ca tạo phiên cà phê mới ở level 200, gửi đúng transcript trên; nghỉ 4,5s. STT/TTS dùng adapter kiểm thử; không tính thời gian người nói, chờ im lặng 1,2s hay phát hết âm thanh. Mốc cuối là phản hồi AI hiện trên màn hình. Giữ tất cả lượt, kể cả lỗi/dự phòng, không loại để làm đẹp số liệu.

| # | HTTP | Feedback ms | Attempts | Retry | Degraded | Error |
|---|---|---:|---:|---:|---|---|
| 1 | 200 | 2294.6 | 2 | 0 | True | GEMINI_HTTP_429 |
| 2 | 200 | 2420.1 | 1 | 0 | False | - |
| 3 | 200 | 2225.9 | 1 | 0 | False | - |
| 4 | 200 | 2095.6 | 1 | 0 | False | - |
| 5 | 200 | 2242.1 | 1 | 0 | False | - |
| 6 | 200 | 4220.9 | 2 | 1 | False | - |
| 7 | 200 | 2276.0 | 1 | 0 | False | - |
| 8 | 200 | 2146.0 | 1 | 0 | False | - |
| 9 | 200 | 2823.3 | 1 | 0 | False | - |
| 10 | 200 | 2082.5 | 1 | 0 | False | - |

| Group | n | Min ms | Median ms | Max ms |
|---|---:|---:|---:|---:|
| All | 10 | 2082.5 | 2259.1 | 4220.9 |
| No retry | 9 | 2082.5 | 2242.1 | 2823.3 |
| Retry | 1 | 4220.9 | 4220.9 | 4220.9 |
| Non-degraded | 9 | 2082.5 | 2242.1 | 4220.9 |

Median tổng đạt mục tiêu ≤3s trong đợt này; không bảo đảm mọi lượt dưới 3s. Lượt 1 nhận lỗi từ nhà cung cấp rồi fallback model mạnh cũng trả 429, nên là phản hồi dự phòng, **không** phải một lượt Gemini thành công. Lượt 6 retry 503 một lần và thành công trên lite. Câu 7 và 10 qua endpoint thật cũng đạt điều kiện chất lượng.

Hai batch thử ngân sách trước được giữ riêng ở private-results: batch đầu có 2/10 lượt dự phòng; batch với handoff 50ms có 1/10. Batch cuối ở trên chạy sau khi tăng dự phòng chuyển model lên 200ms và giữ tối thiểu 2,5s cho lần primary; không trộn số liệu giữa các cấu hình và không bỏ ca thất bại. Dữ liệu này cho thấy 503 và quota model mạnh vẫn ảnh hưởng độ tin cậy.

Kiểm tra kết thúc phiên thật: endpoint báo cáo thành công nhưng lần gọi model mạnh cho `coachSummary` nhận **429**; `coachSummary=null`, báo cáo điểm/XP vẫn được trả. Chưa xác minh được một tổng kết thành công từ model mạnh bằng key hiện tại; các ca thành công/cache/bảo toàn XP đã được kiểm tra bằng mock. Cần quota khả dụng để fallback/tổng kết mạnh hoạt động thực tế.

## Kiểm chứng và tái lập

- BE package: 412 test, 380 pass, 32 skip, 0 fail/error. Gồm test xóa đánh giá LOW/off-topic, bốn câu kết thúc, deadline/retry/cancel với clock giả, tổng kết ngoài transaction và giữ nguyên XP.
- Chrome StrictMode: 14/14 pass; có kiểm tra nói đủ ý tự gửi, im lặng không gửi, không gửi trùng và native TTS đọc một lần. Bộ đo live riêng gửi đủ 10 request.
- `npx tsc --noEmit`, kiểm tra kiểu test và build FE: pass. WAR đóng gói thành công và backend restart.
- Script: `tests/experiments/voice_lite_probe.py`; fixture: `voice_lite_cases.json`; export/normalize: `VoiceLiteProbeExportTest`; đo qua BE: `LeLa_FE/tests/voice/lite-live.spec.ts` (opt-in `VOICE_LITE_LIVE=1`, server test port 5180).
- Dữ liệu chi tiết, JWT test và phản hồi thô chỉ ở `tests/experiments/private-results`, bị ignore. Không commit audio, manifest, private-results hay key. Kiểm tra key dùng header `x-goog-api-key`, không URL query.

Các tối ưu cũ được giữ riêng bằng backup byte-exact và patch tại `tests/experiments/private-results/pending-latency-before-lite`, dựa trên commit `9686a58`; không áp chúng lên phiên bản mới. Dừng ở thay đổi được duyệt này, chưa làm audio/Phase 2.
