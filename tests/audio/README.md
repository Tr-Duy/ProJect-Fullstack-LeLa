# Audio riêng tư cho Phase 0.2

Chưa có mẫu audio người học tại thời điểm kiểm kê 2026-11-13.
Đặt đúng 5 bản thu ngắn (khoảng 5–15 giây), tên sample-01.wav … sample-05.wav
(cũng hỗ trợ .webm, .mp3, .m4a, .ogg). Giọng người học Việt thật, không dùng TTS thay thế.
Gợi ý câu: gọi cà phê; kể việc hôm qua; hỏi đường; nêu sở thích; đề nghị giúp đỡ.
Giữ cả câu đúng và lỗi tự nhiên. Không nói tên, số điện thoại hay thông tin riêng tư.

Tạo manifest.json (file riêng tư, không commit), là mảng đúng 5 object:
`{"file":"sample-01.wav","reference":"câu thực sự đã nói","webSpeechTranscript":"kết quả Chrome cho cùng file"}`.
Không sửa ngữ pháp trong reference. Web Speech phải dùng chính file đó qua audio track
nếu trình duyệt hỗ trợ, hoặc virtual microphone; không đọc lại câu và coi là cùng mẫu.
Ghi thêm phiên bản Chrome, OS, ngôn ngữ en-US, cách cấp audio và thời điểm đo.
Nếu chưa đo Web Speech, bỏ trường webSpeechTranscript; báo cáo sẽ ghi chưa xác minh.

Audio, manifest, transcript và kết quả thô bị gitignore mặc định.
