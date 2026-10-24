import xml.etree.ElementTree as ET

# Define entities, their PK, ordinary attributes, and FKs
entities = {
    "GoiDichVu": {
        "title": "GoiDichVu (SubscriptionPlans)",
        "x": 60, "y": 80, "width": 240,
        "pk": ["ID_GoiDichVu"],
        "attrs": [
            "ma_goi",
            "ten_goi",
            "mo_ta",
            "gia_tien",
            "loai_tien_te",
            "chu_ky_thanh_toan",
            "so_bo_the_toi_da",
            "the_toi_da_moi_bo",
            "on_tap_toi_da_ngay",
            "mo_khoa_quiz",
            "mo_khoa_offline",
            "thu_tu_hien_thi",
            "kich_hoat"
        ],
        "fks": []
    },
    "BoThe": {
        "title": "BoThe (Decks)",
        "x": 450, "y": 80, "width": 240,
        "pk": ["ID_BoThe"],
        "attrs": [
            "ma_bo_the",
            "tieu_de",
            "slug",
            "mo_ta",
            "anh_bia_url",
            "do_kho",
            "pham_vi_hien_thi",
            "trang_thai",
            "che_do_hien_thi",
            "tong_so_the",
            "luot_xem",
            "luot_ghi_danh",
            "kich_hoat"
        ],
        "fks": [
            "ID_NguoiTao",
            "ID_ChuDe",
            "ID_LoaiKyThi",
            "ID_TrinhDo"
        ]
    },
    "TheTuVung": {
        "title": "TheTuVung (Flashcards)",
        "x": 840, "y": 80, "width": 240,
        "pk": ["ID_TheTuVung"],
        "attrs": [
            "mat_truoc",
            "mat_sau",
            "phien_am",
            "tu_loai",
            "dinh_nghia",
            "cau_vi_du",
            "dich_vi_du",
            "tu_lien_quan",
            "goi_y",
            "hinh_anh_url",
            "am_thanh_url",
            "mau_the",
            "thu_tu_the",
            "kich_hoat"
        ],
        "fks": [
            "ID_BoThe",
            "ID_NguoiTao"
        ]
    },
    "CauHoiThi": {
        "title": "CauHoiThi (QuizQuestions)",
        "x": 1230, "y": 80, "width": 240,
        "pk": ["ID_CauHoiThi"],
        "attrs": [
            "noi_dung_cau_hoi",
            "anh_minh_hoa_url",
            "loai_cau_hoi",
            "giai_thich_dap_an",
            "diem_so",
            "thoi_gian_giay",
            "thu_tu_hien_thi",
            "kich_hoat"
        ],
        "fks": [
            "ID_DeThi",
            "ID_TheNguon"
        ]
    },
    "DeThi": {
        "title": "DeThi (Quizzes)",
        "x": 1620, "y": 80, "width": 240,
        "pk": ["ID_DeThi"],
        "attrs": [
            "ma_de_thi",
            "tieu_de",
            "mo_ta",
            "loai_de_thi",
            "danh_muc_thi",
            "do_kho",
            "thoi_gian_lam_giay",
            "diem_qua_mon",
            "so_lan_lam_toi_da",
            "tron_cau_hoi",
            "tron_dap_an",
            "tong_so_cau",
            "kich_hoat"
        ],
        "fks": [
            "ID_BoThe",
            "ID_LoaiKyThi",
            "ID_TrinhDo",
            "ID_NguoiTao"
        ]
    },
    "GiaoDichThanhToan": {
        "title": "GiaoDichThanhToan (Payments)",
        "x": 60, "y": 560, "width": 240,
        "pk": ["ID_GiaoDich"],
        "attrs": [
            "ma_thanh_toan",
            "cong_thanh_toan",
            "ma_giao_dich_cong",
            "so_tien",
            "loai_tien_te",
            "trang_thai",
            "thoi_gian_thanh_toan",
            "thoi_gian_het_han",
            "ly_do_that_bai"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_GoiDichVu"
        ]
    },
    "GhiDanhBoThe": {
        "title": "GhiDanhBoThe (DeckEnrollments)",
        "x": 450, "y": 560, "width": 240,
        "pk": ["ID_GhiDanh"],
        "attrs": [
            "trang_thai",
            "ngay_ghi_danh",
            "ngay_hoan_thanh",
            "ngay_hoc_gan_nhat",
            "ngay_on_tap_ke_tiep",
            "so_the_thanh_thao",
            "the_moi_toi_da_ngay",
            "on_tap_toi_da_ngay"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_BoThe"
        ]
    },
    "NguoiDung": {
        "title": "NguoiDung (Users)",
        "x": 840, "y": 560, "width": 240,
        "pk": ["ID_NguoiDung"],
        "attrs": [
            "ten_dang_nhap",
            "email",
            "mat_khau_hash",
            "ho_ten",
            "anh_dai_dien",
            "trang_thai",
            "muc_tieu_the_ngay",
            "tong_diem_xp",
            "chuoi_streak_hien_tai",
            "chuoi_streak_ky_luc",
            "ngay_hoat_dong_cuoi"
        ],
        "fks": [
            "ID_LoaiKyThi",
            "ID_TrinhDo"
        ]
    },
    "TienDoThe": {
        "title": "TienDoThe (CardProgress)",
        "x": 1230, "y": 560, "width": 240,
        "pk": ["ID_TienDo"],
        "attrs": [
            "trang_thai_srs",
            "he_so_de_nho",
            "khoang_cach_ngay",
            "so_lan_lap_lai",
            "so_lan_quen",
            "buoc_hoc",
            "thoi_diem_den_han",
            "ngay_on_gan_nhat",
            "danh_gia_cuoi",
            "thuat_toan",
            "tong_so_on_tap"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_TheTuVung"
        ]
    },
    "LuotLamBai": {
        "title": "LuotLamBai (QuizAttempts)",
        "x": 1620, "y": 560, "width": 240,
        "pk": ["ID_LuotLamBai"],
        "attrs": [
            "ma_cong_khai",
            "lan_thu",
            "trang_thai",
            "thoi_gian_bat_dau",
            "thoi_gian_nop_bai",
            "thoi_gian_lam_giay",
            "tong_so_cau",
            "so_cau_dung",
            "tong_diem",
            "phan_tram_diem",
            "ket_qua_dat",
            "xp_nhan_duoc",
            "chu_ky_thi"
        ],
        "fks": [
            "ID_DeThi",
            "ID_NguoiDung",
            "ID_TrinhDoLuuVet"
        ]
    },
    "PhienOnTap": {
        "title": "PhienOnTap (ReviewSessions)",
        "x": 300, "y": 1020, "width": 240,
        "pk": ["ID_PhienOnTap"],
        "attrs": [
            "ma_cong_khai",
            "loai_phien",
            "trang_thai",
            "thiet_bi_id",
            "che_do_offline",
            "thoi_gian_bat_dau",
            "thoi_gian_hoan_thanh"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_BoThe"
        ]
    },
    "LuotChoiGoTu": {
        "title": "LuotChoiGoTu (TypingGameRuns)",
        "x": 740, "y": 1020, "width": 240,
        "pk": ["ID_LuotChoi"],
        "attrs": [
            "ma_cong_khai",
            "che_do_choi",
            "trang_thai",
            "diem_so",
            "man_dat_duoc",
            "tong_so_man",
            "so_mang_con_lai",
            "combo_lon_nhat",
            "tu_hoan_thanh",
            "tu_bo_lo",
            "tong_phim_bam",
            "do_chinh_xac",
            "toc_do_wpm",
            "xp_nhan_duoc",
            "thoi_gian_bat_dau",
            "thoi_gian_ket_thuc"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_BoThe"
        ]
    },
    "PhienHoiThoaiAI": {
        "title": "PhienHoiThoaiAI (VoiceSessions)",
        "x": 1180, "y": 1020, "width": 240,
        "pk": ["ID_PhienHoiThoai"],
        "attrs": [
            "ma_cong_khai",
            "trang_thai",
            "cap_do_bat_dau",
            "thoi_luong_giay",
            "so_luot_noi_hop_le",
            "diem_tong_the",
            "diem_phat_am",
            "diem_ngu_phap",
            "diem_luu_loat",
            "diem_tu_vung",
            "danh_gia_nguoi_dung",
            "xp_thuong",
            "ai_tokens_da_dung",
            "thoi_gian_bat_dau",
            "thoi_gian_ket_thuc"
        ],
        "fks": [
            "ID_NguoiDung",
            "ID_KichBan"
        ]
    }
}

