import os
import sys
import json
import pymysql

sys.stdout.reconfigure(encoding='utf-8')

# Database connection to check existing cards and avoid duplicates
conn = pymysql.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db',
    charset='utf8mb4'
)
cursor = conn.cursor()

# Get existing flashcard front_texts
cursor.execute("SELECT LOWER(TRIM(front_text)), id, deck_id FROM flashcards")
existing_cards_db = {row[0]: {'id': row[1], 'deck_id': row[2]} for row in cursor.fetchall()}

print(f"Loaded {len(existing_cards_db)} existing flashcards from DB.")

# Complete 17-Topic Level 1 (Dưới 500) Vocabulary Dataset
TOEIC_U500_DATA = [
    # 1. Computers - Electronics
    {"word": "Desktop", "pos": "n.", "translation": "máy tính để bàn", "phonetic": "/ˈdesk.tɒp/", "example": "Our office updated every desktop computer last week.", "topic": "Computers - Electronics"},
    {"word": "Keyboard", "pos": "n.", "translation": "bàn phím", "phonetic": "/ˈkiː.bɔːd/", "example": "Press the enter key on your keyboard to continue.", "topic": "Computers - Electronics"},
    {"word": "Monitor", "pos": "n.", "translation": "màn hình máy tính", "phonetic": "/ˈmɒn.ɪ.tər/", "example": "The graphics designer uses a dual monitor setup.", "topic": "Computers - Electronics"},
    {"word": "Printer", "pos": "n.", "translation": "máy in", "phonetic": "/ˈprɪn.tər/", "example": "Please send the report to the office printer.", "topic": "Computers - Electronics"},
    {"word": "Scanner", "pos": "n.", "translation": "máy quét tài liệu", "phonetic": "/ˈskæn.ər/", "example": "Use the scanner to save a digital copy of the contract.", "topic": "Computers - Electronics"},
    {"word": "Software", "pos": "n.", "translation": "phần mềm", "phonetic": "/ˈsɒft.weər/", "example": "We installed new accounting software yesterday.", "topic": "Computers - Electronics"},
    {"word": "Hardware", "pos": "n.", "translation": "phần cứng", "phonetic": "/ˈhɑːd.weər/", "example": "The IT team handles all hardware repairs.", "topic": "Computers - Electronics"},
    {"word": "Database", "pos": "n.", "translation": "cơ sở dữ liệu", "phonetic": "/ˈdeɪ.tə.beɪs/", "example": "All customer records are stored in a secure database.", "topic": "Computers - Electronics"},
    {"word": "Processor", "pos": "n.", "translation": "bộ xử lý", "phonetic": "/ˈprəʊ.ses.ər/", "example": "The new laptop features a high-speed processor.", "topic": "Computers - Electronics"},
    {"word": "Circuit", "pos": "n.", "translation": "mạch điện", "phonetic": "/ˈsɜː.kɪt/", "example": "An electrician repaired the broken power circuit.", "topic": "Computers - Electronics"},
    {"word": "Screen", "pos": "n.", "translation": "màn hình", "phonetic": "/skriːn/", "example": "Adjust the brightness of your display screen.", "topic": "Computers - Electronics"},
    {"word": "Battery", "pos": "n.", "translation": "pin, ắc quy", "phonetic": "/ˈbæt.ər.i/", "example": "The laptop battery lasts for over eight hours.", "topic": "Computers - Electronics"},
    {"word": "Cable", "pos": "n.", "translation": "dây cáp", "phonetic": "/ˈkeɪ.bəl/", "example": "Connect the network cable to your computer.", "topic": "Computers - Electronics"},
    {"word": "Device", "pos": "n.", "translation": "thiết bị", "phonetic": "/dɪˈvaɪs/", "example": "This electronic device saves energy.", "topic": "Computers - Electronics"},
    {"word": "Installation", "pos": "n.", "translation": "sự cài đặt", "phonetic": "/ˌɪn.stəˈleɪ.ʃən/", "example": "The software installation took only five minutes.", "topic": "Computers - Electronics"},

    # 2. Correspondence
    {"word": "Attachment", "pos": "n.", "translation": "tập tin đính kèm", "phonetic": "/əˈtætʃ.mənt/", "example": "Please review the email attachment before the meeting.", "topic": "Correspondence"},
    {"word": "Envelope", "pos": "n.", "translation": "phong bì thư", "phonetic": "/ˈen.vəl.əʊp/", "example": "Put the signed letter inside a stamped envelope.", "topic": "Correspondence"},
    {"word": "Recipient", "pos": "n.", "translation": "người nhận", "phonetic": "/rɪˈsɪp.i.ənt/", "example": "Verify the recipient address before mailing the package.", "topic": "Correspondence"},
    {"word": "Courier", "pos": "n.", "translation": "dịch vụ chuyển phát nhanh", "phonetic": "/ˈkʊr.i.ər/", "example": "The courier delivered the urgent document this morning.", "topic": "Correspondence"},
    {"word": "Postage", "pos": "n.", "translation": "bưu phí", "phonetic": "/ˈpəʊ.stɪdʒ/", "example": "How much postage is required for international mail?", "topic": "Correspondence"},
    {"word": "Newsletter", "pos": "n.", "translation": "bản tin định kỳ", "phonetic": "/ˈnjuːzˌlet.ər/", "example": "Subscribe to our monthly email newsletter for updates.", "topic": "Correspondence"},
    {"word": "Inquiry", "pos": "n.", "translation": "thư hỏi hàng / thắc mắc", "phonetic": "/ɪnˈkwaɪə.ri/", "example": "We received a client inquiry regarding product pricing.", "topic": "Correspondence"},
    {"word": "Reply", "pos": "v.", "translation": "trả lời, hồi đáp", "phonetic": "/rɪˈplaɪ/", "example": "Please reply to the manager email promptly.", "topic": "Correspondence"},
    {"word": "Memo", "pos": "n.", "translation": "thông báo nội bộ", "phonetic": "/ˈmem.əʊ/", "example": "The director sent an urgent memo to all staff.", "topic": "Correspondence"},
    {"word": "Correspondence", "pos": "n.", "translation": "thư từ, quan hệ thư từ", "phonetic": "/ˌkɒr.ɪˈspɒn.dəns/", "example": "Keep a file of all business correspondence.", "topic": "Correspondence"},
    {"word": "Stamp", "pos": "n.", "translation": "con tem bưu điện", "phonetic": "/stæmp/", "example": "Attach a postage stamp to the top right corner.", "topic": "Correspondence"},
    {"word": "Express mail", "pos": "n.", "translation": "thư chuyển phát nhanh", "phonetic": "/ɪkˈspres meɪl/", "example": "We sent the contract via express mail.", "topic": "Correspondence"},
    {"word": "Folder", "pos": "n.", "translation": "bìa hồ sơ, kẹp tài liệu", "phonetic": "/ˈfəʊl.dər/", "example": "Place the correspondence in the red folder.", "topic": "Correspondence"},
    {"word": "Forward", "pos": "v.", "translation": "chuyển tiếp thư", "phonetic": "/ˈfɔː.wəd/", "example": "Forward the message to the sales department.", "topic": "Correspondence"},
    {"word": "Draft", "pos": "n.", "translation": "bản thảo", "phonetic": "/drɑːft/", "example": "She prepared the first draft of the letter.", "topic": "Correspondence"},

    # 3. Media
    {"word": "Broadcast", "pos": "n.", "translation": "chương trình phát sóng", "phonetic": "/ˈbrɔːd.kɑːst/", "example": "The news broadcast started at six o'clock.", "topic": "Media"},
    {"word": "Journalism", "pos": "n.", "translation": "ngành báo chí", "phonetic": "/ˈdʒɜː.nə.lɪz.əm/", "example": "She studied journalism at the university.", "topic": "Media"},
    {"word": "Publishing", "pos": "n.", "translation": "ngành xuất bản", "phonetic": "/ˈpʌb.lɪ.ʃɪŋ/", "example": "The publishing company printed 10,000 book copies.", "topic": "Media"},
    {"word": "Commercial", "pos": "n.", "translation": "quảng cáo trên truyền hình", "phonetic": "/kəˈmɜː.ʃəl/", "example": "Our team created a 30-second TV commercial.", "topic": "Media"},
    {"word": "Reporter", "pos": "n.", "translation": "phóng viên", "phonetic": "/rɪˈpɔː.tər/", "example": "The news reporter interviewed the company president.", "topic": "Media"},
    {"word": "Editor", "pos": "n.", "translation": "biên tập viên", "phonetic": "/ˈed.ɪ.tər/", "example": "The Chief Editor reviewed the article before publication.", "topic": "Media"},
    {"word": "Headline", "pos": "n.", "translation": "tiêu đề bài báo", "phonetic": "/ˈhed.laɪn/", "example": "The breakthrough made front-page news headlines.", "topic": "Media"},
    {"word": "Coverage", "pos": "n.", "translation": "tin tức đưa báo chí", "phonetic": "/ˈkʌv.ər.ɪdʒ/", "example": "The event received extensive media coverage.", "topic": "Media"},
    {"word": "Interview", "pos": "n.", "translation": "cuộc phỏng vấn", "phonetic": "/ˈɪn.tə.vjuː/", "example": "The CEO gave a live radio interview.", "topic": "Media"},
    {"word": "Article", "pos": "n.", "translation": "bài báo, bài viết", "phonetic": "/ˈɑː.tɪ.kəl/", "example": "Read the latest article in today newspaper.", "topic": "Media"},
    {"word": "Channel", "pos": "n.", "translation": "kênh truyền hình", "phonetic": "/ˈtʃæn.əl/", "example": "Switch to channel 5 to watch the news.", "topic": "Media"},
    {"word": "Audience", "pos": "n.", "translation": "thính giả, khán giả", "phonetic": "/ˈɔː.di.əns/", "example": "The speaker addressed a large conference audience.", "topic": "Media"},
    {"word": "Press", "pos": "n.", "translation": "báo chí, giới truyền thông", "phonetic": "/pres/", "example": "The company held a press release conference.", "topic": "Media"},
    {"word": "Publication", "pos": "n.", "translation": "ấn phẩm, sự xuất bản", "phonetic": "/ˌpʌb.lɪˈkeɪ.ʃən/", "example": "This magazine is a popular monthly publication.", "topic": "Media"},
    {"word": "Subscriber", "pos": "n.", "translation": "người đăng ký mua báo/dịch vụ", "phonetic": "/səbˈskraɪ.bər/", "example": "The channel reached one million subscribers.", "topic": "Media"},

    # 4. Contracts
    {"word": "Abide by", "pos": "v.", "translation": "tuân theo, tôn trọng contract", "phonetic": "/əˈbaɪd baɪ/", "example": "Both parties agreed to abide by the contract terms.", "topic": "Contracts"},
    {"word": "Agreement", "pos": "n.", "translation": "hợp đồng, sự thỏa thuận", "phonetic": "/əˈɡriː.mənt/", "example": "They signed a formal legal agreement yesterday.", "topic": "Contracts"},
    {"word": "Assurance", "pos": "n.", "translation": "sự cam đoan, bảo đảm", "phonetic": "/əˈʃɔː.rəns/", "example": "The vendor gave an assurance of quality.", "topic": "Contracts"},
    {"word": "Obligation", "pos": "n.", "translation": "nghĩa vụ, trách nhiệm", "phonetic": "/ˌɒb.lɪˈɡeɪ.ʃən/", "example": "The tenant fulfilled all contractual obligations.", "topic": "Contracts"},
    {"word": "Provision", "pos": "n.", "translation": "điều khoản hợp đồng", "phonetic": "/prəˈvɪʒ.ən/", "example": "Read the financial provisions of the agreement.", "topic": "Contracts"},
    {"word": "Clause", "pos": "n.", "translation": "điều khoản", "phonetic": "/klɔːz/", "example": "Check clause 4 regarding termination rules.", "topic": "Contracts"},
    {"word": "Signature", "pos": "n.", "translation": "chữ ký", "phonetic": "/ˈsɪɡ.nə.tʃər/", "example": "The contract requires your authorized signature.", "topic": "Contracts"},
    {"word": "Party", "pos": "n.", "translation": "bên tham gia hợp đồng", "phonetic": "/ˈpɑː.ti/", "example": "Each party received a signed copy.", "topic": "Contracts"},
    {"word": "Specify", "pos": "v.", "translation": "ghi rõ, định rõ", "phonetic": "/ˈspes.ɪ.faɪ/", "example": "The contract specifies delivery dates clearly.", "topic": "Contracts"},
    {"word": "Warrant", "pos": "v.", "translation": "đảm bảo, chứng nhận", "phonetic": "/ˈwɒr.ənt/", "example": "The supplier warrants all products against defects.", "topic": "Contracts"},
    {"word": "Expiration", "pos": "n.", "translation": "sự hết hạn", "phonetic": "/ˌek.spɪˈreɪ.ʃən/", "example": "Renew the lease before its expiration date.", "topic": "Contracts"},
    {"word": "Terms", "pos": "n.", "translation": "các điều khoản", "phonetic": "/tɜːmz/", "example": "Negotiate better payment terms with suppliers.", "topic": "Contracts"},
    {"word": "Binding", "pos": "adj.", "translation": "có tính ràng buộc pháp lý", "phonetic": "/ˈbaɪn.dɪŋ/", "example": "This agreement is legally binding on both sides.", "topic": "Contracts"},
    {"word": "Breach", "pos": "n.", "translation": "sự vi phạm hợp đồng", "phonetic": "/briːtʃ/", "example": "Failure to pay is a breach of contract.", "topic": "Contracts"},
    {"word": "Cancel", "pos": "v.", "translation": "hủy bỏ", "phonetic": "/ˈkæn.səl/", "example": "You may cancel the agreement within 30 days.", "topic": "Contracts"},

    # 5. Applying and Interviewing
    {"word": "Applicant", "pos": "n.", "translation": "người nộp đơn xin việc", "phonetic": "/ˈæp.lɪ.kənt/", "example": "The successful applicant will start next Monday.", "topic": "Applying and Interviewing"},
    {"word": "Resume", "pos": "n.", "translation": "sơ yếu lý lịch, CV", "phonetic": "/ˈrez.juː.meɪ/", "example": "Send your resume and cover letter to HR.", "topic": "Applying and Interviewing"},
    {"word": "Candidate", "pos": "n.", "translation": "ứng viên", "phonetic": "/ˈkæn.dɪ.dət/", "example": "We interviewed three qualified candidates today.", "topic": "Applying and Interviewing"},
    {"word": "Qualifications", "pos": "n.", "translation": "bằng cấp, năng lực", "phonetic": "/ˌkwɒl.ɪ.fɪˈkeɪ.ʃənz/", "example": "She possesses excellent academic qualifications.", "topic": "Applying and Interviewing"},
    {"word": "Requirement", "pos": "n.", "translation": "yêu cầu công việc", "phonetic": "/rɪˈkwaɪə.mənt/", "example": "Fluency in English is a key job requirement.", "topic": "Applying and Interviewing"},
    {"word": "Reference", "pos": "n.", "translation": "thư giới thiệu / người tham chiếu", "phonetic": "/ˈref.ər.əns/", "example": "Please provide two professional references.", "topic": "Applying and Interviewing"},
    {"word": "Background", "pos": "n.", "translation": "lý lịch, kinh nghiệm tích lũy", "phonetic": "/ˈbæk.ɡraʊnd/", "example": "He has a strong background in sales.", "topic": "Applying and Interviewing"},
    {"word": "Portfolio", "pos": "n.", "translation": "hồ sơ năng lực mẫu", "phonetic": "/pɔːtˈfəʊ.li.əʊ/", "example": "The designer presented an impressive portfolio.", "topic": "Applying and Interviewing"},
    {"word": "Skill", "pos": "n.", "translation": "kỹ năng", "phonetic": "/skɪl/", "example": "Computer skills are essential for this role.", "topic": "Applying and Interviewing"},
    {"word": "Experience", "pos": "n.", "translation": "kinh nghiệm làm việc", "phonetic": "/ɪkˈspɪə.ri.əns/", "example": "Applicants need five years of marketing experience.", "topic": "Applying and Interviewing"},
    {"word": "Certificate", "pos": "n.", "translation": "chứng chỉ", "phonetic": "/səˈtɪf.ɪ.kət/", "example": "He holds a TOEIC language certificate.", "topic": "Applying and Interviewing"},
    {"word": "Interviewee", "pos": "n.", "translation": "người được phỏng vấn", "phonetic": "/ˌɪn.tə.vjuːˈiː/", "example": "The interviewee answered all questions confidently.", "topic": "Applying and Interviewing"},
    {"word": "Interviewer", "pos": "n.", "translation": "người phỏng vấn", "phonetic": "/ˈɪn.tə.vjuː.ər/", "example": "The interviewer took notes during the meeting.", "topic": "Applying and Interviewing"},
    {"word": "Position", "pos": "n.", "translation": "vị trí công việc", "phonetic": "/pəˈzɪʃ.ən/", "example": "Apply now for the open manager position.", "topic": "Applying and Interviewing"},
    {"word": "Submit", "pos": "v.", "translation": "nộp đơn / nộp hồ sơ", "phonetic": "/səbˈmɪt/", "example": "Submit your application before Friday.", "topic": "Applying and Interviewing"},

    # 6. Hiring
    {"word": "Recruit", "pos": "v.", "translation": "tuyển dụng nhân sự", "phonetic": "/rɪˈkruːt/", "example": "We plan to recruit ten new engineers.", "topic": "Hiring"},
    {"word": "Onboarding", "pos": "n.", "translation": "quy trình đón tiếp nhân viên mới", "phonetic": "/ˈɒnˌbɔː.dɪŋ/", "example": "New hires complete a two-day onboarding session.", "topic": "Hiring"},
    {"word": "Probation", "pos": "n.", "translation": "thời gian thử việc", "phonetic": "/prəˈbeɪ.ʃən/", "example": "Employees serve a three-month probation period.", "topic": "Hiring"},
    {"word": "Headhunter", "pos": "n.", "translation": "chuyên viên săn nhân sự cấp cao", "phonetic": "/ˈhedˌhʌn.tər/", "example": "A headhunter contacted her for an executive role.", "topic": "Hiring"},
    {"word": "Staffing", "pos": "n.", "translation": "sự bố trí nhân sự", "phonetic": "/ˈstɑː.fɪŋ/", "example": "The staffing agency filled the vacant roles.", "topic": "Hiring"},
    {"word": "Vacancy", "pos": "n.", "translation": "vị trí còn trống", "phonetic": "/ˈveɪ.kən.si/", "example": "There is a vacancy in the sales department.", "topic": "Hiring"},
    {"word": "Hire", "pos": "v.", "translation": "thuê, tuyển dụng", "phonetic": "/haɪər/", "example": "The company hired a new financial manager.", "topic": "Hiring"},
    {"word": "Employment", "pos": "n.", "translation": "việc làm, sự thuê lao động", "phonetic": "/ɪmˈplɔɪ.mənt/", "example": "The factory offers full-time employment.", "topic": "Hiring"},
    {"word": "Payroll", "pos": "n.", "translation": "bảng lương công ty", "phonetic": "/ˈpeɪ.rəʊl/", "example": "New staff are added to the official payroll.", "topic": "Hiring"},
    {"word": "Personnel", "pos": "n.", "translation": "toàn thể nhân viên / phòng nhân sự", "phonetic": "/ˌpɜː.sənˈel/", "example": "Contact personnel department for work permits.", "topic": "Hiring"},
    {"word": "Screening", "pos": "n.", "translation": "sự sàng lọc hồ sơ", "phonetic": "/ˈskriː.nɪŋ/", "example": "Initial resume screening takes three days.", "topic": "Hiring"},
    {"word": "Offer letter", "pos": "n.", "translation": "thư mời nhận việc", "phonetic": "/ˈɒf.ər ˈlet.ər/", "example": "She accepted the official job offer letter.", "topic": "Hiring"},
    {"word": "Talent", "pos": "n.", "translation": "nhân tài, người có tài", "phonetic": "/ˈtæl.ənt/", "example": "Our firm attracts top software talent.", "topic": "Hiring"},
    {"word": "Placement", "pos": "n.", "translation": "sự xếp việc, bố trí công tác", "phonetic": "/ˈpleɪs.mənt/", "example": "Job placement assistance is provided to graduates.", "topic": "Hiring"},
    {"word": "Appoint", "pos": "v.", "translation": "bổ nhiệm", "phonetic": "/əˈpɔɪnt/", "example": "The board appointed a new chairman.", "topic": "Hiring"},

    # 7. Training
    {"word": "Workshop", "pos": "n.", "translation": "buổi hội thảo thực hành / đào tạo", "phonetic": "/ˈwɜːk.ʃɒp/", "example": "Attend the customer service training workshop.", "topic": "Training"},
    {"word": "Instructor", "pos": "n.", "translation": "người hướng dẫn", "phonetic": "/ɪnˈstrʌk.tər/", "example": "The instructor explained the safety procedures.", "topic": "Training"},
    {"word": "Module", "pos": "n.", "translation": "học phần, mô-đun đào tạo", "phonetic": "/ˈmɒd.juːl/", "example": "Complete online training module 1 first.", "topic": "Training"},
    {"word": "Seminar", "pos": "n.", "translation": "buổi chuyên đề học tập", "phonetic": "/ˈsem.ɪ.nɑːr/", "example": "He presented at the leadership seminar.", "topic": "Training"},
    {"word": "Evaluation", "pos": "n.", "translation": "sự đánh giá kết quả", "phonetic": "/ɪˌvæl.juˈeɪ.ʃən/", "example": "Trainees complete a performance evaluation.", "topic": "Training"},
    {"word": "Trainee", "pos": "n.", "translation": "thực tập sinh / người được đào tạo", "phonetic": "/ˌtreɪ.niː/", "example": "Each trainee received a study handbook.", "topic": "Training"},
    {"word": "Coach", "pos": "n.", "translation": "huấn luyện viên", "phonetic": "/kəʊtʃ/", "example": "The executive coach assisted the team.", "topic": "Training"},
    {"word": "Skillset", "pos": "n.", "translation": "tập hợp kỹ năng", "phonetic": "/ˈskɪl.set/", "example": "Training improves your technical skillset.", "topic": "Training"},
    {"word": "Orientation", "pos": "n.", "translation": "buổi định hướng ban đầu", "phonetic": "/ˌɔː.ri.enˈteɪ.ʃən/", "example": "Orientation begins at 9 AM on Monday.", "topic": "Training"},
    {"word": "Guidance", "pos": "n.", "translation": "sự chỉ dẫn", "phonetic": "/ˈɡaɪ.dəns/", "example": "Follow the supervisor guidance carefully.", "topic": "Training"},
    {"word": "Certificate", "pos": "n.", "translation": "chứng chỉ hoàn thành", "phonetic": "/səˈtɪf.ɪ.kət/", "example": "Participants receive a course completion certificate.", "topic": "Training"},
    {"word": "Session", "pos": "n.", "translation": "buổi học / phiên đào tạo", "phonetic": "/ˈseʃ.ən/", "example": "The morning training session lasts two hours.", "topic": "Training"},
    {"word": "Practice", "pos": "n.", "translation": "sự luyện tập, thực hành", "phonetic": "/ˈpræk.tɪs/", "example": "Regular practice enhances fluency.", "topic": "Training"},
    {"word": "Improvement", "pos": "n.", "translation": "sự cải thiện, nâng cao", "phonetic": "/ɪmˈpruːv.mənt/", "example": "We noticed a major improvement in efficiency.", "topic": "Training"},
    {"word": "Demonstration", "pos": "n.", "translation": "buổi minh họa thực hành", "phonetic": "/ˌdem.ənˈstreɪ.ʃən/", "example": "Watch the product safety demonstration.", "topic": "Training"},

    # 8. Office Procedures
    {"word": "Procedure", "pos": "n.", "translation": "quy trình làm việc", "phonetic": "/prəˈsiː.dʒər/", "example": "Follow standard office filing procedures.", "topic": "Office Procedures"},
    {"word": "Protocol", "pos": "n.", "translation": "nguyên tắc, giao thức làm việc", "phonetic": "/ˈprəʊ.tə.kɒl/", "example": "Security protocol requires staff ID badges.", "topic": "Office Procedures"},
    {"word": "Filing", "pos": "n.", "translation": "sự lưu trữ hồ sơ", "phonetic": "/ˈfaɪ.lɪŋ/", "example": "The receptionist handles daily document filing.", "topic": "Office Procedures"},
    {"word": "Workflow", "pos": "n.", "translation": "luồng công việc", "phonetic": "/ˈwɜːk.fləʊ/", "example": "Automation streamlined our administrative workflow.", "topic": "Office Procedures"},
    {"word": "Compliance", "pos": "n.", "translation": "sự tuân thủ quy định", "phonetic": "/kəmˈplaɪ.əns/", "example": "All staff ensure compliance with office safety rules.", "topic": "Office Procedures"},
    {"word": "Shredder", "pos": "n.", "translation": "máy hủy tài liệu", "phonetic": "/ˈʃred.ər/", "example": "Dispose of confidential papers using the shredder.", "topic": "Office Procedures"},
    {"word": "Stationery", "pos": "n.", "translation": "văn phòng phẩm", "phonetic": "/ˈsteɪ.ʃən.ər.i/", "example": "Order extra pens and paper from office stationery.", "topic": "Office Procedures"},
    {"word": "Inventory", "pos": "n.", "translation": "sự kiểm kê vật tư", "phonetic": "/ˈɪn.vən.tər.i/", "example": "We conduct monthly office supply inventory.", "topic": "Office Procedures"},
    {"word": "Requisition", "pos": "n.", "translation": "đơn yêu cầu cấp vật tư", "phonetic": "/ˌrek.wɪˈzɪʃ.ən/", "example": "Submit a supply requisition form to manager.", "topic": "Office Procedures"},
    {"word": "Cabinet", "pos": "n.", "translation": "tủ đựng hồ sơ", "phonetic": "/ˈkæb.ɪ.nət/", "example": "Lock sensitive files inside the steel cabinet.", "topic": "Office Procedures"},
    {"word": "Schedule", "pos": "n.", "translation": "lịch trình công việc", "phonetic": "/ˈʃed.juːl/", "example": "Check the weekly office meeting schedule.", "topic": "Office Procedures"},
    {"word": "Duplicate", "pos": "n.", "translation": "bản sao", "phonetic": "/ˈdʒuː.plɪ.keɪt/", "example": "Keep a duplicate copy of the invoice.", "topic": "Office Procedures"},
    {"word": "Stamp", "pos": "v.", "translation": "đóng dấu văn bản", "phonetic": "/stæmp/", "example": "Stamp the document approved before filing.", "topic": "Office Procedures"},
    {"word": "Archive", "pos": "n.", "translation": "kho lưu trữ tài liệu", "phonetic": "/ˈɑː.kaɪv/", "example": "Old financial records are moved to the archive.", "topic": "Office Procedures"},
    {"word": "Routine", "pos": "n.", "translation": "thói quen / công việc thường nhật", "phonetic": "/ruːˈtiːn/", "example": "Morning email review is part of her daily routine.", "topic": "Office Procedures"},

    # 9. Salaries and Benefits
    {"word": "Salary", "pos": "n.", "translation": "tiền lương cố định", "phonetic": "/ˈsæl.ər.i/", "example": "Salaries are paid on the last working day.", "topic": "Salaries and Benefits"},
    {"word": "Bonus", "pos": "n.", "translation": "tiền thưởng", "phonetic": "/ˈbəʊ.nəs/", "example": "Employees received an annual performance bonus.", "topic": "Salaries and Benefits"},
    {"word": "Compensation", "pos": "n.", "translation": "sự bồi thường, thù lao", "phonetic": "/ˌkɒm.penˈseɪ.ʃən/", "example": "The firm offers a competitive compensation package.", "topic": "Salaries and Benefits"},
    {"word": "Insurance", "pos": "n.", "translation": "bảo hiểm", "phonetic": "/ɪnˈʃɔː.rəns/", "example": "Health insurance covers medical and dental care.", "topic": "Salaries and Benefits"},
    {"word": "Pension", "pos": "n.", "translation": "lương hưu", "phonetic": "/ˈpen.ʃən/", "example": "Retirees receive monthly pension payments.", "topic": "Salaries and Benefits"},
    {"word": "Allowance", "pos": "n.", "translation": "phụ cấp", "phonetic": "/əˈlaʊ.əns/", "example": "Staff receive a monthly travel allowance.", "topic": "Salaries and Benefits"},
    {"word": "Overtime", "pos": "n.", "translation": "giờ làm thêm", "phonetic": "/ˈəʊ.və.taɪm/", "example": "Workers earn extra pay for working overtime.", "topic": "Salaries and Benefits"},
    {"word": "Deduction", "pos": "n.", "translation": "khoản khấu trừ lương", "phonetic": "/dɪˈdʌk.ʃən/", "example": "Tax deductions are shown on your payslip.", "topic": "Salaries and Benefits"},
    {"word": "Payslip", "pos": "n.", "translation": "phiếu báo lương", "phonetic": "/ˈpeɪ.slɪp/", "example": "Check your digital payslip for breakdown.", "topic": "Salaries and Benefits"},
    {"word": "Benefit", "pos": "n.", "translation": "phúc lợi công ty", "phonetic": "/ˈben.ɪ.fɪt/", "example": "Employee benefits include paid sick leave.", "topic": "Salaries and Benefits"},
    {"word": "Incentive", "pos": "n.", "translation": "sự khuyến khích, tiền thưởng doanh số", "phonetic": "/ɪnˈsen.tɪv/", "example": "Sales reps receive commission incentives.", "topic": "Salaries and Benefits"},
    {"word": "Wage", "pos": "n.", "translation": "tiền công tính theo giờ/ngày", "phonetic": "/weɪdʒ/", "example": "The minimum hourly wage was increased.", "topic": "Salaries and Benefits"},
    {"word": "Reimbursement", "pos": "n.", "translation": "sự hoàn tiền chi phí", "phonetic": "/ˌriː.ɪmˈbɜːs.mənt/", "example": "Submit travel receipts for expense reimbursement.", "topic": "Salaries and Benefits"},
    {"word": "Commission", "pos": "n.", "translation": "tiền hoa hồng bán hàng", "phonetic": "/kəˈmɪʃ.ən/", "example": "Reps earn a 5% commission on sales.", "topic": "Salaries and Benefits"},
    {"word": "Perk", "pos": "n.", "translation": "đặc quyền, đãi ngộ", "phonetic": "/pɜːk/", "example": "Free gym access is a great company perk.", "topic": "Salaries and Benefits"},

    # 10. Marketing
    {"word": "Campaign", "pos": "n.", "translation": "chiến dịch quảng cáo", "phonetic": "/kæmˈpeɪn/", "example": "The summer marketing campaign increased sales.", "topic": "Marketing"},
    {"word": "Branding", "pos": "n.", "translation": "xây dựng thương hiệu", "phonetic": "/ˈbræn.dɪŋ/", "example": "Consistent branding builds consumer trust.", "topic": "Marketing"},
    {"word": "Demographic", "pos": "n.", "translation": "nhóm nhân khẩu học", "phonetic": "/ˌdem.əˈɡræf.ɪk/", "example": "Target young adults as our core demographic.", "topic": "Marketing"},
    {"word": "Flyer", "pos": "n.", "translation": "tờ rơi quảng cáo", "phonetic": "/ˈflaɪ.ər/", "example": "Staff distributed promotional flyers on campus.", "topic": "Marketing"},
    {"word": "Brochure", "pos": "n.", "translation": "cẩm nang / tờ gấp giới thiệu", "phonetic": "/ˈbrəʊ.ʃər/", "example": "Pick up a product brochure at reception.", "topic": "Marketing"},
    {"word": "Slogan", "pos": "n.", "translation": "khẩu hiệu thương hiệu", "phonetic": "/ˈsləʊ.ɡən/", "example": "Our new catchy slogan attracted customers.", "topic": "Marketing"},
    {"word": "Sponsor", "pos": "v.", "translation": "tài trợ", "phonetic": "/ˈspɒn.sər/", "example": "The company decided to sponsor the sports event.", "topic": "Marketing"},
    {"word": "Promotion", "pos": "n.", "translation": "chương trình khuyến mãi", "phonetic": "/prəˈməʊ.ʃən/", "example": "Special discount promotions run this weekend.", "topic": "Marketing"},
    {"word": "Advertisement", "pos": "n.", "translation": "bài quảng cáo", "phonetic": "/ədˈvɜː.tɪs.mənt/", "example": "Place an advertisement in the daily newspaper.", "topic": "Marketing"},
    {"word": "Consumer", "pos": "n.", "translation": "người tiêu dùng", "phonetic": "/kənˈsjuː.mər/", "example": "Consumer demand for eco-friendly goods is high.", "topic": "Marketing"},
    {"word": "Market research", "pos": "n.", "translation": "nghiên cứu thị trường", "phonetic": "/ˈmɑː.kɪt rɪˈsɜːtʃ/", "example": "Market research revealed new growth areas.", "topic": "Marketing"},
    {"word": "Strategy", "pos": "n.", "translation": "chiến lược", "phonetic": "/ˈstræt.ə.dʒi/", "example": "Develop an effective social media strategy.", "topic": "Marketing"},
    {"word": "Target", "pos": "n.", "translation": "mục tiêu", "phonetic": "/ˈtɑː.ɡɪt/", "example": "We reached our quarterly sales target.", "topic": "Marketing"},
    {"word": "Publicity", "pos": "n.", "translation": "sự công khai, sự chú ý báo chí", "phonetic": "/pʌbˈlɪs.ə.ti/", "example": "The product launch generated positive publicity.", "topic": "Marketing"},
    {"word": "Discount", "pos": "n.", "translation": "sự giảm giá", "phonetic": "/ˈdɪs.kaʊnt/", "example": "Enjoy a 10% discount on your first order.", "topic": "Marketing"},

    # 11. Shopping
    {"word": "Cashier", "pos": "n.", "translation": "nhân viên thu ngân", "phonetic": "/kæˈʃɪər/", "example": "Pay the cashier at counter number 3.", "topic": "Shopping"},
    {"word": "Receipt", "pos": "n.", "translation": "hóa đơn thanh toán", "phonetic": "/rɪˈsiːt/", "example": "Keep your purchase receipt for returns.", "topic": "Shopping"},
    {"word": "Bargain", "pos": "n.", "translation": "món hàng giá rẻ, sự mặc cả", "phonetic": "/ˈbɑː.ɡɪn/", "example": "This jacket was a real bargain at half price.", "topic": "Shopping"},
    {"word": "Refund", "pos": "n.", "translation": "sự hoàn tiền", "phonetic": "/ˈriː.fʌnd/", "example": "Customer service processed a full refund.", "topic": "Shopping"},
    {"word": "Checkout", "pos": "n.", "translation": "quầy thanh toán", "phonetic": "/ˈtʃek.aʊt/", "example": "Proceed to express checkout counter.", "topic": "Shopping"},
    {"word": "Cart", "pos": "n.", "translation": "xe đẩy mua hàng", "phonetic": "/kɑːt/", "example": "Fill your shopping cart with fresh groceries.", "topic": "Shopping"},
    {"word": "Aisle", "pos": "n.", "translation": "lối đi giữa các gian hàng", "phonetic": "/aɪl/", "example": "Dairy products are located in aisle 4.", "topic": "Shopping"},
    {"word": "Vendor", "pos": "n.", "translation": "người bán hàng / nhà cung cấp", "phonetic": "/ˈven.dər/", "example": "The vendor sells organic produce.", "topic": "Shopping"},
    {"word": "Merchant", "pos": "n.", "translation": "thương gia, chủ cửa hàng", "phonetic": "/ˈmɜː.tʃənt/", "example": "Local merchants offer quality goods.", "topic": "Shopping"},
    {"word": "Inventory", "pos": "n.", "translation": "hàng tồn kho", "phonetic": "/ˈɪn.vən.tər.i/", "example": "Stores restock inventory before holidays.", "topic": "Shopping"},
    {"word": "Exchange", "pos": "v.", "translation": "đổi hàng", "phonetic": "/ɪksˈtʃeɪndʒ/", "example": "You can exchange the shirt for another size.", "topic": "Shopping"},
    {"word": "Purchase", "pos": "v.", "translation": "mua sắm", "phonetic": "/ˈpɜː.tʃəs/", "example": "She purchased a computer online.", "topic": "Shopping"},
    {"word": "Warranty", "pos": "n.", "translation": "phiếu bảo hành", "phonetic": "/ˈwɒr.ən.ti/", "example": "The appliance includes a one-year warranty.", "topic": "Shopping"},
    {"word": "Retail", "pos": "n.", "translation": "ngành bán lẻ", "phonetic": "/ˈriː.teɪl/", "example": "Retail stores open daily from 9 AM.", "topic": "Shopping"},
    {"word": "Customer", "pos": "n.", "translation": "khách hàng", "phonetic": "/ˈkʌs.tə.mər/", "example": "Friendly service satisfies every customer.", "topic": "Shopping"},

    # 12. Event
    {"word": "Venue", "pos": "n.", "translation": "địa điểm tổ chức sự kiện", "phonetic": "/ˈven.juː/", "example": "The hotel ballroom is the conference venue.", "topic": "Event"},
    {"word": "Catering", "pos": "n.", "translation": "dịch vụ cung cấp tiệc / ăn uống", "phonetic": "/ˈkeɪ.tər.ɪŋ/", "example": "Catering services provided lunch for attendees.", "topic": "Event"},
    {"word": "Attendee", "pos": "n.", "translation": "người tham dự", "phonetic": "/ə.tenˈdiː/", "example": "Over 500 attendees gathered for the summit.", "topic": "Event"},
    {"word": "Banquet", "pos": "n.", "translation": "bữa tiệc lớn", "phonetic": "/ˈbæŋ.kwɪt/", "example": "An evening banquet was held to celebrate.", "topic": "Event"},
    {"word": "Keynote", "pos": "n.", "translation": "bài phát biểu chủ đạo", "phonetic": "/ˈkiː.nəʊt/", "example": "The CEO delivered the opening keynote speech.", "topic": "Event"},
    {"word": "Registration", "pos": "n.", "translation": "sự đăng ký tham gia", "phonetic": "/ˌredʒ.ɪˈstreɪ.ʃən/", "example": "Complete event registration online in advance.", "topic": "Event"},
    {"word": "Host", "pos": "v.", "translation": "chủ trì, đăng cai tổ chức", "phonetic": "/həʊst/", "example": "Our city will host the international tech expo.", "topic": "Event"},
    {"word": "Organizer", "pos": "n.", "translation": "ban tổ chức", "phonetic": "/ˈɔː.ɡən.aɪ.zər/", "example": "Contact the event organizer for badge pick-up.", "topic": "Event"},
    {"word": "Invitation", "pos": "n.", "translation": "thư mời", "phonetic": "/ˌɪn.vɪˈteɪ.ʃən/", "example": "Send formal invitations to all delegates.", "topic": "Event"},
    {"word": "Schedule", "pos": "n.", "translation": "lịch trình chương trình", "phonetic": "/ˈʃed.juːl/", "example": "The event schedule is printed in the booklet.", "topic": "Event"},
    {"word": "Exhibition", "pos": "n.", "translation": "triển lãm", "phonetic": "/ˌek.sɪˈbɪʃ.ən/", "example": "Visit the trade exhibition at hall B.", "topic": "Event"},
    {"word": "Participant", "pos": "n.", "translation": "người tham gia", "phonetic": "/pɑːˈtɪs.ɪ.pənt/", "example": "Each participant received a souvenir bag.", "topic": "Event"},
    {"word": "Agenda", "pos": "n.", "translation": "chương trình nghị sự", "phonetic": "/əˈdʒen.də/", "example": "Review the meeting agenda before discussion.", "topic": "Event"},
    {"word": "Badge", "pos": "n.", "translation": "thẻ đeo tham dự", "phonetic": "/bædʒ/", "example": "Wear your conference name badge at all times.", "topic": "Event"},
    {"word": "Reception", "pos": "n.", "translation": "tiệc đón tiếp", "phonetic": "/rɪˈsep.ʃən/", "example": "A welcome reception begins at 7 PM.", "topic": "Event"},

    # 13. Travel
    {"word": "Itinerary", "pos": "n.", "translation": "lịch trình chuyến đi", "phonetic": "/aɪˈtɪn.ər.ər.i/", "example": "The travel agent finalized our business itinerary.", "topic": "Travel"},
    {"word": "Boarding pass", "pos": "n.", "translation": "thẻ lên máy bay", "phonetic": "/ˈbɔː.dɪŋ ˌpɑːs/", "example": "Show your boarding pass at the gate.", "topic": "Travel"},
    {"word": "Baggage", "pos": "n.", "translation": "hành lý", "phonetic": "/ˈbæɡ.ɪdʒ/", "example": "Retrieve checked baggage at carousel 3.", "topic": "Travel"},
    {"word": "Departure", "pos": "n.", "translation": "sự khởi hành", "phonetic": "/dɪˈpɑː.tʃər/", "example": "Flight departure time is scheduled for 8 AM.", "topic": "Travel"},
    {"word": "Arrival", "pos": "n.", "translation": "sự đến nơi", "phonetic": "/əˈraɪ.vəl/", "example": "Check the flight arrival status board.", "topic": "Travel"},
    {"word": "Destination", "pos": "n.", "translation": "điểm đến", "phonetic": "/ˌdes.tɪˈneɪ.ʃən/", "example": "Tokyo is a top travel destination.", "topic": "Travel"},
    {"word": "Customs", "pos": "n.", "translation": "hải quan sân bay", "phonetic": "/ˈkʌs.təmz/", "example": "Declare goods when passing customs.", "topic": "Travel"},
    {"word": "Passport", "pos": "n.", "translation": "hộ chiếu", "phonetic": "/ˈpɑːs.pɔːt/", "example": "Ensure your passport is valid for six months.", "topic": "Travel"},
    {"word": "Terminal", "pos": "n.", "translation": "nhà ga sân bay", "phonetic": "/ˈtɜː.mɪ.nəl/", "example": "International flights depart from terminal 2.", "topic": "Travel"},
    {"word": "Delayed", "pos": "adj.", "translation": "bị trì hoãn", "phonetic": "/dɪˈleɪd/", "example": "Our flight was delayed due to bad weather.", "topic": "Travel"},
    {"word": "Layover", "pos": "n.", "translation": "thời gian quá cảnh", "phonetic": "/ˈleɪˌəʊ.vər/", "example": "We had a three-hour layover in Bangkok.", "topic": "Travel"},
    {"word": "Reservation", "pos": "n.", "translation": "sự đặt chỗ trước", "phonetic": "/ˌrez.əˈveɪ.ʃən/", "example": "Confirm your flight reservation online.", "topic": "Travel"},
    {"word": "Fare", "pos": "n.", "translation": "tiền vé máy bay / tàu xe", "phonetic": "/feər/", "example": "Air fare includes taxes and luggage.", "topic": "Travel"},
    {"word": "Excursion", "pos": "n.", "translation": "chuyến tham quan ngắn", "phonetic": "/ɪkˈskɜː.ʃən/", "example": "Join the guided city tour excursion.", "topic": "Travel"},
    {"word": "Transit", "pos": "n.", "translation": "sự quá cảnh, vận chuyển", "phonetic": "/ˈtræn.zɪt/", "example": "Passengers in transit remained inside the lounge.", "topic": "Travel"},

    # 14. Music
    {"word": "Melody", "pos": "n.", "translation": "giai điệu âm nhạc", "phonetic": "/ˈmel.ə.di/", "example": "The song features a soothing piano melody.", "topic": "Music"},
    {"word": "Composer", "pos": "n.", "translation": "nhà soạn nhạc", "phonetic": "/kəmˈpəʊ.zər/", "example": "The famous composer wrote three symphonies.", "topic": "Music"},
    {"word": "Concert", "pos": "n.", "translation": "buổi hòa nhạc", "phonetic": "/ˈkɒn.sət/", "example": "Attend the classical concert at city hall.", "topic": "Music"},
    {"word": "Rhythm", "pos": "n.", "translation": "nhịp điệu", "phonetic": "/ˈrɪð.əm/", "example": "Dance to the catchy drum rhythm.", "topic": "Music"},
    {"word": "Lyric", "pos": "n.", "translation": "lời bài hát", "phonetic": "/ˈlɪr.ɪk/", "example": "She wrote the music and lyrics herself.", "topic": "Music"},
    {"word": "Orchestra", "pos": "n.", "translation": "dàn nhạc giao hưởng", "phonetic": "/ˈɔː.kɪ.strə/", "example": "The symphony orchestra performed live.", "topic": "Music"},
    {"word": "Choir", "pos": "n.", "translation": "dàn hợp xướng", "phonetic": "/kwaɪər/", "example": "The church choir sang beautiful hymns.", "topic": "Music"},
    {"word": "Performance", "pos": "n.", "translation": "buổi biểu diễn", "phonetic": "/pəˈfɔː.məns/", "example": "The band delivered an outstanding performance.", "topic": "Music"},
    {"word": "Vocal", "pos": "adj.", "translation": "thuộc về giọng hát", "phonetic": "/ˈvəʊ.kəl/", "example": "She impressed judges with vocal talent.", "topic": "Music"},
    {"word": "Album", "pos": "n.", "translation": "album nhạc", "phonetic": "/ˈæl.bəm/", "example": "The artist released a new studio album.", "topic": "Music"},
    {"word": "Band", "pos": "n.", "translation": "ban nhạc", "phonetic": "/bænd/", "example": "The rock band went on a world tour.", "topic": "Music"},
    {"word": "Tune", "pos": "n.", "translation": "giai điệu vui tươi", "phonetic": "/tjuːn/", "example": "He hummed a familiar catchy tune.", "topic": "Music"},
    {"word": "Audition", "pos": "n.", "translation": "buổi thử giọng", "phonetic": "/ɔːˈdɪʃ.ən/", "example": "Over fifty singers attended the audition.", "topic": "Music"},
    {"word": "Musician", "pos": "n.", "translation": "nhạc sĩ, nghệ sĩ biểu diễn", "phonetic": "/mjuːˈzɪʃ.ən/", "example": "Talented musicians played live acoustic tracks.", "topic": "Music"},
    {"word": "Track", "pos": "n.", "translation": "bài hát trong album", "phonetic": "/træk/", "example": "Track 3 is the lead single of the record.", "topic": "Music"},

    # 15. Musical Instruments
    {"word": "Instrument", "pos": "n.", "translation": "nhạc cụ", "phonetic": "/ˈɪn.strə.mənt/", "example": "The guitar is a popular string instrument.", "topic": "Musical Instruments"},
    {"word": "Guitar", "pos": "n.", "translation": "đàn ghi-ta", "phonetic": "/ɡɪˈtɑːr/", "example": "He learned to play acoustic guitar at age ten.", "topic": "Musical Instruments"},
    {"word": "Piano", "pos": "n.", "translation": "đàn pi-a-nô", "phonetic": "/piˈæn.əʊ/", "example": "She practices piano every afternoon.", "topic": "Musical Instruments"},
    {"word": "Drums", "pos": "n.", "translation": "bộ trống", "phonetic": "/drʌmz/", "example": "The drummer played energetic drum beats.", "topic": "Musical Instruments"},
    {"word": "Violin", "pos": "n.", "translation": "đàn vĩ cầm / vi-ô-lông", "phonetic": "/ˌvaɪəˈlɪn/", "example": "The soloist played a violin concerto.", "topic": "Musical Instruments"},
    {"word": "Flute", "pos": "n.", "translation": "sáo tây", "phonetic": "/fluːt/", "example": "The soft sound of the flute filled the hall.", "topic": "Musical Instruments"},
    {"word": "Saxophone", "pos": "n.", "translation": "kèn xắc-xô-phôn", "phonetic": "/ˈsæk.sə.fəʊn/", "example": "Jazz musicians often play the saxophone.", "topic": "Musical Instruments"},
    {"word": "Trumpet", "pos": "n.", "translation": "kèn trôm-pét", "phonetic": "/ˈtrʌm.pɪt/", "example": "The brass section includes three trumpets.", "topic": "Musical Instruments"},
    {"word": "Keyboard", "pos": "n.", "translation": "đàn phím điện tử", "phonetic": "/ˈkiː.bɔːd/", "example": "The electronic keyboard offers synthesized sounds.", "topic": "Musical Instruments"},
    {"word": "Strings", "pos": "n.", "translation": "dây đàn nhạc cụ", "phonetic": "/strɪŋz/", "example": "Replace worn guitar strings regularly.", "topic": "Musical Instruments"},
    {"word": "Tuning", "pos": "n.", "translation": "sự lên dây nhạc cụ", "phonetic": "/ˈtjuː.nɪŋ/", "example": "Check instrument tuning before starting performance.", "topic": "Musical Instruments"},
    {"word": "Acoustic", "pos": "adj.", "translation": "âm thanh mộc, không dùng điện", "phonetic": "/əˈkuː.stɪk/", "example": "They enjoyed an acoustic guitar performance.", "topic": "Musical Instruments"},
    {"word": "Amplifier", "pos": "n.", "translation": "bộ khuếch đại âm thanh (âm-li)", "phonetic": "/ˈæm.plɪ.faɪ.ər/", "example": "Plug the electric guitar into the amplifier.", "topic": "Musical Instruments"},
    {"word": "Microphone", "pos": "n.", "translation": "micro nói / hát", "phonetic": "/ˈmaɪ.krə.fəʊn/", "example": "Speak clearly into the microphone.", "topic": "Musical Instruments"},
    {"word": "Harmonica", "pos": "n.", "translation": "kèn khẩu cầm (kèn ét-môn-ni-ca)", "phonetic": "/hɑːˈmɒn.ɪ.kə/", "example": "He played a blues tune on his harmonica.", "topic": "Musical Instruments"},

    # 16. Movie
    {"word": "Cinema", "pos": "n.", "translation": "rạp chiếu phim", "phonetic": "/ˈsɪn.ə.mɑː/", "example": "We watched the premiere at local cinema.", "topic": "Movie"},
    {"word": "Screenplay", "pos": "n.", "translation": "kịch bản phim", "phonetic": "/ˈskriːn.pleɪ/", "example": "The writer won an award for best screenplay.", "topic": "Movie"},
    {"word": "Director", "pos": "n.", "translation": "đạo diễn phim", "phonetic": "/daɪˈrek.tər/", "example": "The film director instructed the actors.", "topic": "Movie"},
    {"word": "Producer", "pos": "n.", "translation": "nhà sản xuất phim", "phonetic": "/prəˈdʒuː.sər/", "example": "The movie producer secured production funds.", "topic": "Movie"},
    {"word": "Subtitle", "pos": "n.", "translation": "phụ đề phim", "phonetic": "/ˈsʌbˌtaɪ.təl/", "example": "Foreign films include English subtitles.", "topic": "Movie"},
    {"word": "Trailer", "pos": "n.", "translation": "đoạn phim giới thiệu ngắn", "phonetic": "/ˈtreɪ.lər/", "example": "Watch the movie trailer online before buying tickets.", "topic": "Movie"},
    {"word": "Premiere", "pos": "n.", "translation": "buổi công chiếu đầu tiên", "phonetic": "/ˈprem.i.eər/", "example": "Celebrities attended the red-carpet film premiere.", "topic": "Movie"},
    {"word": "Box office", "pos": "n.", "translation": "phòng vé, doanh thu rạp chiếu", "phonetic": "/ˈbɒks ˌɒf.ɪs/", "example": "The blockbuster hit record box office sales.", "topic": "Movie"},
    {"word": "Actor", "pos": "n.", "translation": "nam diễn viên", "phonetic": "/ˈæk.tər/", "example": "The lead actor starred in five hit films.", "topic": "Movie"},
    {"word": "Actress", "pos": "n.", "translation": "nữ diễn viên", "phonetic": "/ˈæk.trəs/", "example": "The talented actress won best performance.", "topic": "Movie"},
    {"word": "Scene", "pos": "n.", "translation": "cảnh phim", "phonetic": "/siːn/", "example": "They filmed the final action scene in London.", "topic": "Movie"},
    {"word": "Genre", "pos": "n.", "translation": "thể loại phim", "phonetic": "/ˈʒɑːn.rə/", "example": "Comedy is my favorite movie genre.", "topic": "Movie"},
    {"word": "Blockbuster", "pos": "n.", "translation": "phim bom tấn", "phonetic": "/ˈblɒkˌbʌs.tər/", "example": "Summer blockbusters attract millions of viewers.", "topic": "Movie"},
    {"word": "Sequel", "pos": "n.", "translation": "phần phim tiếp theo", "phonetic": "/ˈsiː.kwəl/", "example": "The movie sequel was released two years later.", "topic": "Movie"},
    {"word": "Studio", "pos": "n.", "translation": "xưởng phim, phim trường", "phonetic": "/ˈstjuː.di.əʊ/", "example": "The film studio constructed impressive movie sets.", "topic": "Movie"},

    # 17. Hotel
    {"word": "Reservation", "pos": "n.", "translation": "sự đặt phòng khách sạn", "phonetic": "/ˌrez.əˈveɪ.ʃən/", "example": "I have a room reservation under the name Smith.", "topic": "Hotel"},
    {"word": "Receptionist", "pos": "n.", "translation": "nhân viên lễ tân khách sạn", "phonetic": "/rɪˈsep.ʃən.ɪst/", "example": "The receptionist handed me the electronic room key.", "topic": "Hotel"},
    {"word": "Suite", "pos": "n.", "translation": "phòng thượng hạng / phòng suite", "phonetic": "/swiːt/", "example": "The executive suite offers a sea view.", "topic": "Hotel"},
    {"word": "Housekeeping", "pos": "n.", "translation": "bộ phận dọn phòng khách sạn", "phonetic": "/ˈhaʊsˌkiː.pɪŋ/", "example": "Housekeeping cleans and sanitizes rooms daily.", "topic": "Hotel"},
    {"word": "Concierge", "pos": "n.", "translation": "nhân viên hỗ trợ khách hàng tại khách sạn", "phonetic": "/ˌkɒn.siˈeərʒ/", "example": "Ask the concierge to arrange taxi transport.", "topic": "Hotel"},
    {"word": "Check-in", "pos": "n.", "translation": "sự làm thủ tục nhận phòng", "phonetic": "/ˈtʃek.ɪn/", "example": "Hotel check-in begins at 2 PM.", "topic": "Hotel"},
    {"word": "Check-out", "pos": "n.", "translation": "sự làm thủ tục trả phòng", "phonetic": "/ˈtʃek.aʊt/", "example": "Check-out time is before 12 noon.", "topic": "Hotel"},
    {"word": "Amenities", "pos": "n.", "translation": "tiện nghi khách sạn", "phonetic": "/əˈmiː.nə.tiz/", "example": "Hotel amenities include a pool and gym.", "topic": "Hotel"},
    {"word": "Bellhop", "pos": "n.", "translation": "nhân viên mang vác hành lý khách sạn", "phonetic": "/ˈbel.hɒp/", "example": "The bellhop carried our luggage to room 402.", "topic": "Hotel"},
    {"word": "Vacancy", "pos": "n.", "translation": "phòng trống khách sạn", "phonetic": "/ˈveɪ.kən.si/", "example": "The hotel display sign showed no vacancy.", "topic": "Hotel"},
    {"word": "Lobby", "pos": "n.", "translation": "sảnh chờ khách sạn", "phonetic": "/ˈlɒb.i/", "example": "We met our tour guide in the hotel lobby.", "topic": "Hotel"},
    {"word": "Single room", "pos": "n.", "translation": "phòng đơn", "phonetic": "/ˈsɪŋ.ɡəl ruːm/", "example": "Book a single room for individual travelers.", "topic": "Hotel"},
    {"word": "Double room", "pos": "n.", "translation": "phòng đôi", "phonetic": "/ˈdʌb.əl ruːm/", "example": "The double room features two queen beds.", "topic": "Hotel"},
    {"word": "Valet", "pos": "n.", "translation": "dịch vụ đỗ xe cho khách", "phonetic": "/ˈvæl.eɪ/", "example": "The hotel valet parked our rental car.", "topic": "Hotel"},
    {"word": "Deposit", "pos": "n.", "translation": "tiền đặt cọc phòng", "phonetic": "/dɪˈpɒz.ɪt/", "example": "Pay a 50 dollar deposit upon arrival.", "topic": "Hotel"}
]

print(f"Total Level 1 Entries in Source Dataset: {len(TOEIC_U500_DATA)}")

# Count new vs existing matches
matched_existing = 0
new_unique = 0

for item in TOEIC_U500_DATA:
    w_clean = item['word'].lower().strip()
    if w_clean in existing_cards_db:
        matched_existing += 1
    else:
        new_unique += 1

print(f"Matched with existing DB flashcards: {matched_existing}")
print(f"New unique vocabulary entries to insert: {new_unique}")

conn.close()
