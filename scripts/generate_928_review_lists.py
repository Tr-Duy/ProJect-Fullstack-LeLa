import json, re

with open("private-results/unreviewed_928_cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# Specific curated edits for cards with issues:
curated_proposals = {
    # 1. POS mismatch / definition style in TOEIC
    1181: ("Rút lui, rút khỏi", "Lệch loại từ (động từ nhưng nghĩa cũ mang hình thái danh từ 'Sự rút lui')"),
    1236: ("Chương trình nghị sự, nội dung cuộc họp", "Nghĩa gượng (câu giải nghĩa dài dòng kiểu từ điển, thiếu từ ngữ trọng tâm)"),
    1264: ("Đồng nhất, đều nhau", "Lệch loại từ (thẻ tính từ nhưng nhồi nhét cả nghĩa danh từ 'đồng phục' và định nghĩa dài)"),
    1312: ("Sự hoàn thành, sự hoàn tất", "Lệch loại từ (danh từ nhưng nghĩa cũ mang hình thái cụm động từ 'Làm cho đầy đủ')"),
    1367: ("Thời gian thực hiện, thời gian giao hàng", "Nghĩa gượng (câu giải thích dài thay vì thuật ngữ kinh doanh chuẩn)"),
    1381: ("Yêu cầu bồi thường; khẳng định", "Thiếu nghĩa chính (nghĩa 'Đòi' quá cụt, không phản ánh ngữ cảnh hợp đồng/bảo hiểm TOEIC)"),
    1176: ("Tiền quỹ, quỹ tài chính", "Thiếu nghĩa chính (nghĩa 'Quỹ' đơn lẻ, bổ sung ngữ cảnh tài chính)"),
    1194: ("Nợ, mang ơn", "Thiếu nghĩa chính (bổ sung nghĩa mang ơn/chịu ơn phổ biến)"),
    1216: ("Dịch thuật, phiên dịch", "Thiếu nghĩa chính (bổ sung dạng từ ghép rõ nghĩa)"),

    # 2. Slashes and English leaks in V40
    20012: ("Thư hỏi hàng, yêu cầu giải đáp", "Dùng dấu gạch chéo '/' và nghĩa chưa trau chuốt"),
    20013: ("Câu trả lời, thư hồi đáp", "Lệch loại từ (danh từ nhưng nghĩa cũ là động từ 'trả lời, hồi đáp')"),
    20017: ("Chuyển tiếp, gửi tiếp", "Lệch loại từ (gán loại từ n nhưng nghĩa là hành động chuyển tiếp)"),
    20030: ("Tuân theo, tôn trọng", "Lộ từ tiếng Anh ('contract') trong phần nghĩa tiếng Việt"),
    20041: ("Thư giới thiệu; người tham chiếu", "Dùng dấu gạch chéo '/'"),
    20048: ("Nộp đơn, đệ trình", "Lệch loại từ (thẻ gán nhầm n trong khi submit là động từ) và dùng dấu '/'"),
    20061: ("Thực tập sinh, người được đào tạo", "Dùng dấu gạch chéo '/'"),
    20064: ("Buổi học, phiên làm việc", "Dùng dấu gạch chéo '/'"),
    20077: ("Thói quen, công việc thường nhật", "Dùng dấu gạch chéo '/'"),
    20085: ("Tiền công theo giờ, tiền lương nhật", "Dùng dấu gạch chéo '/'"),
    20093: ("Tờ gấp giới thiệu, tập gấp quảng cáo", "Dùng dấu gạch chéo '/'"),
    20107: ("Người bán hàng, nhà cung cấp", "Dùng dấu gạch chéo '/'"),
    20114: ("Dịch vụ tiệc, dịch vụ ăn uống", "Dùng dấu gạch chéo '/'"),
    20134: ("Bị trì hoãn, chậm trễ", "Lệch loại từ (Delayed là tính từ/quá khứ phân từ nhưng gán nhầm n)"),
    20151: ("Đàn vĩ cầm", "Dùng dấu gạch chéo '/' và chứa từ phiên âm thừa 'vi-ô-lông'"),
    20160: ("Mi-crô, ống thu âm", "Dùng dấu gạch chéo '/'"),
    20179: ("Nhân viên trợ giúp khách hàng", "Nghĩa dài dòng kiểu giải thích"),

    # 3. Slashes and loanwords in other decks
    26: ("Bố, cha", "Dùng dấu gạch chéo '/'"),
    28: ("Anh trai, em trai", "Dùng dấu gạch chéo '/'"),
    29: ("Chị gái, em gái", "Dùng dấu gạch chéo '/'"),
    32: ("Cơm, gạo", "Dùng dấu gạch chéo '/'"),
    20188: ("Quả sung, quả vả", "Dùng dấu gạch chéo '/'"),
    20189: ("Hạt, quả hạch", "Dùng dấu gạch chéo '/'"),
    20194: ("Quả kiwi", "Giữ nguyên quả kiwi thuần túy nhưng cần loại bỏ cảnh báo trùng"),
    20199: ("Quả dưa gang, dưa lưới", "Dùng dấu gạch chéo '/'"),
    20207: ("Quả quất, quả tắc", "Dùng dấu gạch chéo '/'"),
    20211: ("Mãng cầu, quả na", "Dùng dấu gạch chéo '/'"),
    20216: ("Quả dứa, quả thơm", "Dùng dấu gạch chéo '/'"),
    20251: ("Con lợn, con heo", "Dùng dấu gạch chéo '/'"),
    20263: ("Con hươu, con nai", "Dùng dấu gạch chéo '/'"),
    20299: ("Kỳ nhông, sa giông", "Dùng dấu gạch chéo '/'"),
    10247: ("Hội chứng suy giảm miễn dịch", "Lộ từ tiếng Anh ('AIDS') trong phần nghĩa tiếng Việt"),
}

list_A = []
list_B = []

for c in cards:
    cid = c['id']
    f_text = c['front_text'].strip()
    pos = (c.get('part_of_speech') or '').strip()
    b_text = c['back_text'].strip()

    if cid in curated_proposals:
        prop_back, reason = curated_proposals[cid]
        list_A.append({
            'card_id': cid,
            'front': f_text,
            'pos': pos,
            'current_back': b_text,
            'proposed_back': prop_back,
            'reason': reason
        })
    else:
        list_B.append({
            'card_id': cid,
            'front': f_text,
            'pos': pos,
            'current_back': b_text
        })

print(f"Total processed: {len(list_A) + len(list_B)}")
print(f"List A (proposals): {len(list_A)}")
print(f"List B (stable): {len(list_B)}")

# Write text files
with open("private-results/unreviewed_928_list_A.txt", "w", encoding="utf-8") as fp:
    for item in list_A:
        fp.write(f"{item['card_id']}|{item['front']}|{item['pos']}|{item['current_back']}|{item['proposed_back']}|{item['reason']}\n")

with open("private-results/unreviewed_928_list_B.txt", "w", encoding="utf-8") as fp:
    for item in list_B:
        fp.write(f"{item['card_id']}|{item['front']}|{item['pos']}|{item['current_back']}\n")

print("Files successfully generated.")