relationships = [
    # (source, target, label, startArrow, endArrow)
    ("GoiDichVu", "GiaoDichThanhToan", "duoc_mua", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "GiaoDichThanhToan", "thanh_toan", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "BoThe", "so_huu", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "GhiDanhBoThe", "dang_ky_hoc", "ERmandOne", "ERzeroToMany"),
    ("BoThe", "GhiDanhBoThe", "duoc_ghi_danh", "ERmandOne", "ERzeroToMany"),
    ("BoThe", "TheTuVung", "chua_cac_the", "ERmandOne", "ERoneToMany"),
    ("TheTuVung", "TienDoThe", "ghi_nhan_tien_do", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "TienDoThe", "theo_doi_srs", "ERmandOne", "ERzeroToMany"),
    ("TheTuVung", "CauHoiThi", "lam_nguon_cau_hoi", "ERmandOne", "ERzeroToMany"),
    ("DeThi", "CauHoiThi", "chua_cau_hoi", "ERmandOne", "ERoneToMany"),
    ("BoThe", "DeThi", "co_de_kiem_tra", "ERmandOne", "ERzeroToMany"),
    ("DeThi", "LuotLamBai", "co_luot_lam", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "LuotLamBai", "lam_bai_thi", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "PhienOnTap", "thuc_hien", "ERmandOne", "ERzeroToMany"),
    ("BoThe", "PhienOnTap", "ap_dung_on_tap", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "LuotChoiGoTu", "tham_gia_choi", "ERmandOne", "ERzeroToMany"),
    ("BoThe", "LuotChoiGoTu", "tao_man_choi", "ERmandOne", "ERzeroToMany"),
    ("NguoiDung", "PhienHoiThoaiAI", "luyen_noi", "ERmandOne", "ERzeroToMany")
]

