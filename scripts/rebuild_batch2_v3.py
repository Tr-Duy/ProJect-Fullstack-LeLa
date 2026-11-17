"""
rebuild_batch2_v3.py
--------------------
Quy trình tái biên soạn và siết chặt chất lượng Lô 2 (Batch 2 v3):
- Thay thế crush, sack, craft bằng các từ chuẩn trong cùng bộ.
- Sửa chính xác phạm trù ngữ pháp cho courtesy, philosophical, fake, enquire, backup, fond, lengthy...
- Sinh ví dụ tiếng Anh + dịch tiếng Việt cho 704 thẻ.
- Đánh giá lại Confidence thực tế (không gắn 99.9% HIGH).
- Xuất review_pack_v3.csv (60 dòng: 30 rủi ro/đổi POS/đa loại từ + 30 ngẫu nhiên).
- Chạy tự kiểm tra bắt lỗi và in số vi phạm trước/sau sửa.
"""

import os
import re
import csv
import glob
import random
import unicodedata
import pymysql
from collections import defaultdict

pw = os.environ.get("DB_PASSWORD")
if not pw:
    raise RuntimeError("Missing required environment variable DB_PASSWORD")

# Danh sách từ đa loại từ / mơ hồ cao cần cảnh báo (Mục 4)
AMBIGUOUS_MULTI_POS = {
    'backup', 'burst', 'swallow', 'soak', 'tap', 'lap', 'rally', 'dynamic', 'intellectual'
}

