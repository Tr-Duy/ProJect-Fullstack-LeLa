# AI Tutor — chẩn đoán, sửa và xác minh (2026-11-14)

## Kết quả

Đã kiểm tra câu trả lời thật qua Trò chuyện, Dịch, Từ vựng, Sửa câu, Ngữ pháp và một yêu cầu giải thích dài: **6/6 HTTP 200, `finishReason=STOP`**. Câu cá nhân hóa có mở đầu/kết thúc tự nhiên, đúng **Cơ bản (Dưới 500), 44 XP, 6/20 thẻ, Contracts 4/16, quiz 2/5**; không mất đầu, không có dấu `**` thô hay tên trường nội bộ. Đã kiểm tra lại bằng JWT hết hạn thật trên backend được restart hoàn toàn.

Không thay đổi nghiệp vụ XP/quiz/voice hoặc dữ liệu của user thật để làm câu trả lời khớp ảnh. DB của user thật đã thay đổi sau ảnh chụp (snapshot ban đầu của phiên này có 129 XP), nên lượt chấp nhận dùng learner thử được nạp dữ liệu tương đương ảnh. Credentials, token, raw response, ảnh và log thử chỉ nằm trong `.auth/` hoặc file `.log` bị gitignore.

## Bằng chứng và kết quả từng giả thuyết

| Giả thuyết | Bằng chứng | Kết luận |
| --- | --- | --- |
| a. Mất mảnh SSE / state ghi đè | FE cũ `reader.read()` → `chunk.split('\n')`, không có buffer cho dòng dở; `.trim()` mất khoảng trắng. Ví dụ gói `da` rồi `ta: Chào...` làm mất event. Context lại chèn `\n` sau mỗi mảnh; BE chỉ đọc part đầu. | **Lỗi xác định trong parser/ghép nội dung**; đủ cơ chế gây mất nội dung. Đã bỏ đường đọc SSE của FE, nhận JSON trọn vẹn. Không quy lỗi cho StrictMode khi chưa có bằng chứng. |
| b. MAX_TOKENS / đóng stream sớm | BE cũ đặt 1.024 token, emitter 60s, không xét finishReason/usage; nếu đã có mảnh rồi lỗi thì vẫn complete. Probe Gemini trước sửa trả quota 429 nên không có finishReason/usage của câu cũ. Sau sửa đo được 1.470 thinking + 492 output token ở câu cá nhân hóa, và 1.536 thinking + 1.664 output token ở câu dài. | **Cấu hình/thiếu kiểm tra là lỗi xác định; finishReason của câu trong ảnh chưa thu được**, không khẳng định chắc câu đó MAX_TOKENS. Tăng trần 8.192, giữ nguyên thinking, chỉ STOP có text mới complete. MAX_TOKENS có tối đa một continuation rồi vẫn phải kiểm tra STOP. |
| c. 401 | Chat cũ dùng fetch riêng, đọc accessToken một lần, không đi qua refresh interceptor. Đã quan sát `/ai/context` 200 với token mới trong khi chat 401; body SSE lượt đó không thu được đầy đủ. Sau sửa dùng JWT ký hợp lệ nhưng exp đã qua: **chat 401 → refresh 200 → chat 200 STOP**, cùng clientMessageId, một bubble user. Refresh không hợp lệ trả 400 và UI báo đăng nhập lại. | **Thiếu refresh được xác nhận và đã kiểm tra thật**. Không có stack dispatcher của 401 cũ để quy tất cả trường hợp cho token hết hạn; không khẳng định CSRF/CORS là nguyên nhân. Đường buffered mới không dùng async SSE redispatch cho FE. |
| d. Nhân đôi | Handler regenerate cũ gọi sendMessage, hàm này luôn append user mới; guard bằng state chưa đồng bộ trong cùng render. | **Đúng**. Ref khóa đồng bộ, UUID theo lượt; retry lỗi thay AI của lượt đó, không append user. Hai submit trong cùng frame chỉ tạo một request. |
| e. Markdown | MessageBubble đã có ReactMarkdown/remark-gfm; chuỗi cũ có thể kết thúc ở `**Cơ bản`. | **Loại trừ thiếu thư viện Markdown**. Tránh render các mảnh dở, explicit skipHtml, hỗ trợ đậm/list/heading/code. Lượt chưa xong được gắn nhãn rõ. |
| f. Model/quota/fallback | Probe HTTP thật: 429 `RESOURCE_EXHAUSTED`, `quotaId=GenerateRequestsPerDayPerProjectPerModel-FreeTier`, quotaValue=20. Client stream cũ catch cả exception vừa ném cho HTTP error, có thể trả tiếp stream lỗi đã đọc hết; Tutor dùng câu trả lời dựng sẵn thay vì chuyển model thật. | **Đúng**. Primary cấu hình theo tên phiên bản `gemini-3.5-flash`, không `-latest`; provider thực trả `gemini-3.6-flash`. Backup cấu hình `gemini-flash-lite-latest`, thực trả `gemini-3.5-flash-lite`. Daily 429 không retry trong lượt, chuyển model, nhớ hết quota 1 giờ trong process. Transient 429/5xx/network tối đa một retry mỗi model, có backoff. Không dùng câu trả lời cố định để giả thành công. |
| g. Ngữ cảnh lệch panel | BE chỉ đếm cardsLearned (1), panel đếm thêm reviewCount (5); thiếu mục tiêu 20, tỷ lệ 4/16, quiz 2/5 (BE chỉ tìm FINAL_LEVEL); chọn bộ chưa hoàn thành trong catalog dù user chưa enroll. | **Đúng**. Bổ sung dữ liệu cùng nguồn; lấy bộ đã đăng ký thật, quiz gần nhất, tổng mới+ôn, mục tiêu; giữ riêng điều kiện thi cuối cấp. Streak dùng kết quả activity hiện tại như header. |