def build_drawio():
    root = ET.Element("mxfile", host="app.diagrams.net", type="device")
    diagram = ET.SubElement(root, "diagram", id="LeLa_ERD_CrowFoot", name="LeLa_ERD")
    model = ET.SubElement(diagram, "mxGraphModel", dx="2000", dy="1600", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="2000", pageHeight="1600", math="0", shadow="0")
    graph_root = ET.SubElement(model, "root")
    
    ET.SubElement(graph_root, "mxCell", id="0")
    ET.SubElement(graph_root, "mxCell", id="1", parent="0")

    table_cell_ids = {}

    for name, info in entities.items():
        tbl_id = f"node_{name.lower()}"
        table_cell_ids[name] = tbl_id

        total_h = 30 + (len(info["pk"]) * 22) + 6 + (len(info["attrs"]) * 20)
        if info["fks"]:
            total_h += 6 + (len(info["fks"]) * 20)

        swimlane_style = (
            "swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=30;"
            "horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;"
            "marginBottom=0;whiteSpace=wrap;html=1;rounded=1;arcSize=15;"
            "strokeColor=#000000;strokeWidth=2;fillColor=#FFFFFF;fontColor=#000000;fontSize=13;"
        )
        tbl_cell = ET.SubElement(graph_root, "mxCell", id=tbl_id, value=f"<b>{info['title']}</b>", style=swimlane_style, vertex="1", parent="1")
        ET.SubElement(tbl_cell, "mxGeometry", x=str(info["x"]), y=str(info["y"]), width=str(info["width"]), height=str(total_h), as_="geometry")

        current_y = 30

        # PK rows (bold & underlined)
        for pk in info["pk"]:
            pk_val = f"<b><u>{pk}</u></b>"
            pk_style = (
                "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
                "spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;"
                "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;"
                "fontColor=#000000;fontSize=12;"
            )
            c = ET.SubElement(graph_root, "mxCell", id=f"pk_{name}_{pk}", value=pk_val, style=pk_style, vertex="1", parent=tbl_id)
            ET.SubElement(c, "mxGeometry", y=str(current_y), width=str(info["width"]), height="22", as_="geometry")
            current_y += 22

        # Separator 1
        div1_style = (
            "line;strokeWidth=1.5;fillColor=none;align=left;verticalAlign=middle;"
            "spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;"
            "points=[];portConstraint=eastwest;strokeColor=#000000;"
        )
        d1 = ET.SubElement(graph_root, "mxCell", id=f"div1_{name}", value="", style=div1_style, vertex="1", parent=tbl_id)
        ET.SubElement(d1, "mxGeometry", y=str(current_y), width=str(info["width"]), height="6", as_="geometry")
        current_y += 6

        # Normal attributes
        for attr in info["attrs"]:
            attr_style = (
                "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
                "spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;"
                "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;"
                "fontColor=#000000;fontSize=12;"
            )
            c = ET.SubElement(graph_root, "mxCell", id=f"attr_{name}_{attr}", value=attr, style=attr_style, vertex="1", parent=tbl_id)
            ET.SubElement(c, "mxGeometry", y=str(current_y), width=str(info["width"]), height="20", as_="geometry")
            current_y += 20

        # Separator 2 if FK exists
        if info["fks"]:
            d2 = ET.SubElement(graph_root, "mxCell", id=f"div2_{name}", value="", style=div1_style, vertex="1", parent=tbl_id)
            ET.SubElement(d2, "mxGeometry", y=str(current_y), width=str(info["width"]), height="6", as_="geometry")
            current_y += 6

            # FK rows (italic)
            for fk in info["fks"]:
                fk_val = f"<i>{fk}</i>"
                fk_style = (
                    "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
                    "spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;"
                    "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;"
                    "fontColor=#333333;fontSize=12;"
                )
                c = ET.SubElement(graph_root, "mxCell", id=f"fk_{name}_{fk}", value=fk_val, style=fk_style, vertex="1", parent=tbl_id)
                ET.SubElement(c, "mxGeometry", y=str(current_y), width=str(info["width"]), height="20", as_="geometry")
                current_y += 20

    # Relationships
    rel_idx = 1
    for src, tgt, label, startArr, endArr in relationships:
        edge_id = f"rel_{src}_{tgt}_{rel_idx}"
        rel_idx += 1
        edge_style = (
            f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            f"startArrow={startArr};startFill=0;endArrow={endArr};endFill=0;"
            f"strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;"
        )
        e = ET.SubElement(graph_root, "mxCell", id=edge_id, value=label, style=edge_style, edge="1", parent="1", source=table_cell_ids[src], target=table_cell_ids[tgt])
        ET.SubElement(e, "mxGeometry", relative="1", as_="geometry")

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ", level=0)
    tree.write("f:/ProJectLeLa/lela_erd.drawio", encoding="utf-8", xml_declaration=True)
    print("Successfully regenerated f:/ProJectLeLa/lela_erd.drawio with proper HTML tags")

if __name__ == "__main__":
    build_drawio()
