# Phase 0.3 — Đề xuất thiết kế, chưa triển khai

Ngày 13/11/2026. Cơ sở là audit Phase 0.1 và [báo cáo thử nghiệm](voice-phase-0.2-experiments.md). Chưa thể khẳng định audio Gemini tốt hơn Web Speech trên giọng Việt vì thiếu 5 bản thu; Flash TTS đã dùng được nhưng riêng HTTP thêm 2,9–4,1 giây. Thiết kế dưới đây giữ push-to-talk làm hướng chính có điều kiện, với text/browser speech làm phương án khi audio hoặc quota không đáp ứng.

## Trải nghiệm mỗi phiên

- Mặc định push-to-talk: bấm để bắt đầu, bấm lần nữa để gửi; có thể hỗ trợ giữ để nói. Hiện trạng thái rõ `Sẵn sàng → Đang thu → Đang gửi → AI xử lý → AI nói`. Nút hủy/xóa thu âm trước khi gửi; không tự gửi theo ngưỡng im lặng ở chế độ này.
- FE `MediaRecorder`, dò `isTypeSupported`, ưu tiên WebM/Opus trên trình duyệt phù hợp; Safari dùng định dạng được hỗ trợ. BE kiểm tra MIME/magic bytes/duration/size, chuyển định dạng chỉ nếu cần. Giới hạn đề xuất ban đầu **20 giây/5MB mỗi lượt**, chưa phải cấu hình đã triển khai; kiểm thử lại với mẫu thật.
- Mic tắt khi phát TTS, chống echo, có nút dừng/replay và trạng thái khi playback bị browser chặn. Không kết thúc phiên bằng đệm cố định 2 giây; chờ onend hoặc người học chủ động hoàn thành.
- AI nhận **audio gốc**, trả transcript nguyên văn riêng với câu sửa. Không dùng transcript đã sửa ngữ pháp để đánh giá lời nói ban đầu. Người học có thể đánh dấu “máy nghe sai”; giữ nguyên bản raw và lưu bản xác nhận, chạy lại đánh giá có phiên bản nếu cần.
- Một dòng phản hồi dễ hiểu mỗi lượt: ví dụ “Bạn đã gọi món rõ; thử thêm a trước coffee.” Bấm mở thẻ có câu gốc, câu sửa, giải thích ngắn, bằng chứng phát âm nếu có. Chỉ nói “nhận xét phát âm” khi đã nghe audio; text fallback chỉ hiện mẹo luyện, không tạo điểm phát âm.
- Đúng **3 gợi ý trả lời**: dễ/vừa/thử thách, gắn câu hỏi và level hiện tại. Sinh trong cùng response để tránh thêm 3 request; chỉ đọc câu AI, không đọc toàn bộ feedback. Gợi ý là tùy chọn, có theo dõi mức hỗ trợ để giải thích kết quả.
- Tổng kết: mục tiêu đã đạt/chưa đạt, hai trục điểm, 2–3 lỗi cần ôn và các thẻ flashcard nháp để lưu vào deck riêng “Lỗi hội thoại”. Người học chọn lưu; có chống trùng và sửa trước khi lưu, không tự công khai câu riêng tư.

## Hai trục chấm và XP

**Hoàn thành mục tiêu (0–100):** scenario có checklist mục tiêu có trọng số tổng 100, ví dụ gọi món 40, kích cỡ 30, lịch sự/xác nhận 30. Mỗi mục phải có USER turn evidence; không lấy lời ASSISTANT làm bằng chứng hoàn thành. Nếu thiếu dữ liệu thì chưa đánh giá, không tự cho 0.

**Chất lượng (0–100 hoặc null):** rubric đề xuất grammar 40%, dùng từ phù hợp 30%, dễ hiểu/phát âm có audio evidence 30%. Thiếu bằng chứng audio thì pronunciation=null; hiển thị điểm chất lượng văn bản riêng với coverage, không so trực tiếp với điểm đủ cả ba thành phần. Đánh giá nghe hiểu, không phạt giọng Việt chỉ vì khác native. Giai đoạn đầu cần người thật hiệu chỉnh rubric và độ nhất quán giữa 3 lần đo trước khi dùng để tăng level. Tách mục tiêu và chất lượng; hoàn thành mục tiêu vẫn có thể mắc lỗi.

