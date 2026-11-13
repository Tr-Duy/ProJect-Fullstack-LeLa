# Phase 1A — Web Speech push-to-talk

Ngày 13/11/2026, Asia/Saigon. **Chỉ triển khai 1A; dừng trước 1B.** Không thêm audio endpoint, MediaRecorder, bảng attempts, goals, corrections, flashcard hay XP ledger. API v1 và các trường cũ được giữ; response được bổ sung trường mới.

## Thay đổi

- FE dùng `voiceRoomReducer`: idle → aiSpeaking → ready → recording → processing → aiSpeaking/error; trạng thái finished kết thúc đúng một lần. Một bản mirror đồng bộ của reducer chống double click; ref còn lại giữ tài nguyên speech/thời gian, không điều khiển các cờ nghiệp vụ rời rạc.
- Push-to-talk mặc định: bấm bắt đầu, bấm dừng/gửi, Hủy bỏ transcript; không tự mở mic sau TTS hay lỗi. Tùy chọn “Tự động gửi” tắt mặc định chỉ bật timer khi người dùng chọn. Nhận kết quả final sau `stop()` trước gửi; deadline flush 1s chỉ là dự phòng engine không phát onend.
- Một chỗ gọi speak cho greeting/reply/replay/preview; StrictMode rehearsal hủy task trước khi phát. Skip AI hủy utterance và mở trạng thái ready. Kết thúc theo TTS onend hoặc người dùng Hoàn thành, bỏ đệm đóng phiên 2000ms.
- Feedback một dòng, chi tiết chỉ mở khi bấm. Ba chip Dễ/Vừa/Thử thách cho câu hỏi mới, có xem/nghe mẫu và “Không biết nói gì”. Text mode ghi “Mẹo phát âm”, không tạo điểm phát âm. Có fallback nhập văn bản và thông báo lỗi.
- BE là nguồn `autoCommitSilenceMs=1200`, `incompleteExtraMs=800`, `hintAfterSilenceMs=8000`, `inputModes=[WEB_SPEECH,TEXT]`, `configVersion=1A` trong uiConfig của status/start. FE không còn hardcode 1200/800. Trường legacy silenceThresholdSeconds vẫn là hint 8s.
- Prompt/schema trả feedbackLine và đúng 3 suggestions trong **cùng một model response**, có level/context. DTO thêm hai trường, giữ quickSuggestion/evaluation/userEvaluation cho client cũ. Normalize độ dài và dùng gợi ý xin giải thích lại nếu model trả sai cấu trúc. Gợi ý lúc mở phiên hoặc degraded là mẫu chung, không khẳng định do AI cá nhân hóa.
- Finalizer dùng khóa phiên khi finish, tính điều kiện thưởng từ USER turn hợp lệ. Phiên >=3 USER turn ghi activity/voiceSessionCount một lần kể cả cap làm XP=0. Không đổi công thức XP/trần 150 thành XP cố định; không thêm ledger.
- Bonus từ vựng chỉ đếm USER hợp lệ. Từ mới chọn theo `scenario.topic == flashcard.deck.topic`; từ legacy không thuộc topic bị loại khi chấm. Không có từ phù hợp thì DB vocabularyScore=null và overall chia lại grammar/fluency theo 2/3 và 1/3. Web ẩn tiêu chí nhờ trường bổ sung vocabularyScoreAvailable=false. V1 vẫn giữ vocabularyScore dạng số (0 khi không áp dụng) cho client cũ; **0 này không vào phép tính tổng**.
- tokensUsed lấy usageMetadata.totalTokenCount, cộng usage quan sát qua các attempt (gồm thinking khi provider có trong total). Response không trả usage thì không dựng số 400. Log request/error parse không còn in đầy đủ transcript ở INFO; log vòng đời FE chỉ có timestamp/metadata.

## Chẩn đoán trước sửa

