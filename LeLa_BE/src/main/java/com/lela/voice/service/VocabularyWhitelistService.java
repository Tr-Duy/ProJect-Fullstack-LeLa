package com.lela.voice.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VocabularyWhitelistService {

    // Bảng bất quy tắc thông dụng
    private static final Map<String, String> IRREGULAR_FORMS = new HashMap<>();
    static {
        // Động từ bất quy tắc (Past & Past Participle -> Base)
        IRREGULAR_FORMS.put("went", "go");
        IRREGULAR_FORMS.put("gone", "go");
        IRREGULAR_FORMS.put("goes", "go");
        IRREGULAR_FORMS.put("came", "come");
        IRREGULAR_FORMS.put("saw", "see");
        IRREGULAR_FORMS.put("seen", "see");
        IRREGULAR_FORMS.put("got", "get");
        IRREGULAR_FORMS.put("gotten", "get");
        IRREGULAR_FORMS.put("made", "make");
        IRREGULAR_FORMS.put("took", "take");
        IRREGULAR_FORMS.put("taken", "take");
        IRREGULAR_FORMS.put("gave", "give");
        IRREGULAR_FORMS.put("given", "give");
        IRREGULAR_FORMS.put("knew", "know");
        IRREGULAR_FORMS.put("known", "know");
        IRREGULAR_FORMS.put("thought", "think");
        IRREGULAR_FORMS.put("felt", "feel");
        IRREGULAR_FORMS.put("told", "tell");
        IRREGULAR_FORMS.put("found", "find");
        IRREGULAR_FORMS.put("bought", "buy");
        IRREGULAR_FORMS.put("brought", "bring");
        IRREGULAR_FORMS.put("spoke", "speak");
        IRREGULAR_FORMS.put("spoken", "speak");
        IRREGULAR_FORMS.put("wrote", "write");
        IRREGULAR_FORMS.put("written", "write");
        IRREGULAR_FORMS.put("ate", "eat");
        IRREGULAR_FORMS.put("eaten", "eat");
        IRREGULAR_FORMS.put("drank", "drink");
        IRREGULAR_FORMS.put("drunk", "drink");
        IRREGULAR_FORMS.put("ran", "run");
        IRREGULAR_FORMS.put("swam", "swim");
        IRREGULAR_FORMS.put("began", "begin");
        IRREGULAR_FORMS.put("begun", "begin");

        // Danh từ bất quy tắc (Plural -> Singular)
        IRREGULAR_FORMS.put("children", "child");
        IRREGULAR_FORMS.put("people", "person");
        IRREGULAR_FORMS.put("men", "man");
        IRREGULAR_FORMS.put("women", "woman");
        IRREGULAR_FORMS.put("teeth", "tooth");
        IRREGULAR_FORMS.put("feet", "foot");
        IRREGULAR_FORMS.put("mice", "mouse");

        // So sánh tính từ
        IRREGULAR_FORMS.put("better", "good");
        IRREGULAR_FORMS.put("best", "good");
        IRREGULAR_FORMS.put("worse", "bad");
        IRREGULAR_FORMS.put("worst", "bad");
        IRREGULAR_FORMS.put("more", "much");
        IRREGULAR_FORMS.put("most", "much");
    }

    /**
     * Chuẩn hóa từ vựng: chuyển thành chữ thường, loại bỏ ký tự đặc biệt ở đầu/cuối
     */
    public String normalizeToken(String raw) {
        if (raw == null) return "";
        String cleaned = raw.trim().toLowerCase();
        // Xóa dấu câu ở đầu hoặc cuối (vd: "apple," -> "apple")
        cleaned = cleaned.replaceAll("^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "");
        return cleaned;
    }

    /**
     * Sinh tất cả các dạng hình thái hợp lệ (inflections) của một từ gốc.
     * TUYỆT ĐỐI không cắt bừa bãi tránh nhầm lẫn:
     * university != universe, organ != organize
     */
    public Set<String> generateInflections(String baseWord) {
        Set<String> forms = new HashSet<>();
        if (baseWord == null || baseWord.isBlank()) return forms;

        String base = normalizeToken(baseWord);
        if (base.isEmpty()) return forms;

        forms.add(base);

        // Quy tắc danh từ số nhiều / động từ ngôi thứ 3 số ít: -s, -es, -ies
        if (base.endsWith("y") && base.length() > 2 && !isVowel(base.charAt(base.length() - 2))) {
            forms.add(base.substring(0, base.length() - 1) + "ies");
        } else if (base.endsWith("s") || base.endsWith("sh") || base.endsWith("ch") || base.endsWith("x") || base.endsWith("z")) {
            forms.add(base + "es");
        } else {
            forms.add(base + "s");
        }

        // Quy tắc quá khứ / phân từ: -ed, -d, -ied
        if (base.endsWith("e")) {
            forms.add(base + "d");
        } else if (base.endsWith("y") && base.length() > 2 && !isVowel(base.charAt(base.length() - 2))) {
            forms.add(base.substring(0, base.length() - 1) + "ied");
        } else {
            forms.add(base + "ed");
        }

        // Quy tắc tiếp diễn: -ing
        if (base.endsWith("ee")) {
            forms.add(base + "ing");
        } else if (base.endsWith("e") && base.length() > 2) {
            forms.add(base.substring(0, base.length() - 1) + "ing");
        } else {
            forms.add(base + "ing");
        }

        // Bổ sung các dạng bất quy tắc ngược (nếu base có trong bảng giá trị)
        for (Map.Entry<String, String> entry : IRREGULAR_FORMS.entrySet()) {
            if (entry.getValue().equalsIgnoreCase(base)) {
                forms.add(entry.getKey());
            }
        }

        return forms;
    }

    private boolean isVowel(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }

    /**
     * Kiểm tra xem một từ trong câu của người học có khớp với từ mục tiêu không
     */
    public boolean matchesTargetWord(String candidateToken, String targetWord) {
        if (candidateToken == null || targetWord == null) return false;
        String cand = normalizeToken(candidateToken);
        String target = normalizeToken(targetWord);
        if (cand.isEmpty() || target.isEmpty()) return false;

        if (cand.equals(target)) return true;

        // Kiểm tra qua tập biến thể sinh sẵn
        Set<String> inflections = generateInflections(target);
        if (inflections.contains(cand)) return true;

        // Tra cứu bất quy tắc
        String irregularBase = IRREGULAR_FORMS.get(cand);
        if (irregularBase != null && irregularBase.equals(target)) {
            return true;
        }

        return false;
    }

    /**
     * Tách câu thành danh sách tokens đã chuẩn hóa
     */
    public List<String> tokenizeText(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String[] parts = text.split("\\s+");
        List<String> tokens = new ArrayList<>();
        for (String p : parts) {
            String norm = normalizeToken(p);
            if (!norm.isEmpty()) {
                tokens.add(norm);
            }
        }
        return tokens;
    }

    /**
     * Tính tỷ lệ từ nằm ngoài whitelist
     */
    public double calculateOffWhitelistRatio(String text, Set<String> whitelist) {
        List<String> tokens = tokenizeText(text);
        if (tokens.isEmpty()) return 0.0;

        int offCount = 0;
        for (String token : tokens) {
            // Cho phép số và tên riêng đơn giản
            if (token.matches("\\d+")) continue;

            boolean inWhitelist = whitelist.contains(token);
            if (!inWhitelist) {
                String irregularBase = IRREGULAR_FORMS.get(token);
                if (irregularBase != null && whitelist.contains(irregularBase)) {
                    inWhitelist = true;
                }
            }

            if (!inWhitelist) {
                offCount++;
            }
        }

        return (double) offCount / tokens.size();
    }
}