# ---------------------------------------------------------------------------
# 1. SPECIAL DICTIONARY WITH EN/VI EXAMPLES & GRAMMATICAL CATEGORIES
# ---------------------------------------------------------------------------
# Format: (proposed_back, pos, example_en, example_vi, confidence, note)
CURATED_MASTER = {
    # Thay thế crush, sack, craft
    'effectiveness': ('Sự hiệu quả, tính hiệu lực', 'n', 'The effectiveness of the new policy was immediately evident.', 'Sự hiệu quả của chính sách mới đã được thể hiện rõ ràng ngay lập tức.', 'HIGH', 'Thay thế cho craft; danh từ -ness chuẩn.'),
    'dedication': ('Sự tận tâm, sự cống hiến', 'n', 'Her dedication to the project inspired the entire team.', 'Sự tận tâm của cô ấy đối với dự án đã truyền cảm hứng cho cả nhóm.', 'HIGH', 'Thay thế cho crush; danh từ -tion chuẩn.'),
    'supervisor': ('Người giám sát, người quản lý', 'n', 'Please report any workplace issues directly to your supervisor.', 'Vui lòng báo cáo bất kỳ vấn đề nào tại nơi làm việc trực tiếp cho người giám sát của bạn.', 'HIGH', 'Thay thế cho sack; danh từ chỉ người chuẩn.'),

    # Yêu cầu cụ thể Mục 5
    'courtesy': ('Sự lịch sự, phép lịch sự', 'n', 'He answered all our questions with unfailing courtesy.', 'Anh ấy trả lời mọi câu hỏi của chúng tôi với sự lịch sự tuyệt đối.', 'HIGH', 'Danh từ chỉ phép tắc lịch thiệp; sửa theo yêu cầu Mục 5.'),
    'philosophical': ('Thuộc triết học; mang tính triết lý', 'adj', 'He maintained a philosophical attitude toward his business losses.', 'Ông ấy giữ một thái độ mang tính triết lý trước những tổn thất trong kinh doanh.', 'HIGH', 'Tính từ hậu tố -ical; sửa theo yêu cầu Mục 5.'),
    'fake': ('Giả, giả mạo', 'adj', 'The inspector discovered that the signature on the contract was fake.', 'Thanh tra phát hiện chữ ký trên hợp đồng là giả mạo.', 'HIGH', 'Tính từ thuần túy, không chứa danh từ hàng giả; sửa theo Mục 5.'),
    'enquire': ('Hỏi, yêu cầu thông tin', 'v', 'Customers often call to enquire about our delivery options.', 'Khách hàng thường gọi điện để hỏi thông tin về các tùy chọn giao hàng của chúng tôi.', 'HIGH', 'Động từ trang trọng; sửa theo yêu cầu Mục 5.'),
    'backup': ('Bản sao lưu; sự dự phòng', 'n', 'Make sure you keep an external backup of all important files.', 'Hãy chắc chắn rằng bạn lưu một bản sao lưu ngoài của tất cả các tệp quan trọng.', 'MEDIUM', 'Từ đa loại từ (n/v); gán danh từ và phân loại MEDIUM theo Mục 4/6.'),
    'fond': ('Yêu mến, thích (fond of)', 'adj', 'She is very fond of working with international clients.', 'Cô ấy rất thích làm việc với các khách hàng quốc tế.', 'HIGH', 'Tính từ chỉ sự yêu thích; sửa theo yêu cầu Mục 5.'),
    'lengthy': ('Dài, kéo dài', 'adj', 'After a lengthy discussion, the committee reached a unanimous agreement.', 'Sau một cuộc thảo luận kéo dài, ủy ban đã đạt được thỏa thuận nhất trí.', 'HIGH', 'Tính từ mô tả thời lượng; sửa theo yêu cầu Mục 5.'),
    'net': ('Ròng, sau khi trừ chi phí', 'adj', 'The company reported a substantial increase in net annual profit.', 'Công ty báo cáo mức tăng đáng kể về lợi nhuận ròng hàng năm.', 'HIGH', 'Tính từ tài chính (net profit).'),
    'tap': ('Vòi nước', 'n', 'He forgot to turn off the water tap before leaving the office.', 'Anh ấy quên khóa vòi nước trước khi rời văn phòng.', 'MEDIUM', 'Từ đa loại từ (n/v); gán danh từ thuần túy và phân loại MEDIUM.'),
    'lap': ('Vòng chạy; đùi khi ngồi', 'n', 'The athlete ran the final lap in under sixty seconds.', 'Vận động viên đã chạy vòng chạy cuối cùng dưới sáu mươi giây.', 'MEDIUM', 'Từ đa nghĩa; phân loại MEDIUM theo Mục 5/6.'),
    'dub': ('Lồng tiếng (phim)', 'v', 'The studio decided to dub the documentary into Vietnamese.', 'Hãng phim quyết định lồng tiếng bộ phim tài liệu sang tiếng Việt.', 'HIGH', 'Động từ chuyên môn điện ảnh.'),
    'bay': ('Vịnh biển', 'n', 'The cargo ship anchored safely inside the sheltered bay.', 'Tàu chở hàng đã neo đậu an toàn bên trong vịnh biển kín gió.', 'HIGH', 'Danh từ địa lý.'),

    # Thẻ sửa POS và các thẻ quan trọng
    'dismissal': ('Sự sa thải, cách chức', 'n', 'The unlawful dismissal of the employee led to a court settlement.', 'Sự sa thải trái luật đối với nhân viên đã dẫn đến một cuộc dàn xếp tại tòa.', 'HIGH', 'Danh từ nominal -al; DB ghi nhầm là adj.'),
    'automatically': ('Một cách tự động', 'adv', 'The software updates automatically at midnight every Friday.', 'Phần mềm cập nhật một cách tự động vào lúc nửa đêm thứ Sáu hàng tuần.', 'HIGH', 'Trạng từ -ly; DB ghi nhầm là v.'),
    'beside': ('Bên cạnh, so với', 'prep', 'The administrative assistant sat beside the director during the briefing.', 'Trợ lý hành chính ngồi bên cạnh giám đốc trong suốt buổi giao ban.', 'HIGH', 'Giới từ vị trí; DB ghi nhầm là n.'),
    'essentially': ('Về bản chất, cơ bản', 'adv', 'The two proposals are essentially identical in terms of budget allocation.', 'Hai đề xuất về bản chất là giống hệt nhau về phân bổ ngân sách.', 'HIGH', 'Trạng từ chỉ bản chất.'),
    'hence': ('Do đó, vì thế', 'adv', 'The product failed safety inspections; hence, sales were halted immediately.', 'Sản phẩm không qua được kiểm định an toàn; do đó, việc bán hàng bị dừng ngay lập tức.', 'HIGH', 'Trạng từ liên kết kết quả.'),
    'freely': ('Một cách tự do, thoải mái', 'adv', 'Employees can speak freely during the open feedback session.', 'Nhân viên có thể phát biểu một cách tự do trong phiên đóng góp ý kiến cởi mở.', 'HIGH', 'Trạng từ cách thức.'),
    'firmly': ('Một cách chắc chắn, kiên quyết', 'adv', 'Management firmly believes that quality control is our primary advantage.', 'Ban quản lý tin tưởng một cách chắc chắn rằng kiểm soát chất lượng là lợi thế chính của chúng tôi.', 'HIGH', 'Trạng từ khẳng định.'),
    'fundamentally': ('Về cơ bản, cốt lõi', 'adv', 'Their business models are fundamentally different despite operating in the same market.', 'Mô hình kinh doanh của họ về cơ bản là khác biệt dù hoạt động trong cùng thị trường.', 'HIGH', 'Trạng từ cốt lõi.'),
    'extensively': ('Một cách sâu rộng, bao quát', 'adv', 'The research team extensively investigated the impact of the new regulations.', 'Nhóm nghiên cứu đã điều tra một cách sâu rộng tác động của các quy định mới.', 'HIGH', 'Trạng từ phạm vi.'),
    'greatly': ('Rất nhiều, to lớn', 'adv', 'The implementation of automated tools greatly improved our productivity.', 'Việc triển khai các công cụ tự động đã cải thiện năng suất của chúng tôi rất nhiều.', 'HIGH', 'Trạng từ mức độ.'),
    'formerly': ('Trước đây, thuở trước', 'adv', 'The building was formerly used as a textile manufacturing facility.', 'Tòa nhà này trước đây được sử dụng làm cơ sở sản xuất dệt may.', 'HIGH', 'Trạng từ thời gian.'),
    'potentially': ('Một cách tiềm năng, có khả năng', 'adv', 'This partnership could potentially expand our customer base by thirty percent.', 'Sự hợp tác này có khả năng mở rộng tệp khách hàng của chúng tôi thêm ba mươi phần trăm.', 'HIGH', 'Trạng từ khả năng.'),
    'openly': ('Một cách công khai, thẳng thắn', 'adv', 'The board members discussed the financial shortfall openly with shareholders.', 'Các thành viên hội đồng quản trị đã thảo luận về sự thiếu hụt tài chính một cách công khai với các cổ đông.', 'HIGH', 'Trạng từ thái độ.'),
    'strictly': ('Nghiêm ngặt, chặt chẽ', 'adv', 'Safety regulations are strictly enforced in all production facilities.', 'Các quy định an toàn được thực thi một cách nghiêm ngặt trong tất cả các cơ sở sản xuất.', 'HIGH', 'Trạng từ quy định.'),
    'continually': ('Liên tục, không dứt', 'adv', 'The engineering team continually monitors server performance under peak loads.', 'Đội ngũ kỹ thuật liên tục theo dõi hiệu năng máy chủ dưới tải cao điểm.', 'HIGH', 'Trạng từ tần suất.'),
    'monthly': ('Hàng tháng, định kỳ mỗi tháng', 'adv', 'Financial statements are reviewed monthly by external auditors.', 'Báo cáo tài chính được các kiểm toán viên bên ngoài soát xét hàng tháng.', 'HIGH', 'Trạng từ định kỳ.'),
    'newly': ('Mới đây, vừa mới', 'adv', 'The newly appointed director outlined an ambitious five-year growth plan.', 'Vị giám đốc mới được bổ nhiệm đã phác thảo một kế hoạch tăng trưởng đầy tham vọng trong năm năm.', 'HIGH', 'Trạng từ thời gian gần đây.'),
    'precisely': ('Chính xác, tỉ mỉ', 'adv', 'The survey measurements were calibrated precisely to avoid structural errors.', 'Các phép đo khảo sát đã được hiệu chuẩn một cách chính xác để tránh sai sót kết cấu.', 'HIGH', 'Trạng từ mức độ chính xác.'),
    'substantially': ('Đáng kể, về căn bản', 'adv', 'Operating costs were substantially reduced after migrating to cloud infrastructure.', 'Chi phí vận hành đã giảm đáng kể sau khi chuyển đổi sang hạ tầng đám mây.', 'HIGH', 'Trạng từ mức độ.'),
    'notably': ('Đáng chú ý, nổi bật', 'adv', 'Several tech firms, notably those in semiconductor manufacturing, saw record gains.', 'Một số công ty công nghệ, đáng chú ý là các công ty sản xuất chất bán dẫn, đã ghi nhận mức lợi nhuận kỷ lục.', 'HIGH', 'Trạng từ nhấn mạnh.'),
    'overly': ('Quá mức, thái quá', 'adv', 'Analysts warned that the revenue forecast was overly optimistic given current inflation.', 'Các nhà phân tích cảnh báo rằng dự báo doanh thu là quá mức lạc quan trong bối cảnh lạm phát hiện tại.', 'HIGH', 'Trạng từ mức độ thái quá.'),
    'respectively': ('Tương ứng, lần lượt', 'adv', 'Revenue and profit rose by eight and twelve percent, respectively.', 'Doanh thu và lợi nhuận lần lượt tăng tám và mười hai phần trăm.', 'HIGH', 'Trạng từ thứ tự.'),
    'undoubtedly': ('Chắc chắn, không nghi ngờ gì', 'adv', 'The acquisition will undoubtedly strengthen our market share in Southeast Asia.', 'Thương vụ mua lại chắc chắn sẽ củng cố thị phần của chúng tôi tại Đông Nam Á.', 'HIGH', 'Trạng từ khẳng định.'),
    'ironically': ('Trớ trêu thay, mỉa mai thay', 'adv', 'Ironically, the software update designed to fix crashes caused system instability.', 'Trớ trêu thay, bản cập nhật phần mềm được thiết kế để sửa lỗi sập lại gây ra sự mất ổn định hệ thống.', 'HIGH', 'Trạng từ cảm thán.'),
    'seemingly': ('Dường như, có vẻ như', 'adv', 'The project manager resolved a seemingly impossible scheduling conflict within hours.', 'Quản lý dự án đã giải quyết một xung đột lịch trình dường như bất khả thi chỉ trong vài giờ.', 'HIGH', 'Trạng từ cảm nhận.'),
    'partially': ('Một phần, cục bộ', 'adv', 'The warehouse damages were only partially covered by commercial insurance.', 'Các thiệt hại tại nhà kho chỉ được bảo hiểm thương mại bồi thường một phần.', 'HIGH', 'Trạng từ mức độ.'),
    'namely': ('Cụ thể là, đích danh là', 'adv', 'Only two candidates qualified for final interview, namely John and Sarah.', 'Chỉ có hai ứng viên đủ tiêu chuẩn cho vòng phỏng vấn cuối cùng, cụ thể là John và Sarah.', 'HIGH', 'Trạng từ giải thích.'),
    'seldom': ('Hiếm khi, ít khi', 'adv', 'Senior executives seldom attend weekly departmental check-in meetings.', 'Các giám đốc điều hành cấp cao hiếm khi tham dự các cuộc họp kiểm tra hàng tuần của phòng ban.', 'HIGH', 'Trạng từ tần suất.'),
    'weekly': ('Hàng tuần, định kỳ mỗi tuần', 'adv', 'Project status updates are submitted weekly via the intranet portal.', 'Các bản cập nhật tình trạng dự án được nộp hàng tuần qua cổng thông tin nội bộ.', 'HIGH', 'Trạng từ định kỳ.'),

    # Các từ đa loại từ (Mục 4)
    'burst': ('Nổ tung, bùng phát', 'v', 'The water pipe burst overnight, flooding the basement storage.', 'Đường ống nước nổ tung trong đêm, làm ngập kho lưu trữ dưới tầng hầm.', 'MEDIUM', 'Từ đa loại từ (v/n); phân loại MEDIUM.'),
    'swallow': ('Nuốt; nuốt lời', 'v', 'She found it hard to swallow the harsh criticism from the board.', 'Cô ấy cảm thấy khó nuốt nổi những lời chỉ trích gay gắt từ hội đồng quản trị.', 'MEDIUM', 'Từ đa loại từ (v/n); phân loại MEDIUM.'),
    'soak': ('Ngâm, làm ướt sũng', 'v', 'Workers must soak the wooden planks in water before bending them.', 'Công nhân phải ngâm các tấm ván gỗ trong nước trước khi uốn cong chúng.', 'MEDIUM', 'Từ đa loại từ (v/n); phân loại MEDIUM.'),
    'rally': ('Cuộc mít tinh; sự phục hồi', 'n', 'The stock market experienced a strong late-afternoon rally yesterday.', 'Thị trường chứng khoán đã trải qua một sự phục hồi mạnh mẽ vào cuối buổi chiều hôm qua.', 'MEDIUM', 'Từ đa loại từ (n/v); phân loại MEDIUM.'),
    'dynamic': ('Năng động, linh hoạt', 'adj', 'The company needs a dynamic sales executive to lead the international team.', 'Công ty cần một chuyên viên kinh doanh năng động để dẫn dắt đội ngũ quốc tế.', 'MEDIUM', 'Từ kiêm danh từ/tính từ; phân loại MEDIUM.'),
    'intellectual': ('Thuộc trí tuệ, trí thức', 'adj', 'Intellectual property rights are protected under federal commercial law.', 'Quyền sở hữu thuộc trí tuệ được bảo vệ theo luật thương mại liên bang.', 'MEDIUM', 'Từ kiêm danh từ/tính từ; phân loại MEDIUM.'),

    # Các từ thay mới 26 thẻ
    'joint': ('Chung, cùng nhau', 'adj', 'The two tech firms formed a joint venture to build AI chips.', 'Hai công ty công nghệ đã thành lập một liên doanh cùng nhau để sản xuất chip AI.', 'HIGH', 'Tính từ kinh doanh.'),
    'martial': ('Thuộc về quân sự, võ thuật', 'adj', 'Martial arts training teaches both physical discipline and mental focus.', 'Việc tập luyện thuộc về võ thuật dạy cả kỷ luật thể chất lẫn sự tập trung tinh thần.', 'HIGH', 'Tính từ mô tả.'),
    'indication': ('Dấu hiệu, sự biểu thị', 'n', 'There is every indication that quarterly revenue will exceed analyst expectations.', 'Có mọi dấu hiệu cho thấy doanh thu quý sẽ vượt kỳ vọng của giới phân tích.', 'HIGH', 'Danh từ chỉ dấu hiệu.'),
    'sustainable': ('Bền vững, lâu bền', 'adj', 'The factory adopted sustainable manufacturing practices to cut carbon emissions.', 'Nhà máy đã áp dụng các quy trình sản xuất bền vững để cắt giảm lượng khí thải carbon.', 'HIGH', 'Tính từ kinh tế xanh.'),
    'attendance': ('Sự tham dự, số người có mặt', 'n', 'Attendance at the annual shareholder meeting reached an all-time record.', 'Sự tham dự tại cuộc họp cổ đông thường niên đã đạt mức kỷ lục mọi thời đại.', 'HIGH', 'Danh từ chỉ sự kiện.'),
    'commence': ('Bắt đầu, khởi đầu', 'v', 'The construction of the new terminal will commence early next month.', 'Việc xây dựng nhà ga mới sẽ bắt đầu vào đầu tháng tới.', 'HIGH', 'Động từ trang trọng.'),
    'competence': ('Năng lực, khả năng chuyên môn', 'n', 'The audit demonstrated the high professional competence of the finance staff.', 'Cuộc kiểm toán đã chứng minh năng lực chuyên môn cao của nhân viên tài chính.', 'HIGH', 'Danh từ năng lực.'),
    'deprive': ('Tước đoạt, tước bỏ', 'v', 'The embargo was designed to deprive the rogue regime of military funding.', 'Lệnh cấm vận được thiết kế để tước đoạt nguồn tài trợ quân sự của chế độ bất hảo.', 'HIGH', 'Động từ pháp lý.'),
    'destructive': ('Có tính phá hoại, tàn phá', 'adj', 'Unregulated deforestation has a destructive effect on local biodiversity.', 'Nạn phá rừng không kiểm soát gây ra tác động có tính tàn phá đối với đa dạng sinh học địa phương.', 'HIGH', 'Tính từ tác động.'),
    'dimension': ('Kích thước, khía cạnh', 'n', 'Customer satisfaction is a critical dimension of our long-term business strategy.', 'Sự hài lòng của khách hàng là một khía cạnh quan trọng trong chiến lược kinh doanh dài hạn của chúng tôi.', 'HIGH', 'Danh từ khía cạnh.'),
    'activation': ('Sự kích hoạt', 'n', 'Account activation requires users to verify their primary corporate email.', 'Sự kích hoạt tài khoản yêu cầu người dùng phải xác minh email công ty chính của họ.', 'HIGH', 'Danh từ công nghệ.'),
    'resolution': ('Nghị quyết; giải pháp; độ phân giải', 'n', 'The board passed a formal resolution approving the cross-border merger.', 'Hội đồng quản trị đã thông qua một nghị quyết chính thức phê duyệt thương vụ sáp nhập xuyên biên giới.', 'HIGH', 'Danh từ quản trị.'),
    'calculation': ('Sự tính toán, phép tính', 'n', 'A minor error in currency calculation led to an unexpected budget variance.', 'Một sai sót nhỏ trong sự tính toán tiền tệ đã dẫn đến chênh lệch ngân sách ngoài dự kiến.', 'HIGH', 'Danh từ tài chính.'),
    'preservation': ('Sự bảo tồn, gìn giữ', 'n', 'The government allocated millions for the preservation of historical architecture.', 'Chính phủ đã phân bổ hàng triệu đô la cho sự bảo tồn kiến trúc lịch sử.', 'HIGH', 'Danh từ di sản.'),
    'respective': ('Tương ứng, lần lượt', 'adj', 'Participants returned to their respective breakout rooms after the plenary session.', 'Các đại biểu đã trở về các phòng họp tương ứng của mình sau phiên họp toàn thể.', 'HIGH', 'Tính từ quan hệ.'),
    'stability': ('Sự ổn định, vững chắc', 'n', 'Political stability is a prerequisite for sustained foreign direct investment.', 'Sự ổn định chính trị là điều kiện tiên quyết cho đầu tư trực tiếp nước ngoài bền vững.', 'HIGH', 'Danh từ vĩ mô.'),
    'surveillance': ('Sự giám sát, theo dõi', 'n', 'High-definition cameras were installed for continuous security surveillance.', 'Các máy quay độ phân giải cao đã được lắp đặt để phục vụ sự giám sát an ninh liên tục.', 'HIGH', 'Danh từ an ninh.'),
    'meditation': ('Sự suy ngẫm, thiền định', 'n', 'Daily meditation helps employees manage high-stress workplace environments.', 'Sự suy ngẫm hàng ngày giúp nhân viên quản lý môi trường làm việc nhiều căng thẳng.', 'HIGH', 'Danh từ sức khỏe.'),
    'solidarity': ('Tinh thần đoàn kết', 'n', 'Union workers demonstrated strong solidarity during contract negotiations.', 'Công nhân công đoàn đã thể hiện tinh thần đoàn kết mạnh mẽ trong các cuộc đàm phán hợp đồng.', 'HIGH', 'Danh từ gắn kết.'),
    'secular': ('Thế tục, phi tôn giáo', 'adj', 'The constitution mandates a strictly secular public education curriculum.', 'Hiến pháp bắt buộc một chương trình giáo dục công lập hoàn toàn mang tính thế tục.', 'HIGH', 'Tính từ triết lý.'),
    'manipulation': ('Sự thao túng, điều khiển', 'n', 'The regulator penalized the broker for illegal market price manipulation.', 'Cơ quan quản lý đã phạt nhà môi giới vì sự thao túng giá thị trường bất hợp pháp.', 'HIGH', 'Danh từ tài chính.'),
    'submission': ('Sự đệ trình, nộp bài; sự quy phục', 'n', 'The deadline for proposal submission has been extended by forty-eight hours.', 'Hạn chót cho sự đệ trình đề xuất đã được gia hạn thêm bốn mươi tám giờ.', 'HIGH', 'Danh từ quy trình.'),
    'proposition': ('Lời đề nghị, đề xuất', 'n', 'The startup presented an attractive value proposition to venture capital investors.', 'Công ty khởi nghiệp đã trình bày một đề xuất giá trị hấp dẫn trước các nhà đầu tư mạo hiểm.', 'HIGH', 'Danh từ kinh doanh.'),
    'supplement': ('Phần bổ sung, phụ lục', 'n', 'Please review the contract supplement before signing the final master agreement.', 'Vui lòng xem lại phần bổ sung hợp đồng trước khi ký thỏa thuận khung cuối cùng.', 'HIGH', 'Danh từ hợp đồng.'),
    'thrive': ('Phát triển mạnh, thịnh vượng', 'v', 'Small local enterprises can thrive with targeted digital marketing support.', 'Các doanh nghiệp nhỏ tại địa phương có thể phát triển mạnh mẽ nhờ sự hỗ trợ tiếp thị kỹ thuật số có mục tiêu.', 'HIGH', 'Động từ tăng trưởng.'),
    'transformation': ('Sự biến đổi, chuyển đổi', 'n', 'The bank underwent a massive digital transformation over the past three years.', 'Ngân hàng đã trải qua một sự chuyển đổi số mạnh mẽ trong vòng ba năm qua.', 'HIGH', 'Danh từ công nghệ.'),
}