**XP cố định theo phiên đủ điều kiện:** đề xuất 20 XP/phiên, trần 100 XP voice/ngày Việt Nam (giá trị chờ duyệt; production hiện 150/ngày). Đủ điều kiện đề xuất >=3 USER turn hợp lệ đã tham gia; không dựa vào điểm model/từ AI. `award = min(sessionXp, max(0, dailyCap - awardedToday))`. Trần có thể làm phiên cuối nhận ít hơn 20; UI ghi rõ. Retry/replay/finish lặp không cộng thêm. Khóa/quy tắc ledger phải chống hai phiên finish đồng thời vượt trần.

**Bỏ hoàn toàn bonus vocabulary dựa trên `turns.size()`** trong rubric mới; không chuyển sang thưởng theo số ASSISTANT hay theo tổng lượt. Kết quả cũ giữ scoring_version=legacy, không tính lại XP hay level. Daily activity và voice_session_count phải được ghi cho phiên đủ điều kiện kể cả cap đã hết, XP=0; sửa isPersistedActivityActive chỉ là điều kiện đọc, **chưa sửa được đường finalizer hiện chỉ log activity khi có XP**. Đưa sửa đường ghi này vào Phase 1 với test finish khi hết cap. Phân biệt hoạt động học với tiền thưởng.

## Luồng BE và ngân sách thời gian

Nhận audio multipart → xác thực owner và idempotency → ghi trạng thái xử lý → gọi Gemini ngoài transaction DB dài → validate JSON schema → lưu USER/ASSISTANT và evaluation nhất quán → trả kết quả → TTS tùy chọn. Không giữ DB lock/connection trong suốt chờ audio AI. FE disable double submit, BE là nơi bảo đảm idempotency thật.

Timeout **5 giây** hiện tại không đủ làm mặc định cho audio. Chưa có latency audio để chốt giá trị; cấu hình thử nghiệm có thể dùng 30 giây/model, 45 giây tổng audio turn, TTS ngân sách riêng 10 giây, client/gateway lớn hơn tổng deadline cộng upload. Đây là **giá trị khởi đầu để đo**, không phải SLA. Chọn lại theo median/max của 15 request và thêm tập lớn đo p95 trước release. Hủy future/request khi quá hạn; trả lỗi rõ để retry cùng ID, không sinh nhiều lượt âm thầm. 429 ngày không retry; 429 phút/5xx chỉ retry có Retry-After và deadline. Không để fallback chỉ còn 2–3 giây do primary tiêu hết ngân sách.

Đích trải nghiệm đề xuất: thời gian từ bấm gửi tới hiện feedback median <=5s, p95 <=10s; playback onset phải đo riêng. Nếu audio+server TTS tuần tự vượt mục tiêu, hiện text/feedback ngay và browser TTS mặc định; server TTS có nút nghe hoặc cache theo reply/voice/model. Chưa đủ số liệu để tuyên bố chi phí quá đắt; ngân sách phải do số liệu audio/context/billing thật quyết định. Cấu hình audio=false/text fallback khi quota không đáp ứng; text mode không được giả vờ đã chấm phát âm.

**Một nguồn cấu hình:** BE typed configuration làm nguồn chuẩn; `/status` hoặc `/config` trả `configVersion`, mode, audio MIME/size/duration, các deadline công khai, TTS rate, XP/cap và threshold cho tùy chọn auto mode. Sinh FE TypeScript types từ OpenAPI và kiểm tra contract CI. Tách `autoCommitSilenceMs` (1200), `incompleteExtraMs` (800) khỏi `hintAfterSilenceMs` (8000); 8s gợi ý không thay thế autocommit. Snapshot config/scoring/prompt version lúc start để một phiên không đổi luật giữa chừng. Không đưa key hoặc timeout nội bộ nhạy cảm ra client.

## Đề xuất DB (migration mới, chưa viết SQL)