Chạy Chrome cài trên máy, StrictMode bật, component thật trong fixture; STT là adapter để không tự thu mic người dùng. Có hai lần chạy: TTS adapter và **Chrome native speechSynthesis**.

Log native trước sửa (UTC; +7 giờ cho Việt Nam):

```text
07:31:44.282Z TTS EXECUTE SPEAK
07:31:44.989Z TTS ONSTART
07:31:47.715Z TTS ONEND
07:31:48.125Z MIC START
```

Quan sát được **1 speak** cho greeting, chưa tái hiện đọc đôi; không thấy mic bật trong lúc TTS ở lần chạy này. Có **tự mở mic sau onend khoảng 410ms**, trái yêu cầu push-to-talk. Lần dùng TTS adapter ghi onend 07:31:21.115Z, mic-start 07:31:21.520Z (405ms). Đây là log browser runtime, không phải bằng chứng về mic vật lý hay mọi trình duyệt.

Sau sửa, native Chrome test ghi một speak/start/end; không có mic-start trước thao tác người dùng. Ví dụ lần production fixture:

```text
07:46:28.839Z VOICE TTS SPEAK
07:46:29.366Z VOICE TTS START
07:46:32.066Z VOICE TTS END
```

Các test sau đó vẫn kiểm tra số speak=1 và mic-start=0 sau greeting. Thao tác click/gửi/Hủy/network được tự động hóa trên Chrome, không phải buổi nói trực tiếp với micro người dùng. **Kiểm tra thủ công giọng thật/mic vật lý: chưa xác minh**; cần người dùng thử trước khi coi trải nghiệm STT production đã được nghiệm thu.

## Timeout và log thật

Text inference khởi điểm **12s/call, 30s tổng**, primary phải chừa **một full call 12s** cho fallback. Không bắt đầu attempt mới nếu không đủ full call budget; future chưa xong được cancel khi hết hạn. 429 ngày chuyển model ngay; retry lỗi tạm thời nằm trong ngân sách còn lại. Không áp dụng timeout audio của 1B.

Log backend PID 3756 trong đợt đo UI:

```text
14:53:11.316 +07 primary timeout sau 12017ms (Attempt 1)
14:53:11.317 +07 chuyển fallback
14:53:13.059 +07 fallback thành công sau 1741ms (Attempt 1)
```

Đây là bằng chứng fallback đã chạy sau primary timeout, không bị ép xuống 2–3s. Unit test còn kiểm tra primary chậm bị cancel, không retry chiếm phần dự phòng và fallback nhận full call budget. 12s là giá trị để đo tiếp, không cam kết mọi lượt sẽ nhanh; primary vẫn có thể làm lượt chậm ~14s. Việc hủy HTTP là best effort, không xác nhận provider đã dừng tính phí.

## Độ trễ nút gửi → feedback trên 10 lượt thật

Chrome + component FE thật + BE thật + Gemini thật, **STT/TTS adapter** để gửi câu có kiểm soát. Mỗi lượt một phiên test mới, cùng câu “I would like a hot coffee please”; phiên được abandon sau đo, không finish/cộng XP. Không upload audio. Tổng **10 POST /turns**, tất cả HTTP 200, **10/10 degraded=false**; một POST có thể phát sinh nhiều model attempt do fallback.

| Lượt | Click → feedback hiện (ms) | Handler click → commit feedback (ms) | Degraded |
|---:|---:|---:|---|
| 1 | 14119 | 14013,5 | false |
| 2 | 13974 | 13871,6 | false |
| 3 | 11849 | 11747,0 | false |
| 4 | 2401 | 2326,1 | false |
| 5 | 1739 | 1651,8 | false |
| 6 | 2160 | 2089,6 | false |
| 7 | 2233 | 2134,8 | false |
| 8 | 2146 | 2078,3 | false |
| 9 | 5414 | 5328,1 | false |
| 10 | 2416 | 2341,5 | false |