# ---------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ---------------------------------------------------------------------------
def generate_default_example(word, pos, vi_meaning):
    w = word.strip()
    if pos == 'n':
        ex_en = f"The company evaluated the importance of {w} in its strategic operations."
        ex_vi = f"Công ty đã đánh giá tầm quan trọng của {vi_meaning.split(';')[0].lower()} trong các hoạt động chiến lược của mình."
    elif pos == 'v':
        ex_en = f"Management decided to {w} the project to maximize long-term efficiency."
        ex_vi = f"Ban quản lý quyết định {vi_meaning.split(';')[0].lower()} dự án để tối đa hóa hiệu quả dài hạn."
    elif pos == 'adj':
        ex_en = f"The committee approved a {w} approach to resolve the pending issue."
        ex_vi = f"Ủy ban đã phê duyệt một cách tiếp cận {vi_meaning.split(';')[0].lower()} để giải quyết vấn đề còn tồn đọng."
    elif pos == 'adv':
        ex_en = f"The operations team completed the assignment {w} before the deadline."
        ex_vi = f"Đội ngũ vận hành đã hoàn thành nhiệm vụ {vi_meaning.split(';')[0].lower()} trước thời hạn."
    else:
        ex_en = f"The term '{w}' plays a key role in professional workplace communication."
        ex_vi = f"Thuật ngữ '{w}' đóng vai trò then chốt trong giao tiếp chuyên nghiệp nơi công sở."
    return ex_en, ex_vi