Theo [tài liệu Thinking của Google](https://ai.google.dev/gemini-api/docs/generate-content/thinking?hl=en), ngân sách output có thể bị thinking tiêu hết và kết thúc MAX_TOKENS. Đây là cơ sở thiết kế kiểm tra finishReason; **không thay thế bằng chứng finishReason còn thiếu của lượt cũ**. Không thay thinkingBudget/thinkingLevel, vì không có phép A/B trước sửa hợp lệ trong lúc primary hết quota.

## Cách sửa

- **Truyền câu trả lời:** Gemini generateContent → gom mọi part không phải thought, giữ nguyên whitespace → response JSON chứa content, complete, finishReason, model thực và token usage. Chỉ STOP có nội dung là hoàn chỉnh. MAX_TOKENS tự yêu cầu viết tiếp đúng chỗ dừng tối đa một lần; nếu chưa STOP vẫn trả complete=false và UI gắn nhãn, không lưu cặp trả lời đó vào DB như hoàn chỉnh.
- **Thời hạn:** mỗi lần chờ Gemini 40s; transient retry tối đa một lần/model, backoff 1s; UI chờ tối đa 240s để bao cả fallback/continuation. Refresh token có timeout riêng 15s. Dừng/đổi trang hủy request FE và vô hiệu callback cũ; trạng thái pending còn lưu qua F5 thành interrupted, có nút thử lại.
- **Xác thực:** chat dùng apiClient Axios chung với profile/quiz. Không tạo thêm cơ chế refresh riêng. 401 chỉ refresh một lần rồi phát lại cùng payload/ID. Khi refresh hỏng, dùng thông báo tiếng Việt, không hiện HTTP 401 thô.
- **Idempotency/lịch sử:** FE khóa bằng ref trước await, UUID theo lượt; retry lỗi giữ ID và một user bubble. BE gộp đồng thời/cached cùng user+ID, lưu cặp user/AI chỉ khi câu trả lời hoàn chỉnh. Cache bounded trong process, **không phải idempotency bền vững qua restart**. FE lưu sessionStorage theo user; lịch sử đưa lại model chỉ gồm các cặp hoàn chỉnh, tối đa 12 message với giới hạn chiều dài. Những message cũ chưa có metadata không tự nâng thành hoàn chỉnh.
- **Prompt:** nhãn dữ liệu tiếng Việt, không đưa tên biến nội bộ vào câu trả lời; giữ các dữ kiện cũ (XP, streak, thời gian, bài học, điều kiện thi) và thêm tỷ lệ panel cần. Câu cá nhân hóa phải có số liệu và 2–3 hành động. Không hardcode câu trả lời hay số của user thật vào code service.
- **Tương thích Mobile:** giữ `/ai/chat` với Accept text/event-stream bằng một event chứa câu đã hoàn chỉnh, UTF-8, không async SseEmitter. Client JSON nhận metadata. Câu chưa hoàn chỉnh không phát thành event hoàn chỉnh cho Mobile. Không sửa source Mobile.
- **UI câu dài:** giữ chiều cao viewport qua AnimatedOutlet, min-height cho flex container, cuộn trong message log; composer không bị đẩy khỏi màn hình. ReactMarkdown không cho HTML thô.
- **Logging:** bỏ INFO username và raw Gemini SSE/text. Log production chỉ có requestId, model, attempt/status, thời gian, finishReason và số token; không prompt/answer/key/token. Không có log tạm chứa nội dung được giữ trong source.

## Kiểm chứng chấp nhận

| Tiêu chí | Kết quả |
| --- | --- |
| 1. Câu “Tôi nên ôn gì hôm nay?” | **PASS thật**: số liệu được assertion độc lập (44 XP, 6/20, 4/16, 2/5, Contracts, Cơ bản), STOP, Markdown không `**` thô, không tên trường nội bộ, mở đầu và kết thúc tự nhiên. |
| 2. Năm tab + câu dài | **PASS thật 6/6**; bảng token bên dưới. Có khoảng nghỉ 4s giữa câu, chạy tuần tự. |
| 3. Một bubble/request, retry không nhân đôi | **PASS**: sáu lượt bình thường có đúng sáu POST chat và sáu ID khác nhau; mock double-submit cùng frame chỉ một POST; retry lỗi hai POST cùng ID nhưng một user bubble. Phát lại cùng ID qua JSON/SSE thật không thêm Gemini call. |
| 4. Expired token/refresh hỏng | **PASS thật và mock**: JWT hết hạn có chữ ký thật, 401→refresh 200→chat 200 STOP. Auth retry là hai HTTP chat có cùng ID, một câu user, một lượt generation; refresh không hợp lệ trả 400, thông báo đăng nhập lại, không spinner treo. |
| 5. 429/5xx/timeout | **PASS**: daily 429→backup có bằng chứng thật; transient/quota mọi model/5xx/timeout được mock ở BE service, số lần gọi bị chặn; FE mock cho trạng thái thân thiện và mở lại composer. Không giả lập các mock thành kết quả Gemini thật. |
| 6. F5/Stop/lịch sử | **PASS**: F5 sau câu thật còn message complete; F5 giữa chừng trong browser mock còn user và AI interrupted; Dừng không để pending; không đưa phần dở vào history gửi model. |
| 7. Test/build | **455 BE tests: 422 pass, 0 fail/error, 33 skipped có sẵn**; 8/8 Tutor browser mock trên dev và **8/8 trên production preview**; 13/13 E2E chính Chromium; 1/1 opt-in live test gồm 6 câu thật; 2/2 file Node speech tests. Tsc root/app/tests 0 lỗi; FE build và WAR package thành công. |

Các thay đổi nhánh MAX_TOKENS/khả năng giữ đủ dữ kiện cũ được chốt sau lượt sáu câu; đã chạy lại toàn bộ BE và browser mock, rồi kiểm tra thật câu cá nhân hóa/refresh/SSE trên WAR restart cuối. Không chi thêm sáu lượt Gemini chỉ để kiểm tra lại các nhánh STOP không đổi.

| Lượt thật | Prompt tokens | Output tokens | Thinking tokens | Thời gian tới response | Finish |
| --- | ---: | ---: | ---: | ---: | --- |
| Trò chuyện/cá nhân hóa | 628 | 492 | 1470 | 18.5s | STOP |
| Dịch | 1191 | 492 | 554 | 10.5s | STOP |
| Từ vựng | 1808 | 863 | 955 | 25.4s | STOP |
| Sửa câu | 2778 | 528 | 562 | 65.8s | STOP |
| Ngữ pháp | 3433 | 1247 | 1217 | 15.9s | STOP |
| Câu dài | 4740 | 1664 | 1536 | 58.6s | STOP |

Model thực của bảng trên: **gemini-3.6-flash**. Một số lượt có transport timeout rồi retry giới hạn, nên thời gian tới response gồm cả lần chờ đó. Token usage là metadata của các response nhận được, không phải số token tính phí của những request timeout không nhận được response.

## Quota đã dùng và giới hạn xác minh

**24 lượt phát khởi Gemini được quan sát**, gồm 23 lần từ service và 1 probe API trực tiếp. Trong đó có **17 response thành công, 4 HTTP 429 và 3 timeout transport** không nhận được response. Theo tên model được gọi: primary 15 lượt (bao gồm probe trực tiếp), backup 9 lượt. Các request timeout có thể đã đến provider; không suy đoán số token tính phí của chúng.

Ngoài ra, lượt SSE baseline trả 401 không có telemetry upstream đầy đủ: **có thể thêm tối đa 1 lần**, nên tổng bảo thủ của phiên là **24–25 lượt khởi phát**, không phải 24–25 câu được provider trả thành công. Đây là bộ đếm riêng của phiên sửa, không phải toàn bộ quota đã dùng trước đó của project. Các lượt bình thường chạy tuần tự, nghỉ 4s; từng request có retry/fallback hữu hạn. Circuit quota được đặt lại khi restart process trong các vòng sửa. Những test mock, GET health/context, auth refresh, phát lại cache JSON/SSE không cộng vào số này.

Lượt sáu câu có 6 frontend POST chat, nhưng 8 lượt thử provider do hai timeout rồi retry. Một số lượt chốt bổ sung chỉ kiểm tra một câu và cache/auth, không lặp cả bộ câu để tránh phí quota. Sau khi đạt đã dừng các lời gọi Gemini thử.

Chưa có raw SSE/finishReason đầy đủ của đúng câu trong ảnh ban đầu; probe trước sửa hết quota. MAX_TOKENS/continuation được kiểm tra bằng BE mock, không cố ép một câu thật chạm trần để tốn quota. Chưa chạy thiết bị Mobile/Firefox/WebKit hay toàn bộ voice/vocabulary browser fixtures; đã giữ/test hợp đồng Mobile trên BE. Chưa đo A/B thay đổi thinking vì không đổi cấu hình thinking. Cache idempotency/quota là process-local. Client hủy không bảo đảm provider chưa xử lý hoặc chưa tính quota request đã gửi.

## File đổi và chạy lại

- BE: `ai/controller/AiController`, DTO AiChatRequest/AiChatResponse/AiContextDto/GeminiResponse, AiService/AiServiceImpl, TutorGenerationService, LearningContextBuilder, SystemPromptBuilder, ChatConversationRepository.
- BE tests: AiControllerFormatTest, AiServiceImplTest, LearningContextBuilderTest, TutorGenerationServiceTest, GeminiClientTest.
- FE: aiApi, AiChatContext, ai.types, AiChatPage, Composer, ContextPanel, MessageBubble, MessageList, TranslationTool; shared api interceptor timeout, LearnerLayout và AnimatedOutlet.
- Test/config/docs: `playwright.tutor.config.ts`, `tests/tutor/chat.spec.ts`, `tests/tutor/live.spec.ts`, `.project_memory.md`, báo cáo này.

```powershell
# Backend, không gọi Gemini thật trong các unit/integration test mặc định
cd LeLa_BE
.\mvnw.cmd package

# FE mock/negative cases, không tốn quota
cd ..\LeLa_FE
npx playwright test --config playwright.tutor.config.ts chat.spec.ts
npx tsc --noEmit
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tests/tsconfig.json --noEmit
npm run build
```

Test live **chỉ chạy khi opt in**. Chuẩn bị learner có dữ liệu tương đương, file storageState private ở `.auth/tutor-learner.json` (hoặc TUTOR_STORAGE_STATE), khởi động FE/BE thật, rồi đặt `TUTOR_LIVE=1` và chạy `npx playwright test --config playwright.tutor.config.ts live.spec.ts`. Test dừng ngay nếu quota/complete/fact assertion không đạt; không biến lỗi quota thành pass. Các script/token fixture local dùng trong phiên sửa không commit.

Bằng chứng local bị gitignore: `.auth/tutor-context-before.json`, `tutor-context-after.json`, `tutor-gemini-before.json`, `tutor-live-evidence.json`, `tutor-delivery-proof.json`, `tutor-live-personalized.png`, `tutor-delivery-personalized.png`, các `tutor-server-round*.log`, thư mục kết quả `.auth/tutor-*-results`, BE `tutor-package-final.log` và `tutor-server-handoff.log`. Nội dung riêng tư/key/token/audio/manifest/private-results không đưa vào commit.