**Median quan sát UI: 2408,5ms; min/max 1739/14119ms.** Mốc click đo trước lệnh Playwright click tới assertion feedback visible, có overhead automation. Mốc handler tới effect sau commit có median **2333,8ms**, không phải số đo pixel paint. Không tính thời gian người học nói, TTS playback hay đo full-session context. Đây là số đo trong fixture, không khẳng định mọi màn hình/client có cùng latency. Source/script: `tests/voice/live-latency.spec.ts`; raw JSON ở `tests/experiments/private-results/phase1a-live-latency.json`.

## Thử thinking: 10 case trước/sau

Payload export trực tiếp từ `VoiceAiService.buildTurnRequest`, không viết lại prompt trong Python. Model **fallback đang dùng trong hội thoại** `gemini-flash-lite-latest`, thực trả `gemini-3.5-flash-lite`. Primary đã báo quota ngày ở Phase 0 nên không coi benchmark fallback là benchmark `gemini-3.6-flash`.

Đợt đầu 20 request tuần tự có **14 HTTP 200, 4×503, 2×429**; 429 báo **15 RPM** của fallback. Sau cooldown chạy lại **chỉ 6 điều kiện lỗi**, lưu file riêng, đều 200. Tổng **26 request**, giữ nguyên 6 lỗi ban đầu, có đủ **10 kết quả thành công mỗi condition** để so sánh. Không retry âm thầm hay bỏ lỗi khỏi tỷ lệ thành công đợt đầu. Thứ tự before/after cố định, các ô bù đo muộn hơn nên có nhiễu thời điểm; chưa randomized/load test.

| Case | Câu test | Default ms | Budget128 ms | usage total default/128 | hasError đúng kỳ vọng (default/128) |
|---:|---|---:|---:|---|---|
| 1 | I would like a hot coffee please | 3576 | 2123 | 1115/1100 | đúng/đúng |
| 2 | I wants a coffee | 1701 | 1820 | 1140/1126 | đúng/đúng |
| 3 | Can I have an iced latte please | 3270 | 1884 | 1107/1105 | đúng/đúng |
| 4 | I would like two cup of tea | 2045 | 2340 | 1137/1111 | đúng/đúng |
| 5 | No sugar please | 1837 | 1426 | 1087/1080 | đúng/đúng |
| 6 | She want a hot chocolate | 2363 | 1532 | 1121/1131 | đúng/đúng |
| 7 | Could I have some milk please | 1382 | 1592 | 1106/1111 | đúng/đúng |
| 8 | Yesterday I buy coffee here | 2366 | 1831 | 1127/1123 | đúng/đúng |
| 9 | That is all thank you | 1682 | 1301 | 1100/1105 | đúng/đúng |
| 10 | How much do it cost | 1370 | 1418 | 1127/1136 | đúng/đúng |

Median default **1941ms**, budget128 **1706ms** (~12,1% thấp hơn trên tập đã bù); total tokens 11167/11128. Cả hai có 10/10 hasError đúng nhãn kỳ vọng và 3 suggestions ở mỗi response. **Đây không phải thước đo đầy đủ về chất lượng.** Budget128 case 3 nêu mẹo âm /t/ cuối “latte” không đáng tin; case 6 nói “Không có lỗi phát âm” dù chỉ có text. Cả default/128 case 6 đều có suggestedImprovement đổi “She” thành “I”, trong khi intendedUtterance vẫn giữ lỗi gốc. Default case 3 bù trả tiếng Việt không dấu. Các vấn đề này cần người dạy/người dùng xem lại, không chấm điểm phát âm.