| Đối tượng | Thêm/đổi | Quy tắc |
|---|---|---|
| `conversation_sessions` | `input_mode`, `config_version`, `scoring_version`, `prompt_version`, `goal_completion_score`, `quality_score`, `quality_coverage`, `summary_json` | Cột mới nullable cho legacy; score CHECK 0–100; version quyết định cách hiển thị |
| `conversation_turns` | `source`, `confirmed_transcript`, `evaluation_json`, `feedback_line`, `suggestions_json`, `model_id` | Dùng `transcript` hiện có cho bản raw; JSON schema versioned, 3 suggestion; role phân biệt USER/ASSISTANT |
| `conversation_audio_attempts` mới | `id`, `session_id`, `client_turn_id`, `request_hash`, `status`, `user_turn_id`, `assistant_turn_id`, `error_code`, `audio_bytes`, `mime_type`, `duration_ms`, `request_bytes`, `upload_ms`, `ai_ms`, `tts_ms`, usage theo modality/thinking, `model_id`, timestamps | UNIQUE(session_id, client_turn_id); hash khác cùng ID →409; pending/complete/failed rõ; không giữ raw body/key |
| `conversation_goal_results` mới | `session_id`, `goal_code`, `weight`, `achieved`, `evidence_user_turn_id`, `rubric_version` | UNIQUE(session_id, goal_code), FK; kiểm tra evidence thuộc cùng session và role USER |
| `conversation_corrections` mới | `user_turn_id`, `kind`, `original_text`, `corrected_text`, `explanation`, `audio_evidence_json`, `fingerprint` | Mẫu câu ngắn; không biến nhận xét chưa chắc chắn thành fact; FK ownership theo session |
| `conversation_correction_cards` mới | `user_id`, `correction_id`, `flashcard_id` | UNIQUE(user_id, correction_id), fingerprint theo user để chống trùng cùng lỗi; tích hợp flashcards/decks/cardprogress hiện có |
| `conversation_xp_awards` mới | `session_id`, `user_id`, `activity_date`, `rule_version`, `awarded_xp` | UNIQUE(session_id); khóa daily aggregate/user khi finish; XP/activity cùng transaction |

Schema hiện `UNIQUE(session_id, turn_number)`, USER và ASSISTANT là các row riêng. Giữ nguyên quy tắc đánh số hiện tại; audio attempt liên kết **hai turn ID**, không nhét hai role cùng một turn_number hoặc thay constraint cũ tùy tiện. Bảng `so_ghi_han_muc` hiện đo phút, không dùng làm token/cost/XP ledger. `audio_url` hiện có chỉ dùng nếu bật retention; mặc định xử lý audio trong bộ nhớ/tmp có TTL rồi xóa, không lưu audio người học dài hạn. Nếu cần lưu để debug: opt-in, private object storage, signed URL ngắn hạn, quyền owner và TTL/xóa bao gồm bản sao.

## Đề xuất API version 2

Giữ API v1 text hiện có cho FE/mobile cũ; contract mới dưới `/api/v2/voice-conversations`.

| API | Nội dung |
|---|---|
| `GET /config` và `POST /sessions/start` | capability + cấu hình snapshot; scenario goals, input mode, expiry, version |
| `POST /sessions/{id}/audio-turns` | multipart `audio` + JSON metadata `clientTurnId`, elapsed, locale, configVersion; header Idempotency-Key; owner checks; 413 quá lớn, 415 MIME, 422 invalid audio |
| Response audio | 200 với `turnId`, raw transcript, confirmed text nếu có, `aiReply`, `feedbackLine`, `details`, `suggestions[{difficulty,text}]`, objective evidence, quality coverage, degraded/errorCode; TTS trạng thái độc lập |
| `GET /sessions/{id}/attempts/{clientTurnId}` | Khôi phục response khi client mất mạng; pending/complete/failed. Có thể trả 202 và polling nếu HTTP budget không đáp ứng sau đo |
| `PATCH /sessions/{id}/turns/{turnId}/transcript` | Xác nhận máy nghe sai, không sửa raw; evaluate revision có ID, không thêm lượt/XP |
| `POST /sessions/{id}/turns/{turnId}/speech` | TTS opt-in, cache/rate limit; chỉ owner, audio private; lỗi TTS không hủy lượt đã lưu |
| `POST /sessions/{id}/finish` | Tổng kết hai trục/version, lỗi và XP cố định/cap; idempotent, khi turn pending trả409 để người học chọn đợi/hủy |
| `POST /sessions/{id}/corrections/flashcards` | Danh sách correction IDs, deck riêng; review trước lưu; kết quả từng thẻ và chống trùng, không nhận userId tùy ý |

