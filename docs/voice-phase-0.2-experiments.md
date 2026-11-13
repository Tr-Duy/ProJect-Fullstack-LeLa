# Phase 0.2 — Thử nghiệm và điểm dừng

Ngày báo cáo: **13/11/2026, Asia/Saigon**. Chỉ có hai sửa nhỏ được yêu cầu; chưa triển khai Phase 1.

## Kết quả thực tế

| Hạng mục | Kết quả | Giới hạn kết luận |
|---|---|---|
| 5 mẫu audio người học Việt | **0/5**, chưa có `tests/audio` trước lượt làm này | Dừng thử audio; cần người dùng ghi âm |
| Audio × 3 lần/mẫu | **0/15** request | Transcript, latency, request bytes, grammar, pronunciation, độ ổn định: **chưa xác minh** |
| Web Speech cùng audio | **0/5** | **Chưa xác minh**; không lấy TTS hay đọc lại câu làm cùng mẫu |
| Gemini Flash TTS | **3/3 HTTP 200** | Có audio thật; chưa đánh giá nghe bởi người thật |
| Gemini Pro TTS | **1 request, HTTP 429** | Lỗi chỉ rõ Free Tier input TPM/RPM/RPD có limit 0; không retry |
| Google Cloud TTS | **1 request, HTTP 401** | Endpoint trả `CREDENTIALS_MISSING`: yêu cầu OAuth2/principal, key hiện tại không dùng được |
| Độ trễ trọn lượt hiện tại từ log | **Chưa xác minh** | Log backend không có chuỗi STT → API → TTS cùng lượt |

Script `tests/experiments/voice_probe.py` chạy tách biệt production, Python stdlib, key đọc từ environment hoặc `LeLa_BE/.env`, gửi header `x-goog-api-key`, timeout thí nghiệm 90 giây, không tự retry. Không sửa timeout production. Thời gian đo bằng `perf_counter`, từ trước gọi HTTP tới đọc hết body. Không phải time-to-first-byte, không bao gồm phát loa, không gồm TLS/header bytes trong request size.

Kết quả API lưu cục bộ trong `tests/experiments/private-results/tts.json`; audio PCM cũng ở đó, đều bị gitignore. Timestamp của lần đo là `2026-11-13T04:52:02.696150+00:00` (11:52:02 +07). Dữ liệu raw không commit. Các số tổng hợp bên dưới được chép từ lần chạy thật; không phải dữ liệu test/mock. Không chạy tải/concurrency test hay dò quota bằng cách cố gọi cho hết hạn mức.

## TTS server

Câu đầu vào: `Say clearly: Hello! What would you like to drink today?`
Model `gemini-2.5-flash-preview-tts`, voice `Kore`, REST `generateContent`, output AUDIO.

| Lần | HTTP | Toàn bộ HTTP (ms) | JSON body gửi (byte) | Audio trả (byte) | Input text token | Output audio token |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 200 | 3659 | 232 | 131086 | 13 | 68 |
| 2 | 200 | 4120 | 232 | 121486 | 13 | 63 |
| 3 | 200 | 2917 | 232 | 131086 | 13 | 68 |

Trung bình **3565,3 ms**, median **3659 ms**, min–max **2917–4120 ms**, khoảng dao động **1203 ms**. N=3 quá nhỏ để suy rộng p95, độ ổn định sản xuất hoặc quota còn lại. MIME thực tế `audio/L16;codec=pcm;rate=24000`; nếu giải mã mono 16-bit/24kHz, payload tương đương khoảng 2,53–2,73 giây. Không chấm chất lượng bằng suy luận từ kích thước; tự nhiên, dễ nghe, đọc đúng và hợp người học Việt: **chưa xác minh**, cần nghe blind review.

Pro `gemini-2.5-pro-preview-tts`: 378 ms, body 232 byte, HTTP 429, không có audio.
Cloud TTS: 97 ms, body 142 byte, HTTP 401, không có audio. Hai số này là **latency lỗi**, không phải latency sinh giọng nói.
GET models: HTTP 200, 1318 ms. Liệt kê model không chứng minh quota của model đó.

