import pymysql
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

conn = pymysql.connect(
    host='localhost',
    port=3306,
    user='root',
    password='123456',
    database='lela_db',
    charset='utf8mb4'
)
cursor = conn.cursor()

# Fetch all active Oxford decks
cursor.execute("""
    SELECT 
        d.id, 
        d.title, 
        d.topic_id, 
        t.name AS topic_name, 
        d.level_id, 
        COUNT(f.id) AS card_count
    FROM decks d
    LEFT JOIN topics t ON d.topic_id = t.id
    LEFT JOIN flashcards f ON f.deck_id = d.id
    WHERE d.title LIKE '%Oxford 5000%' AND d.is_active = 1
    GROUP BY d.id, d.title, d.topic_id, t.name, d.level_id
    ORDER BY d.level_id, d.topic_id, card_count ASC
""")

raw_decks = cursor.fetchall()
# Each item: [id, title, topic_id, topic_name, level_id, count]
decks_dict = {d[0]: {'id': d[0], 'title': d[1], 'topic_id': d[2], 'topic_name': d[3], 'level_id': d[4], 'count': d[5]} for d in raw_decks}

# Curated high-res, stable Unsplash cover image lists per topic
TOPIC_IMAGE_MAP = {
    15: [ # Business & Management
        "https://images.unsplash.com/photo-1542744801-43245f175232?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
    ],
    16: [ # Finance & Accounting
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop"
    ],
    17: [ # Marketing & Sales
        "https://images.unsplash.com/photo-1533750349088-cd871a92f312?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
    ],
    18: [ # Technology & Computing
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop"
    ],
    19: [ # Law & Governance
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop"
    ],
    20: [ # Health & Medicine
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800&auto=format&fit=crop"
    ],
    21: [ # Travel & Logistics
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
    ],
    22: [ # Education & Career
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
    ],
    23: [ # Communication & Media
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop"
    ],
    24: [ # Environment & Science
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop"
    ],
    25: [ # Office & Administration
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop"
    ],
    1: [ # General & Daily Life
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop"
    ]
}

# Plan merge pairs for decks with < 10 cards
small_deck_ids = [d_id for d_id, d in decks_dict.items() if d['count'] < 10]
merged_sources = set()

merge_plan = []

for s_id in small_deck_ids:
    if s_id in merged_sources:
        continue
    
    s = decks_dict[s_id]
    s_count = s['count']
    
    # Destination MUST be a large deck (count >= 10) in SAME level
    candidates = [
        d for d_id, d in decks_dict.items() 
        if d_id != s_id 
        and d_id not in merged_sources 
        and d['count'] >= 10 
        and d['level_id'] == s['level_id']
        and d['topic_id'] == s['topic_id']
        and (d['count'] + s_count) <= 30
    ]
    
    if not candidates:
        # Candidate in SAME level, related topic
        candidates = [
            d for d_id, d in decks_dict.items() 
            if d_id != s_id 
            and d_id not in merged_sources 
            and d['count'] >= 10 
            and d['level_id'] == s['level_id']
            and (d['count'] + s_count) <= 30
        ]
    
    if candidates:
        # Prefer largest candidate under 30 cards
        candidates.sort(key=lambda x: x['count'], reverse=True)
        target = candidates[0]
        
        merge_plan.append({
            'source': s,
            'target': target,
            'new_count': target['count'] + s_count
        })
        merged_sources.add(s_id)
        # Update target count in memory
        target['count'] += s_count

print("=== MERGE PLAN LOG ===")
for p in merge_plan:
    s = p['source']
    t = p['target']
    print(f"Merge OLD Deck [{s['id']}] '{s['title']}' ({s['count']} cards) ➔ NEW Deck [{t['id']}] '{t['title']}' (Final count: {p['new_count']} cards)")

# Now generate V39 Migration SQL
sql_lines = []
sql_lines.append("-- ==========================================================")
sql_lines.append("-- V39: FIX OXFORD 5000 DECKS - COVER IMAGES & MERGE SMALL DECKS")
sql_lines.append("-- ==========================================================")

# 1. Update Cover Images for ALL Oxford Decks
sql_lines.append("\n-- 1. Update Cover Images for Oxford 5000 Decks by Topic")

for d_id, d in decks_dict.items():
    topic_id = d['topic_id']
    images = TOPIC_IMAGE_MAP.get(topic_id, TOPIC_IMAGE_MAP[1])
    img_url = images[d_id % len(images)]
    sql_lines.append(f"UPDATE decks SET cover_image_url = '{img_url}' WHERE id = {d_id};")

# 2. Merge Small Decks
sql_lines.append("\n-- 2. Merge Decks with < 10 Cards into Target Decks")

for p in merge_plan:
    s_id = p['source']['id']
    t_id = p['target']['id']
    
    sql_lines.append(f"\n-- Merge Deck {s_id} into Deck {t_id}")
    # Update Flashcards deck_id
    sql_lines.append(f"UPDATE flashcards SET deck_id = {t_id} WHERE deck_id = {s_id};")
    # Update Quizzes deck_id
    sql_lines.append(f"UPDATE quizzes SET deck_id = {t_id} WHERE deck_id = {s_id};")
    # Disable Old Deck
    sql_lines.append(f"UPDATE decks SET is_active = 0, total_cards = 0 WHERE id = {s_id};")

# 3. Recount total_cards for all Decks
sql_lines.append("\n-- 3. Recount total_cards for all Oxford Decks")
sql_lines.append("""
UPDATE decks d
SET total_cards = (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id)
WHERE d.title LIKE '%Oxford 5000%';
""")

# Re-order card_order within each target deck
sql_lines.append("\n-- 4. Re-order card_order for target decks")
sql_lines.append("""
UPDATE flashcards f
JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY deck_id ORDER BY id) as new_order
    FROM flashcards
) r ON f.id = r.id
SET f.card_order = r.new_order;
""")

output_v39_path = r"f:\ProJectLeLa\LeLa_BE\src\main\resources\db\migration\V39__fix_oxford_deck_images_and_merge_small_decks.sql"

with open(output_v39_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"\nV39 Migration file generated at: {output_v39_path}")
conn.close()