Schema AI có raw transcript và grammarErrors riêng, phát âm kèm evidence/uncertainty, goals evidence và đúng 3 gợi ý. Validate và giới hạn độ dài ở BE; sai schema/low confidence → cờ chưa đánh giá, không tạo điểm giả. Idempotent finish kể cả summary model lỗi: persist trạng thái hoàn tất/XP độc lập với khả năng tạo phần tổng kết ngôn ngữ, cho phép summary retry không thưởng lại.

## Migrate và rollback

1. Sau khi duyệt Phase 1: xác nhận số Flyway kế tiếp trên HEAD (hiện cao nhất V53). Thêm migration chỉ mở rộng, không sửa checksum V49/V53, không seed người dùng giả. Backup và thử staging gồm phiên đang mở, history, mobile cũ.
2. Thêm cột nullable/bảng mới/index; backfill **chỉ version legacy**, tuyệt đối không dựng điểm mục tiêu/phát âm từ text cũ. Phiên cũ tiếp tục luật cũ, phiên mới version mới.
3. Deploy BE đọc được hai version trước, flag audio tắt; sau đó FE capability-gated. Giai đoạn canary người dùng nội bộ/ít traffic, theo dõi latency, token/cost, error và concurrent finish.
4. XP mới áp dụng ở session mới; dữ liệu award cũ giữ nguyên. Reconcile daily XP/streak bằng log/DB thật trước chuyển; không cộng lại XP vào user tổng. Activity vẫn ghi khi hết cap.
5. Rollback bằng flag chuyển text/browser TTS, ngừng tạo session v2 mới; cho session đang mở finish theo snapshot. Giữ schema mở rộng và dữ liệu/version mới; không DROP cột/bảng hay chạy lại migration cũ. Xóa legacy chỉ ở đợt sau khi hết client/session phụ thuộc.

## Rủi ro và công sức ước lượng

Đơn vị ngày công kỹ sư có kinh nghiệm repo, gồm test/review; là ước lượng, không phải số đo thực nghiệm hay cam kết lịch. Chưa gồm thời gian chờ bản thu/quyền billing/người thử.

| Giai đoạn | Công việc và tiêu chí | Công sức |
|---|---|---:|
| Hoàn tất 0.2 | 15 audio requests, Web Speech cùng file, nghe TTS, trace lượt thật, quota/billing; report so sánh | 1–2 ngày sau khi có dữ liệu |
| Phase 1 | contract/config chung, migration mở rộng, push-to-talk audio end-to-end, deadline/idempotency, fallback text/browser TTS, activity khi XP=0 | 6–9 ngày |
| Phase 2 | feedback một dòng/details, 3 gợi ý, goals + quality có calibration, summary → flashcard, XP fixed/cap atomic, mobile compatibility/QA | 6–10 ngày |
| Phase 3 | spike Live API có số đo trước; codec/VAD/barge-in/reconnect/token expiry, cost guard và pilot riêng | 3–5 ngày spike; thêm 7–12 nếu triển khai |

Rủi ro chính: Gemini có thể sửa luôn transcript và bịa nhận xét phát âm (raw/evidence + người thật kiểm tra); browser codec/iOS autoplay (capability detect + retry bằng nút + text); quota key hiện tại (Flash TTS chưa biết headroom, Pro đã bị chặn); audio upload và model chậm (deadline tách + hiện text sớm); key/log và riêng tư (header, redaction, không log multipart/transcript mặc định); duplicate turns/XP khi retry/finish đồng thời (unique key + transaction/lock); flashcard trùng/rò câu riêng tư (ownership, PRIVATE deck, review); model alias tự đổi giá/chất lượng (pin model hỗ trợ sau benchmark, lưu modelVersion thực trả, không âm thầm tin alias).

**Chưa sang Phase 1.** Đợi đủ số liệu còn thiếu trong báo cáo 0.2 rồi chốt model, ngân sách và ngưỡng chấp nhận với người dùng; không coi thiết kế có điều kiện là kết quả benchmark.
