# LeLa API Endpoints

Dưới đây là danh sách đầy đủ các Endpoint và cấu trúc Body (nếu có) tương ứng với từng chức năng. Base URL mặc định là: `http://localhost:8080`

---

## 🏷️ 1. Tag API (`/api/tags`)

### Lấy danh sách Tag
- **Endpoint:** `GET /api/tags`
- **Query Params (Tuỳ chọn):** `page=0`, `size=10`, `sortBy=name`, `direction=asc`
- **Body:** Không có

### Lấy thông tin 1 Tag theo ID
- **Endpoint:** `GET /api/tags/{id}`
- **Body:** Không có

### Tạo mới Tag
- **Endpoint:** `POST /api/tags`
- **Body (JSON):**
```json
{
  "name": "Từ vựng IELTS"
}
```

### Cập nhật Tag
- **Endpoint:** `PUT /api/tags/{id}`
- **Body (JSON):**
```json
{
  "name": "Từ vựng TOEIC"
}
```

### Xóa Tag (Xoá mềm - isActive = false)
- **Endpoint:** `DELETE /api/tags/{id}`
- **Body:** Không có

---

## 🗂️ 2. Deck API (`/api/v1/decks`)

### Lấy danh sách Deck
- **Endpoint:** `GET /api/v1/decks`
- **Query Params (Tuỳ chọn):** `page`, `size`, `sort`
- **Body:** Không có

### Lấy danh sách Deck của Owner
- **Endpoint:** `GET /api/v1/decks/owner/{ownerId}`
- **Body:** Không có

### Lấy thông tin 1 Deck theo ID
- **Endpoint:** `GET /api/v1/decks/{id}`
- **Body:** Không có

### Tạo mới Deck
- **Endpoint:** `POST /api/v1/decks`
- **Body (JSON):**
```json
{
  "title": "Tiếng Anh giao tiếp cơ bản",
  "description": "Các mẫu câu tiếng Anh thường dùng",
  "coverImageUrl": "https://example.com/cover.jpg",
  "languageId": 1,
  "category": "Giao tiếp",
  "difficulty": "BEGINNER",
  "visibility": "PUBLIC",
  "ownerId": 1
}
```
*(Ghi chú: `difficulty` có thể là `BEGINNER`, `INTERMEDIATE`, `ADVANCED`. `visibility` có thể là `PUBLIC`, `UNLISTED`, `PRIVATE`)*

### Cập nhật Deck
- **Endpoint:** `PUT /api/v1/decks/{id}`
- **Body (JSON):**
```json
{
  "title": "Tiếng Anh giao tiếp nâng cao",
  "description": "Các mẫu câu nâng cao",
  "coverImageUrl": "https://example.com/cover_advanced.jpg",
  "languageId": 1,
  "category": "Giao tiếp",
  "difficulty": "ADVANCED",
  "visibility": "PRIVATE",
  "ownerId": 1
}
```

### Xóa Deck (Xoá mềm - isActive = false)
- **Endpoint:** `DELETE /api/v1/decks/{id}`
- **Body:** Không có

---

## 🃏 3. Flashcard API (`/api/v1/flashcards`)

### Lấy danh sách Flashcard theo Deck
- **Endpoint:** `GET /api/v1/flashcards/deck/{deckId}`
- **Query Params (Tuỳ chọn):** `page`, `size`, `sort`
- **Body:** Không có

### Lấy danh sách Flashcard theo Tag
- **Endpoint:** `GET /api/v1/flashcards/tag/{tagId}`
- **Body:** Không có

### Lấy thông tin 1 Flashcard theo ID
- **Endpoint:** `GET /api/v1/flashcards/{id}`
- **Body:** Không có

### Tạo mới Flashcard
- **Endpoint:** `POST /api/v1/flashcards`
- **Body (JSON):**
```json
{
  "deckId": 1,
  "frontText": "Hello",
  "backText": "Xin chào",
  "phonetic": "/həˈloʊ/",
  "exampleText": "Hello, how are you?",
  "hint": "Dùng để chào hỏi",
  "note": "Rất phổ biến",
  "frontImageUrl": "https://example.com/hello.jpg",
  "backImageUrl": "",
  "frontAudioUrl": "https://example.com/hello.mp3",
  "backAudioUrl": "",
  "cardOrder": 1,
  "createdById": 1,
  "tagIds": [1, 2]
}
```

### Cập nhật Flashcard
- **Endpoint:** `PUT /api/v1/flashcards/{id}`
- **Body (JSON):**
```json
{
  "deckId": 1,
  "frontText": "Hi",
  "backText": "Chào",
  "phonetic": "/haɪ/",
  "exampleText": "Hi there!",
  "hint": "Thân mật hơn Hello",
  "note": "Chào hỏi bạn bè",
  "frontImageUrl": "",
  "backImageUrl": "",
  "frontAudioUrl": "",
  "backAudioUrl": "",
  "cardOrder": 1,
  "createdById": 1,
  "tagIds": [1]
}
```

### Xóa Flashcard (Xoá mềm - isActive = false)
- **Endpoint:** `DELETE /api/v1/flashcards/{id}`
- **Body:** Không có