Kết luận: Flash TTS dùng được với key hiện tại nhưng riêng bước này đã thêm khoảng **2,9–4,1 giây**. Chưa đủ bằng chứng chọn làm mặc định. Đề xuất khởi đầu dùng browser TTS và cho chọn server TTS khi thử nghe/latency đạt yêu cầu. Không chọn Pro với quota hiện tại; Cloud TTS cần cấu hình xác thực riêng.

## Giá, quota và phiên 6 lượt

Phân biệt **bảng giá công khai** và **chi phí bị tính trên tài khoản**. Chưa truy cập billing/AI Studio project; khoản tiền thật bị trừ và quota Flash TTS/audio còn lại: **chưa xác minh**. Không suy luận quota từ các con số từng xuất hiện trong memory/audit.

Theo [bảng giá Google](https://aistudio.google.com/docs/pricing#gemini-2.5-flash-preview-tts), Flash TTS Standard: input text **$0,50/1M token**, output audio **$10/1M token**. Tính trên usage đo được: một câu khoảng **$0,0006365–$0,0006865** theo paid list price. Sáu câu cùng độ dài, không retry/cache/lời chào: **$0,003819–$0,004119**, trung bình **$0,004019** cho **riêng TTS**. Đây là ngoại suy có điều kiện; câu dài hơn sẽ khác. Không đồng nhất $0,004019 với tổng tiền một phiên và không khẳng định free tier thực tế đã miễn phí.

Audio input hiện cấu hình production `gemini-3.5-flash`, fallback `gemini-flash-lite-latest`. [Tài liệu model](https://aistudio.google.com/docs/models/gemini-3.5-flash) nói 3.5 Flash đã deprecated và được route sang 3.6 Flash; chưa xác minh route thật bằng request audio trên key này. [Giá Standard 3.6 Flash](https://aistudio.google.com/docs/pricing#gemini-3.6-flash) công khai ngày kiểm tra: input $0,75/1M, output gồm thinking $3,75/1M tới 31/12/2026; từ 01/01/2027 lần lượt $1,50 và $7,50. Giá được tài liệu liệt kê chung, không có dòng audio tách riêng ở mục đó. Chưa chọn model triển khai hay thay cấu hình hiện tại.

**Tổng chi phí thực tế phiên 6 lượt: chưa xác minh**, do thiếu audio, token context/output/thinking, retry và billing thật. Công thức để điền sau khi đo, không nhân một lượt đầu rồi bỏ qua lịch sử tăng dần:

`C_session = Σ(i=1..6) [input_audio_tokens_i × audio_rate + input_text/context_tokens_i × text_rate + billed_output/thinking_tokens_i × output_rate] / 1e6 + C_TTS + C_greeting/summary/retry + storage/egress`.

Nếu tài liệu model không tách modality price thì dùng rate chung đã xác nhận, tránh đếm audio token hai lần. Dự toán minh họa, **không phải số đo**: giả sử tổng 6 request = 6000 input token (gồm audio/context), 2400 output/thinking token, route 3.6 và giá hiện nêu trên, phần Gemini = $0,0135; cộng TTS trung bình đo được = **$0,017519/phiên**. Chưa gồm lời chào, tổng kết, retry, hạ tầng; không dùng con số này làm cam kết ngân sách.

[Rate limits Google](https://aistudio.google.com/docs/rate-limits): áp dụng theo project, phụ thuộc model/tier; RPD reset theo Pacific, khác quota sản phẩm/XP tính theo ngày Việt Nam. Pro TTS đã xác nhận bị chặn ở hạn mức 0; RPM/TPM/RPD cụ thể của Flash TTS/audio và giá Google Cloud TTS áp dụng cho tài khoản: **chưa xác minh**.

## Log hiện tại và API key

`python tests/experiments/inspect_voice_logs.py` kiểm tra `LeLa_BE/global_error.log`:

- File **5.809.463 byte**; số lần xuất hiện key hiện tại: **0**; chuỗi query `[?&]key=`: **0**.
- Số dòng VoiceAiService có latency/elapsed/`Nms`: **0**. Chưa có log FE lưu trên đĩa nối được cùng lượt.
- Không có số đo thật cho thời gian chờ im lặng, Gemini, TTS và tổng lượt hiện tại. Không lấy dòng `0ms` trong surefire (mock) làm kết quả production.

Các số **1200 ms** autocommit, **+800 ms** câu chưa xong, **50 ms** trước speak, **400 ms** echo guard là cấu hình đọc từ source, **không phải phép đo**. Ngưỡng **8 giây** gợi ý im lặng là hành vi khác autocommit, không được thay thế 1200ms bằng 8s một cách máy móc.

Hai commit nhỏ: `8061bea` (streak), `228fe32` (key header). Test HTTP cục bộ kiểm tra cả generate/stream, URL không có key, header đúng, log và stack trace không có key ngay cả khi server giả lập echo key. Streaming cũng dùng đúng endpoint `:streamGenerateContent?alt=sse` thay cho URL ghép query hai lần. Log response lỗi được che key. Không khẳng định đã kiểm tra được log bên proxy/APM/hệ thống bên ngoài.

Validation: **17 Java tests pass, 0 skip/fail/error** (Aggregation 3, GeminiClient 1, VoiceAiService 10, Finalizer 3); **2 Python safety tests pass**. Wrapper repo lỗi `Cannot index into a null array`; dùng Maven 3.9.16 đã cài và tải dependencies để chạy test, không sửa build config.

## Live API — chỉ ghi nhận Phase 3

[Gemini Live API](https://aistudio.google.com/docs/live-api) hỗ trợ audio liên tục, transcription và ngắt lời; có [WebSocket với ephemeral token](https://aistudio.google.com/docs/live-api/get-started-websocket). Khả thi về giao thức theo tài liệu; **latency, giá/quota và chất lượng trên project này chưa xác minh**. Chưa mở kết nối Live, chưa triển khai. Phase 3 phải đánh giá codec PCM/resample, VAD/barge-in, reconnect, backpressure, token/session expiry, server ownership và chi phí audio/context liên tục. Không đưa API key dài hạn vào FE.

## Chạy tiếp khi có bản thu

1. Đọc `tests/audio/README.md`, ghi 5 file giọng thật, tạo manifest riêng tư. Không commit bất cứ audio/manifest/transcript nào.
2. Chạy `python tests/experiments/voice_probe.py audio --model <model-cần-đo>`: mỗi mẫu đúng 3 lần, lưu latency/body bytes/status/usage/transcript/grammar/pronunciation thô. Ghi model thực trả nếu có và thời điểm đo.
3. Chạy Web Speech trên **cùng file** và cùng ngôn ngữ; dùng audio track nếu browser hỗ trợ hoặc virtual microphone, ghi Chrome/OS/cách cấp audio. Nếu không hỗ trợ thì giữ **chưa xác minh**, không giả lập engine.
4. Người thật chốt reference; tính WER đã chuẩn hóa chữ hoa/dấu câu, độ khác transcript giữa 3 lần, tỷ lệ thành công, latency min/median/max. So sánh lỗi ngữ pháp có giữ nguyên lời người học không; pronunciation có bằng chứng âm thanh hay chỉ là mẹo chung.
5. Thu log runtime FE/BE cùng phiên có mốc stop-speaking/final-STT/send/AI-response/TTS-onstart/onend và correlation ID. Chưa sửa telemetry production ở Phase 0; có thể dùng DevTools performance/network cùng log browser và BE. Nếu mốc thiếu thì giữ chưa xác minh.

**Điểm dừng:** Phase 0.2 còn thiếu 5 bản thu, đối chiếu Web Speech, nghe TTS, quota/billing project và trace lượt hiện tại. Phase 0.3 bên cạnh là thiết kế có điều kiện; chưa được phép dùng phần thiếu này làm bằng chứng cho Phase 1.