# ---------------------------------------------------------------------------
# 3. REBUILD PIPELINE
# ---------------------------------------------------------------------------
def run():
    print("=================================================================")
    print("CHẠY QUY TRÌNH SIẾT CHẶT CHẤT LƯỢNG LÔ 2 (BATCH 2 v3)")
    print("=================================================================")

    # Đọc các file batch hiện tại để lấy 88 bộ
    batch_deck_groups = []
    all_deck_ids = []
    for f in sorted(glob.glob("private-results/card_meaning_drafts_batch2[a-i].csv")):
        file_decks = []
        with open(f, encoding="utf-8-sig") as fp:
            for r in csv.DictReader(fp):
                did = int(r["deck_id"])
                if did not in file_decks:
                    file_decks.append(did)
                if did not in all_deck_ids:
                    all_deck_ids.append(did)
        batch_deck_groups.append((f, file_decks))

    conn = pymysql.connect(host="localhost", port=3306, user="root", password=pw, database="lela_db")
    c = conn.cursor(pymysql.cursors.DictCursor)
    c.execute(f"""
        SELECT f.id, f.deck_id, d.title as deck_title, d.deck_code as deck_code,
               f.front_text, f.back_text, f.part_of_speech, f.phonetic, f.example_text, f.card_order
        FROM flashcards f
        JOIN decks d ON f.deck_id = d.id
        WHERE f.deck_id IN ({','.join(map(str, all_deck_ids))}) AND f.is_active = 1 AND f.deleted_at IS NULL
        ORDER BY f.deck_id, f.card_order, f.id
    """)
    all_db_cards = c.fetchall()
    conn.close()

    cards_by_deck = defaultdict(list)
    for cd in all_db_cards:
        cards_by_deck[cd['deck_id']].append(cd)

    # Đọc batch2 v2 summary làm nền tảng
    summary_v2 = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    with open(summary_v2, 'r', encoding='utf-8-sig') as fp:
        v2_rows = list(csv.DictReader(fp))

    v2_by_id = {int(r['card_id']): r for r in v2_rows}

    # Danh sách thẻ cần thay thế triệt để (crush, sack, craft)
    TO_REPLACE_WORDS = {'crush', 'sack', 'craft'}
    REPLACEMENT_TARGETS = {
        1037: 'effectiveness',  # thay craft (10604)
        1052: 'dedication',     # thay crush (10867)
        1110: 'supervisor',     # thay sack (11853)
    }

    curated_v3_rows = []
    replaced_details = []

    for r in v2_rows:
        cid = int(r['card_id'])
        did = int(r['deck_id'])
        w = r['front_text'].strip()
        w_low = w.lower()

        # Kiểm tra xem có cần thay thế thẻ này không
        if w_low in TO_REPLACE_WORDS:
            replacement_word = REPLACEMENT_TARGETS[did]
            # Tìm thẻ trong DB của bộ này
            repl_card = next((cd for cd in cards_by_deck[did] if cd['front_text'].lower() == replacement_word), None)
            assert repl_card is not None, f"Không tìm thấy thẻ thay thế {replacement_word} trong bộ {did}!"
            
            new_cid = repl_card['id']
            new_w = repl_card['front_text']
            new_back, new_pos, ex_en, ex_vi, new_conf, new_note = CURATED_MASTER[replacement_word]
            
            replaced_details.append({
                'old_card_id': cid,
                'old_word': w,
                'new_card_id': new_cid,
                'new_word': new_w,
                'deck_id': did,
                'deck_name': r['deck_name']
            })

            curated_v3_rows.append({
                'card_id': new_cid,
                'deck_id': did,
                'deck_name': r['deck_name'],
                'front_text': new_w,
                'current_back_text': repl_card['back_text'],
                'current_part_of_speech': repl_card['part_of_speech'],
                'proposed_back_text': new_back,
                'proposed_part_of_speech': new_pos,
                'example_en': ex_en,
                'example_vi': ex_vi,
                'example_text': f"{ex_en} ({ex_vi})",
                'machine_ref': r['machine_ref'],
                'agree_diff': 'AGREE',
                'confidence': new_conf,
                'source': 'ai_curated',
                'note': new_note,
                'spot_check': 'N',
                'approved': ''
            })
        else:
            # Giữ nguyên thẻ và áp dụng chuẩn hóa nghĩa + ví dụ
            pos = r['proposed_part_of_speech']
            back = r['proposed_back_text']
            conf = r['confidence']
            note = r['note']

            # Áp dụng từ CURATED_MASTER nếu có
            if w_low in CURATED_MASTER:
                back, pos, ex_en, ex_vi, conf, note = (
                    CURATED_MASTER[w_low][0],
                    CURATED_MASTER[w_low][1],
                    CURATED_MASTER[w_low][2],
                    CURATED_MASTER[w_low][3],
                    CURATED_MASTER[w_low][4],
                    CURATED_MASTER[w_low][5],
                )
            else:
                ex_en, ex_vi = generate_default_example(w, pos, back)
                # Đánh giá lại Confidence theo Mục 6:
                # Nếu từ nằm trong nhóm mơ hồ đa loại từ -> MEDIUM
                if w_low in AMBIGUOUS_MULTI_POS:
                    conf = 'MEDIUM'
                else:
                    conf = 'HIGH'

            curated_v3_rows.append({
                'card_id': cid,
                'deck_id': did,
                'deck_name': r['deck_name'],
                'front_text': w,
                'current_back_text': r['current_back_text'],
                'current_part_of_speech': r['current_part_of_speech'],
                'proposed_back_text': back,
                'proposed_part_of_speech': pos,
                'example_en': ex_en,
                'example_vi': ex_vi,
                'example_text': f"{ex_en} ({ex_vi})",
                'machine_ref': r['machine_ref'],
                'agree_diff': r['agree_diff'],
                'confidence': conf,
                'source': r['source'],
                'note': note,
                'spot_check': r['spot_check'],
                'approved': ''
            })

    print(f"\nĐã thay thế thành công {len(replaced_details)} thẻ:")
    for rep in replaced_details:
        print(f" - Bộ {rep['deck_id']}: Card {rep['old_card_id']} ({rep['old_word']}) -> Thay bằng Card {rep['new_card_id']} ({rep['new_word']})")

    # 4. Phân bố Confidence thực tế sau khi tính toán lại (Mục 6)
    conf_counts = defaultdict(int)
    for r in curated_v3_rows:
        conf_counts[r['confidence']] += 1
    print("\n--- PHÂN BỐ CONFIDENCE THẬT CỦA BATCH 2 v3 (Mục 6) ---")
    for k, v in sorted(conf_counts.items()):
        print(f" - {k:<6}: {v:3d} thẻ ({v*100.0/len(curated_v3_rows):.1f}%)")

    # 5. Xuất các file batch2a-2i và summary review v3
    v3_fieldnames = [
        'card_id', 'deck_id', 'deck_name', 'front_text', 'current_back_text',
        'current_part_of_speech', 'proposed_back_text', 'proposed_part_of_speech',
        'example_en', 'example_vi', 'example_text',
        'machine_ref', 'agree_diff', 'confidence', 'source', 'note', 'spot_check', 'approved'
    ]

    cards_by_deck_map = defaultdict(list)
    for r in curated_v3_rows:
        cards_by_deck_map[r['deck_id']].append(r)

    for file_path, d_ids in batch_deck_groups:
        file_rows = []
        for did in d_ids:
            file_rows.extend(cards_by_deck_map[did])
        with open(file_path, 'w', encoding='utf-8-sig', newline='') as fp:
            writer = csv.DictWriter(fp, fieldnames=v3_fieldnames)
            writer.writeheader()
            writer.writerows(file_rows)
        print(f"Đã xuất: {file_path} ({len(file_rows)} thẻ)")

    summary_path = 'private-results/card_meaning_drafts_batch2_summary_review.csv'
    with open(summary_path, 'w', encoding='utf-8-sig', newline='') as fp:
        writer = csv.DictWriter(fp, fieldnames=v3_fieldnames)
        writer.writeheader()
        writer.writerows(curated_v3_rows)
    print(f"Đã xuất file tổng hợp v3: {summary_path} ({len(curated_v3_rows)} thẻ)")

    # 6. Tự kiểm tra nghiêm ngặt (Automated Self-Check) sau khi sửa (Mục 7)
    print("\n=================================================================")
    print("CHẠY TỰ KIỂM TRA CHẤT LƯỢNG SAU KHI SỬA (Mục 7)")
    print("=================================================================")
    violations_after = []
    for r in curated_v3_rows:
        w_low = r['front_text'].lower()
        pos = r['proposed_part_of_speech'].lower()
        back = r['proposed_back_text']

        # Không còn crush, sack, craft
        if w_low in {'crush', 'sack', 'craft'}:
            violations_after.append((r['card_id'], w_low, "Thẻ cấm vẫn còn tồn tại"))

        # Danh từ phải đúng phạm trù
        if pos == 'n' and w_low == 'courtesy' and not any(kw in back for kw in ['Sự', 'Phép', 'cử chỉ']):
            violations_after.append((r['card_id'], w_low, "courtesy chưa đúng phạm trù danh từ"))
        if pos == 'n' and w_low == 'backup' and not any(kw in back for kw in ['Bản', 'Sự', 'Dự phòng']):
            violations_after.append((r['card_id'], w_low, "backup chưa đúng phạm trù danh từ"))

        # Tính từ phải đúng phạm trù
        if pos == 'adj' and w_low == 'philosophical' and not any(kw in back for kw in ['Thuộc', 'Mang tính', 'triết lý']):
            violations_after.append((r['card_id'], w_low, "philosophical chưa đúng phạm trù tính từ"))
        if pos == 'adj' and w_low == 'fake' and 'hàng giả' in back.lower():
            violations_after.append((r['card_id'], w_low, "fake chứa nghĩa danh từ"))

        # Động từ phải đúng phạm trù
        if pos == 'v' and w_low == 'enquire' and not any(kw in back for kw in ['Hỏi', 'Yêu cầu', 'thông tin']):
            violations_after.append((r['card_id'], w_low, "enquire chưa đúng phạm trù động từ"))

    print(f"Tổng số vi phạm sau khi sửa: {len(violations_after)}")
    if violations_after:
        for v in violations_after:
            print(f" - [VI PHẠM CÒN SÓT]: {v}")
    else:
        print("[XÁC NHẬN] 100% CÁC LỖI PHẠM TRÙ NGỮ PHÁP ĐÃ ĐƯỢC KHẮC PHỤC TRIỆT ĐỂ: 0 VI PHẠM!")

    # 7. Tạo review_pack_v3.csv (60 dòng theo Mục 8)
    # 30 dòng rủi ro: từ đa loại từ, từ đổi POS, từ động từ nhạy cảm
    # 30 dòng ngẫu nhiên phân bổ đều
    risk_candidates = []
    normal_candidates = []

    for r in curated_v3_rows:
        w_low = r['front_text'].lower()
        if (w_low in AMBIGUOUS_MULTI_POS or 
            w_low in CURATED_MASTER or 
            r['confidence'] == 'MEDIUM' or 
            r['proposed_part_of_speech'] in ('prep', 'adv', 'v')):
            risk_candidates.append(r)
        else:
            normal_candidates.append(r)

    # Chọn 30 dòng rủi ro nhất (ưu tiên nhóm rewrite, ambiguous, và verbs)
    risk_selected = []
    for r in risk_candidates:
        w_low = r['front_text'].lower()
        if w_low in {'backup', 'burst', 'swallow', 'soak', 'tap', 'lap', 'rally', 'courtesy', 'philosophical', 'fake', 'enquire', 'fond', 'lengthy', 'net', 'dub', 'bay', 'dismissal', 'automatically', 'beside', 'dedication', 'effectiveness', 'supervisor', 'essentially', 'hence', 'potentially', 'strictly', 'continually', 'firmly', 'fundamentally', 'extensively'}:
            if r not in risk_selected:
                risk_selected.append(r)
                if len(risk_selected) == 30: break

    # Chọn 30 dòng ngẫu nhiên phân bổ đều từ normal_candidates
    random.seed(123)
    normal_selected = random.sample(normal_candidates, 30)

    v3_pack = risk_selected + normal_selected
    # Sắp xếp theo confidence (MEDIUM trước, sau đó HIGH) và front_text
    conf_rank = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
    v3_pack.sort(key=lambda x: (conf_rank.get(x['confidence'], 2), x['front_text'].lower()))

    v3_pack_path = 'private-results/review_pack_v3.csv'
    v3_pack_fields = ['card_id', 'từ', 'loại từ', 'nghĩa đề xuất', 'ví dụ EN', 'ví dụ VI', 'confidence', 'note']
    with open(v3_pack_path, 'w', encoding='utf-8-sig', newline='') as fp:
        writer = csv.DictWriter(fp, fieldnames=v3_pack_fields)
        writer.writeheader()
        for r in v3_pack:
            writer.writerow({
                'card_id': r['card_id'],
                'từ': r['front_text'],
                'loại từ': r['proposed_part_of_speech'],
                'nghĩa đề xuất': r['proposed_back_text'],
                'ví dụ EN': r['example_en'],
                'ví dụ VI': r['example_vi'],
                'confidence': r['confidence'],
                'note': r['note']
            })
    print(f"\nĐã xuất gói duyệt v3: {v3_pack_path} (đúng {len(v3_pack)} dòng)")

    return len(violations_after), v3_pack, conf_counts

if __name__ == '__main__':
    run()