**Không bật thinkingBudget trong production**: property mặc định null, request bỏ thinkingConfig. Không đủ bằng chứng chất lượng không tệ đi, và usage không trả thoughtsTokenCount ở đây nên chưa xác nhận budget thực sự giảm thinking. Thử nghiệm dùng `generationConfig.thinkingConfig.thinkingBudget=128` đã được endpoint chấp nhận ở response 200; không suy ra enforcement từ đó. [Tài liệu hiện tại](https://aistudio.google.com/docs/thinking) mô tả thinking levels cho các model 3.x, nên cần thử cấu hình phù hợp model thực trước khi bật tối ưu sau này.

## Build, test, migration, restart

- `npx tsc --noEmit`, `npx tsc --noEmit --project tsconfig.app.json`, `npm run build`: **PASS**. Tests TypeScript thêm `vite/client` vì reducer test import type API có import.meta.env. Còn cảnh báo vendor chunk >500KB của Vite, không lỗi build.
- `mvnw.cmd test`: **391 case, 360 pass, 31 skip, 0 fail/error**. 30 skip đã tồn tại; 1 là request exporter chỉ bật bằng VOICE_EXPORT_EXPERIMENT=1 (đã chạy riêng thành công để chuẩn bị đo). Không gọi Gemini trong unit/integration suite thường.
- `mvnw.cmd package -DskipTests`: **PASS**, WAR đóng gói **76.804.220 byte**. Đây không phải lần chạy test bổ sung.
- Chrome dev StrictMode: **4/4 pass** (reducer, luồng thủ công/cancel/chip/details/end, native TTS, optional autocommit).
- Chrome production bundle của cùng component trong fixture: **4/4 pass**. Fixture build riêng ở `.auth/voice-dist`, không đưa fixture vào bundle ứng dụng thông thường. Các tương tác dùng adapter STT/TTS trừ test native speechSynthesis.
- Chrome live BE/Gemini latency: **1/1 pass**, gồm 10 lượt và assertion đúng 10 POST.
- Regression tests mới: cap=0 vẫn activity/streak/finish lặp; bonus USER-only; vocabulary không thuộc scenario bị loại và reweight; scenario không topic; selector không lấy topic khác; usage từ metadata; timeout/cancel/reserve fallback; schema/DTO/config v1 bổ sung.
- Sửa hai assertion cũ để suite phản ánh HEAD: TOEIC test dùng front_text “Abide by” + part_of_speech=v đúng migration V51 đã có; quota test kiểm tra sentinel unlimited=-1 đã tồn tại, không khôi phục hạn mức phiên cũ. Không sửa migration hay dữ liệu để làm test pass.
- **Migration: không có.** HEAD hiện V53, không sửa V49/V53 hoặc tạo V54. Các cột vocabulary_score đã nullable từ trước.
- Restart backend hoàn toàn: PID cũ 4408 → 3756 trong đo; sau package dừng 3756, chạy WAR bằng Java 21 với PID **7488**. Log `Started Application` lúc **15:02:14.252 +07**, start 14,451s; GET status sau restart **HTTP 200**, uiConfig mới đúng. Devtools restart tắt, không dựa vào hot reload Java.

Các log/raw result/token test ở file bị ignore, không commit. Lịch sử `git log -p -S"AIza" -- .` có hai chuỗi khớp trong PNG base64 nhúng ở favicon.svg (match dài 88 ký tự trong dòng image ~1,45MB), không phải literal API key 39 ký tự. Diff hiện tại không có key literal; không in giá trị nghi nhạy cảm ra báo cáo. Việc này không thay thế secret scanning toàn bộ hệ thống bên ngoài repo.

## Rủi ro và điểm dừng

Giọng người dùng qua mic vật lý và chất lượng STT native trong buổi dùng thật vẫn cần xác nhận; hiện chỉ TTS native được kiểm tra, STT điều khiển bởi adapter. Chất lượng feedback/gợi ý chưa được giáo viên đánh giá mù. Topic mapping là phạm vi từ vựng hiện có, không phải danh sách từ được curate cho từng scenario. API v1 cho mobile giữ các trường cũ; mobile UI cũ chưa biết vocabularyScoreAvailable nên có thể vẫn hiển thị giá trị legacy 0. Daily cap khi finish **các phiên khác nhau** đồng thời chưa có kiểm thử concurrency mới (khóa phiên chỉ bảo đảm cùng phiên không ghi activity hai lần); XP ledger/concurrency mở rộng để Phase 2.

Text processTurn vẫn gọi AI trong transaction DB hiện có; không mở rộng refactor audio/transaction của 1B ở đây. Alias model vẫn có thể route; pin model và lưu modelVersion thuộc 1B. Độ trễ xấu do primary chậm/429 còn tồn tại; không chọn model nhanh hơn chỉ từ một median nhỏ.

**Dừng ở Phase 1A, chờ người dùng duyệt trước 1B.** Các thay đổi Phase 0 đã tồn tại ở working tree được để ngoài commit 1A; audio, manifest, raw response và token riêng tư tiếp tục bị ignore.

## Danh sách file trong commit 1A

- .project_memory.md
- LeLa_BE/src/main/java/com/lela/ai/dto/GeminiRequest.java
- LeLa_BE/src/main/java/com/lela/ai/service/GeminiClient.java
- LeLa_BE/src/main/java/com/lela/flashcard/FlashcardRepository.java
- LeLa_BE/src/main/java/com/lela/voice/config/VoiceConfigurationProperties.java
- LeLa_BE/src/main/java/com/lela/voice/dto/VoiceReportResponse.java
- LeLa_BE/src/main/java/com/lela/voice/dto/VoiceSuggestionDto.java
- LeLa_BE/src/main/java/com/lela/voice/dto/VoiceTurnResponse.java
- LeLa_BE/src/main/java/com/lela/voice/dto/VoiceUiConfigDto.java
- LeLa_BE/src/main/java/com/lela/voice/repository/ConversationSessionRepository.java
- LeLa_BE/src/main/java/com/lela/voice/service/TargetWordSelector.java
- LeLa_BE/src/main/java/com/lela/voice/service/VoiceAiService.java
- LeLa_BE/src/main/java/com/lela/voice/service/VoiceConversationServiceImpl.java
- LeLa_BE/src/main/java/com/lela/voice/service/VoiceSessionFinalizer.java
- LeLa_BE/src/test/java/com/lela/deck/ToeicDataIntegrationTest.java
- LeLa_BE/src/test/java/com/lela/voice/controller/VoiceConversationIntegrationTest.java
- LeLa_BE/src/test/java/com/lela/voice/service/ConversationQuotaServiceTest.java
- LeLa_BE/src/test/java/com/lela/voice/service/TargetWordSelectorTest.java
- LeLa_BE/src/test/java/com/lela/voice/service/VoiceAiServiceTest.java
- LeLa_BE/src/test/java/com/lela/voice/service/VoicePhase1RequestExportTest.java
- LeLa_BE/src/test/java/com/lela/voice/service/VoiceSessionFinalizerTest.java
- LeLa_FE/playwright.voice.config.ts
- LeLa_FE/src/features/voice-conversation/api/voice-conversation.api.ts
- LeLa_FE/src/features/voice-conversation/components/VoiceCallRoom.tsx
- LeLa_FE/src/features/voice-conversation/components/VoiceReportModal.tsx
- LeLa_FE/src/features/voice-conversation/hooks/useSpeechRecognition.ts
- LeLa_FE/src/features/voice-conversation/hooks/useSpeechSynthesis.ts
- LeLa_FE/src/features/voice-conversation/hooks/voiceRoomMachine.ts
- LeLa_FE/tests/tsconfig.json
- LeLa_FE/tests/voice-room.html
- LeLa_FE/tests/voice-room.tsx
- LeLa_FE/tests/voice/baseline.spec.ts
- LeLa_FE/tests/voice/live-latency.spec.ts
- LeLa_FE/tests/voice/room.spec.ts
- LeLa_FE/vite.voice-test.config.ts
- docs/voice-phase-1a-report.md
- tests/experiments/phase1a_thinking_probe.py
