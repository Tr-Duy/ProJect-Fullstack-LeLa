package com.lela.flashcard.util;

import lombok.Builder;
import lombok.Data;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FlashcardDataSanitizer {

    private static final Pattern PAREN_POS_PATTERN = Pattern.compile(
            "^(.+?)\\s*\\((v\\.|n\\.|adj\\.|adv\\.|prep\\.|conj\\.|phr\\.|v|n|adj|adv|phr)\\)[,\\.\\s]*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern COMMA_POS_PATTERN = Pattern.compile(
            "^(.+?)\\s+(v\\.|n\\.|adj\\.|adv\\.|prep\\.|conj\\.|phr\\.)[,\\.]+[\\s]*(.*)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern COMMA_DEFINITION_PATTERN = Pattern.compile(
            "^(.+?)[,;]\\s*(to\\s+.*)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TRAILING_POS_PATTERN = Pattern.compile(
            "^(.+?)\\s+(v|n|adj|adv|phr|prep|conj)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Map<String, String> PHONETIC_DICT = new HashMap<>();
    private static final Map<String, String[]> EXAMPLES_DICT = new HashMap<>();
    private static final Map<String, String[]> SYNONYMS_DICT = new HashMap<>();
    private static final Map<String, String[]> ANTONYMS_DICT = new HashMap<>();

    static {
        // Phonetics dictionary
        PHONETIC_DICT.put("accustom", "/əˈkʌs.təm/");
        PHONETIC_DICT.put("accustom to", "/əˈkʌs.təm tuː/");
        PHONETIC_DICT.put("abide by", "/əˈbaɪd baɪ/");
        PHONETIC_DICT.put("agreement", "/əˈɡriː.mənt/");
        PHONETIC_DICT.put("agree", "/əˈɡriː/");
        PHONETIC_DICT.put("assurance", "/əˈʃʊə.rəns/");
        PHONETIC_DICT.put("cancel", "/ˈkæn.səl/");
        PHONETIC_DICT.put("determine", "/dɪˈtɜː.mɪn/");
        PHONETIC_DICT.put("engage", "/ɪnˈɡeɪdʒ/");
        PHONETIC_DICT.put("establish", "/ɪˈstæb.lɪʃ/");
        PHONETIC_DICT.put("obligate", "/ˈɒb.lɪ.ɡeɪt/");
        PHONETIC_DICT.put("party", "/ˈpɑː.ti/");
        PHONETIC_DICT.put("apprenticeship", "/əˈpren.tɪs.ʃɪp/");
        PHONETIC_DICT.put("provision", "/prəˈvɪʒ.ən/");
        PHONETIC_DICT.put("resolve", "/rɪˈzɒlv/");
        PHONETIC_DICT.put("specific", "/spəˈsɪf.ɪk/");
        PHONETIC_DICT.put("appeal", "/əˈpiːl/");
        PHONETIC_DICT.put("arrive", "/əˈraɪv/");
        PHONETIC_DICT.put("compromise", "/ˈkɒm.prə.maɪz/");
        PHONETIC_DICT.put("daring", "/ˈdeə.rɪŋ/");
        PHONETIC_DICT.put("familiar", "/fəˈmɪl.i.ər/");
        PHONETIC_DICT.put("guide", "/ɡaɪd/");
        PHONETIC_DICT.put("guidance", "/ˈɡaɪ.dəns/");
        PHONETIC_DICT.put("majority", "/məˈdʒɒr.ə.ti/");
        PHONETIC_DICT.put("mix", "/mɪks/");
        PHONETIC_DICT.put("rely", "/rɪˈlaɪ/");
        PHONETIC_DICT.put("secure", "/sɪˈkjʊər/");
        PHONETIC_DICT.put("subject", "/ˈsʌb.dʒɪkt/");
        PHONETIC_DICT.put("apple", "/ˈæp.əl/");
        PHONETIC_DICT.put("banana", "/bəˈnɑː.nə/");
        PHONETIC_DICT.put("orange", "/ˈɒr.ɪndʒ/");
        PHONETIC_DICT.put("watermelon", "/ˈwɔː.təˌmel.ən/");
        PHONETIC_DICT.put("strawberry", "/ˈstrɔː.bər.i/");
        PHONETIC_DICT.put("contract", "/ˈkɒn.trækt/");
        PHONETIC_DICT.put("negotiate", "/nəˈɡəʊ.ʃi.eɪt/");
        PHONETIC_DICT.put("new", "/njuː/");

        // Examples dictionary: [En, Vi]
        EXAMPLES_DICT.put("accustom to", new String[]{
                "It takes time to accustom yourself to a new culture.",
                "Mất nhiều thời gian để quen dần với một nền văn hóa mới."
        });
        EXAMPLES_DICT.put("accustom", new String[]{
                "It takes time to accustom yourself to a new culture.",
                "Mất nhiều thời gian để quen dần với một nền văn hóa mới."
        });
        EXAMPLES_DICT.put("abide by", new String[]{
                "Both parties agreed to abide by the terms of the contract.",
                "Cả hai bên đã đồng ý tuân theo các điều khoản của hợp đồng."
        });
        EXAMPLES_DICT.put("agreement", new String[]{
                "They finally reached an agreement after hours of negotiation.",
                "Họ cuối cùng đã đạt được thỏa thuận sau nhiều giờ đàm phán."
        });
        EXAMPLES_DICT.put("agree", new String[]{
                "I completely agree with your proposal for the project.",
                "Tôi hoàn toàn đồng ý với đề xuất của bạn cho dự án."
        });
        EXAMPLES_DICT.put("assurance", new String[]{
                "The director gave his assurance that the deadline would be met.",
                "Giám đốc đã đưa ra sự bảo đảm rằng thời hạn sẽ được hoàn thành."
        });
        EXAMPLES_DICT.put("cancel", new String[]{
                "They had to cancel the meeting due to severe weather.",
                "Họ đã phải hủy cuộc họp do thời tiết xấu."
        });
        EXAMPLES_DICT.put("determine", new String[]{
                "We need to determine the cause of the problem immediately.",
                "Chúng ta cần xác định nguyên nhân của vấn đề ngay lập tức."
        });
        EXAMPLES_DICT.put("engage", new String[]{
                "The company plans to engage a marketing agency next month.",
                "Công ty dự định thuê một đơn vị tiếp thị vào tháng tới."
        });
        EXAMPLES_DICT.put("appeal", new String[]{
                "The new product design will appeal to younger customers.",
                "Thiết kế sản phẩm mới sẽ thu hút những khách hàng trẻ tuổi hơn."
        });
        EXAMPLES_DICT.put("arrive", new String[]{
                "We expect the shipment to arrive by tomorrow morning.",
                "Chúng tôi dự kiến lô hàng sẽ tới vào sáng mai."
        });
        EXAMPLES_DICT.put("compromise", new String[]{
                "In every negotiation, both sides have to compromise.",
                "Trong mọi cuộc đàm phán, cả hai bên đều phải thỏa hiệp."
        });
        EXAMPLES_DICT.put("daring", new String[]{
                "Taking such a big risk was a daring business move.",
                "Chấp nhận rủi ro lớn như vậy là một bước đi kinh doanh táo bạo."
        });
        EXAMPLES_DICT.put("familiar", new String[]{
                "The voice on the phone sounded familiar to him.",
                "Giọng nói qua điện thoại nghe quen thuộc với anh ấy."
        });
        EXAMPLES_DICT.put("guide", new String[]{
                "She will guide the new employees through the onboarding process.",
                "Cô ấy sẽ hướng dẫn các nhân viên mới trong quá trình hội nhập."
        });
        EXAMPLES_DICT.put("majority", new String[]{
                "The majority of board members voted in favor of the expansion.",
                "Đa số thành viên hội đồng quản trị đã bỏ phiếu ủng hộ việc mở rộng."
        });
        EXAMPLES_DICT.put("rely", new String[]{
                "You can always rely on our team for prompt support.",
                "Bạn luôn có thể tin cậy vào đội ngũ của chúng tôi để được hỗ trợ kịp thời."
        });
        EXAMPLES_DICT.put("secure", new String[]{
                "The team worked hard to secure the multimillion-dollar contract.",
                "Cả nhóm đã nỗ lực làm việc để giành được bản hợp đồng triệu đô."
        });

        // Synonyms dictionary
        SYNONYMS_DICT.put("accustom to", new String[]{"familiarize", "adapt"});
        SYNONYMS_DICT.put("accustom", new String[]{"familiarize", "adapt"});
        SYNONYMS_DICT.put("abide by", new String[]{"comply with", "conform to", "follow"});
        SYNONYMS_DICT.put("agreement", new String[]{"contract", "accord", "treaty"});
        SYNONYMS_DICT.put("agree", new String[]{"concur", "consent", "assent"});
        SYNONYMS_DICT.put("assurance", new String[]{"guarantee", "pledge", "confidence"});
        SYNONYMS_DICT.put("cancel", new String[]{"call off", "annul", "revoke"});
        SYNONYMS_DICT.put("determine", new String[]{"ascertain", "decide", "establish"});
        SYNONYMS_DICT.put("engage", new String[]{"hire", "involve", "employ"});
        SYNONYMS_DICT.put("appeal", new String[]{"attract", "allure", "charm"});
        SYNONYMS_DICT.put("arrive", new String[]{"reach", "attain", "come"});
        SYNONYMS_DICT.put("compromise", new String[]{"settlement", "concession", "deal"});
        SYNONYMS_DICT.put("daring", new String[]{"bold", "brave", "courageous"});
        SYNONYMS_DICT.put("familiar", new String[]{"well-known", "accustomed", "common"});
        SYNONYMS_DICT.put("guide", new String[]{"direct", "lead", "steer"});
        SYNONYMS_DICT.put("majority", new String[]{"bulk", "preponderance", "greater part"});
        SYNONYMS_DICT.put("rely", new String[]{"depend", "count on", "trust"});
        SYNONYMS_DICT.put("secure", new String[]{"obtain", "acquire", "protect"});

        // Antonyms dictionary
        ANTONYMS_DICT.put("accustom to", new String[]{"disaccustom"});
        ANTONYMS_DICT.put("accustom", new String[]{"disaccustom"});
        ANTONYMS_DICT.put("abide by", new String[]{"violate", "reject", "breach"});
        ANTONYMS_DICT.put("agreement", new String[]{"disagreement", "dispute"});
        ANTONYMS_DICT.put("agree", new String[]{"disagree", "oppose"});
        ANTONYMS_DICT.put("cancel", new String[]{"confirm", "proceed", "continue"});
        ANTONYMS_DICT.put("daring", new String[]{"timid", "cautious", "cowardly"});
        ANTONYMS_DICT.put("familiar", new String[]{"unfamiliar", "strange", "foreign"});
        ANTONYMS_DICT.put("majority", new String[]{"minority"});
    }

    @Data
    @Builder
    public static class SanitizedResult {
        private String word;
        private String partOfSpeech; // Normalized short code: v, n, adj, adv, phr
        private String phonetic;
        private String vietnameseMeaning;
        private String definition;
        private String exampleEn;
        private String exampleVi;
        private List<String> synonyms;
        private List<String> antonyms;
        private String relatedWords;
    }

    public static SanitizedResult sanitize(
            String rawFrontText,
            String rawBackText,
            String rawPhonetic,
            String rawPartOfSpeech,
            String rawDefinition,
            String rawExampleText,
            String rawExampleTranslation,
            String rawRelatedWords,
            String rawHint,
            String rawNote
    ) {
        String cleanWord = rawFrontText != null ? rawFrontText.trim() : "";
        String extractedPos = null;
        String extractedDef = null;

        // 1. Check Parentheses POS pattern: "Abide by (v.)", "Agreement (n.)"
        Matcher parenMatcher = PAREN_POS_PATTERN.matcher(cleanWord);
        if (parenMatcher.find()) {
            cleanWord = parenMatcher.group(1).trim();
            extractedPos = parenMatcher.group(2).trim();
            String rest = parenMatcher.group(3) != null ? parenMatcher.group(3).trim() : "";
            if (!rest.isEmpty()) {
                extractedDef = rest;
            }
        } else {
            // 2. Check Comma/Period POS pattern: "Accustom to v., to become familiar with..."
            Matcher commaMatcher = COMMA_POS_PATTERN.matcher(cleanWord);
            if (commaMatcher.find()) {
                cleanWord = commaMatcher.group(1).trim();
                extractedPos = commaMatcher.group(2).trim();
                String rest = commaMatcher.group(3) != null ? commaMatcher.group(3).trim() : "";
                if (!rest.isEmpty()) {
                    extractedDef = rest;
                }
            } else {
                // 3. Check Comma Definition pattern: "Accustom, to become familiar with..."
                Matcher defMatcher = COMMA_DEFINITION_PATTERN.matcher(cleanWord);
                if (defMatcher.find()) {
                    cleanWord = defMatcher.group(1).trim();
                    extractedDef = defMatcher.group(2).trim();
                } else {
                    // 4. Check Trailing POS pattern without dot: "Apprenticeship n"
                    Matcher trailingMatcher = TRAILING_POS_PATTERN.matcher(cleanWord);
                    if (trailingMatcher.find()) {
                        cleanWord = trailingMatcher.group(1).trim();
                        extractedPos = trailingMatcher.group(2).trim();
                    }
                }
            }
        }

        // Clean trailing punctuation on word
        cleanWord = cleanWord.replaceAll("[,.;:]+$", "").trim();

        // 4. Resolve Part of Speech (Normalized to v, n, adj, adv, phr)
        String pos = normalizePartOfSpeech(extractedPos != null ? extractedPos : rawPartOfSpeech, cleanWord, rawBackText);

        // 5. Resolve Definition
        String definition = rawDefinition;
        if (definition == null || definition.isBlank() || isDirtyDefinition(definition)) {
            if (extractedDef != null && !extractedDef.isBlank()) {
                definition = extractedDef;
            } else if (rawNote != null && !rawNote.isBlank() && !rawNote.startsWith("L") && !isDirtyDefinition(rawNote)) {
                definition = rawNote.trim();
            } else if (rawHint != null && !rawHint.isBlank() && !rawHint.startsWith("L")) {
                definition = rawHint.trim();
            } else {
                definition = inferDefaultDefinition(cleanWord, rawBackText);
            }
        }

        // 6. Resolve Phonetic
        String phonetic = rawPhonetic;
        if (phonetic == null || phonetic.isBlank() || isDirtyPhonetic(phonetic, cleanWord)) {
            phonetic = inferPhonetic(cleanWord);
        } else {
            phonetic = formatPhonetic(phonetic);
        }

        // 7. Resolve Examples
        String exampleEn = rawExampleText;
        String exampleVi = rawExampleTranslation;
        if (exampleEn == null || exampleEn.isBlank() || exampleEn.length() < 5) {
            String[] dictEx = EXAMPLES_DICT.get(cleanWord.toLowerCase());
            if (dictEx != null && dictEx.length >= 2) {
                exampleEn = dictEx[0];
                exampleVi = dictEx[1];
            } else {
                exampleEn = generateCleanExampleEn(cleanWord, pos);
                exampleVi = generateCleanExampleVi(cleanWord, rawBackText);
            }
        } else if (exampleVi == null || exampleVi.isBlank()) {
            String[] dictEx = EXAMPLES_DICT.get(cleanWord.toLowerCase());
            if (dictEx != null && dictEx.length >= 2) {
                exampleVi = dictEx[1];
            } else {
                exampleVi = generateCleanExampleVi(cleanWord, rawBackText);
            }
        if (exampleEn != null && !cleanWord.isEmpty()) {
            exampleEn = exampleEn.replaceAll("(?i)\\b" + Pattern.quote(cleanWord) + "\\s+(v|n|adj|adv|phr)\\b", cleanWord);
        }

        // 8. Resolve Synonyms & Antonyms
        List<String> synonyms = new ArrayList<>();
        List<String> antonyms = new ArrayList<>();

        String[] dictSyns = SYNONYMS_DICT.get(cleanWord.toLowerCase());
        if (dictSyns != null) {
            synonyms.addAll(Arrays.asList(dictSyns));
        }

        String[] dictAnts = ANTONYMS_DICT.get(cleanWord.toLowerCase());
        if (dictAnts != null) {
            antonyms.addAll(Arrays.asList(dictAnts));
        }

        String relatedWords = rawRelatedWords;
        if (relatedWords != null && !relatedWords.isBlank() && !isDirtyRelatedWords(relatedWords)) {
            // Parse existing related words into synonyms list if not already present
            String[] parts = relatedWords.split("[,;·•]");
            for (String p : parts) {
                String cleanP = p.trim();
                if (!cleanP.isEmpty() && !cleanP.equalsIgnoreCase(cleanWord) && !synonyms.contains(cleanP)) {
                    synonyms.add(cleanP);
                }
            }
        } else {
            // Generate clean related words string
            relatedWords = generateRelatedWords(cleanWord, synonyms);
        }

        String vietnameseMeaning = rawBackText != null ? rawBackText.trim() : "";
        // Clean any leading/trailing dirty markers from backText
        vietnameseMeaning = vietnameseMeaning.replaceAll("^\\([vnadjp\\.\\s]+\\)\\s*", "").trim();

        return SanitizedResult.builder()
                .word(cleanWord)
                .partOfSpeech(pos)
                .phonetic(phonetic)
                .vietnameseMeaning(vietnameseMeaning)
                .definition(definition)
                .exampleEn(exampleEn)
                .exampleVi(exampleVi)
                .synonyms(synonyms)
                .antonyms(antonyms)
                .relatedWords(relatedWords)
                .build();
    }

    public static String normalizePartOfSpeech(String rawPos, String word, String meaning) {
        if (rawPos != null && !rawPos.isBlank()) {
            String p = rawPos.trim().toLowerCase();
            if (p.equals("v") || p.startsWith("v.") || p.contains("verb") || p.contains("động")) return "v";
            if (p.equals("n") || p.startsWith("n.") || p.contains("noun") || p.contains("danh")) return "n";
            if (p.equals("adj") || p.startsWith("adj.") || p.contains("adjective") || p.contains("tính")) return "adj";
            if (p.equals("adv") || p.startsWith("adv.") || p.contains("adverb") || p.contains("trạng") || p.contains("phó")) return "adv";
            if (p.equals("phr") || p.startsWith("phr.") || p.contains("phrase") || p.contains("cụm")) return "phr";
            if (p.equals("prep") || p.startsWith("prep.") || p.contains("preposition") || p.contains("giới")) return "prep";
            if (p.equals("conj") || p.startsWith("conj.") || p.contains("conjunction") || p.contains("liên")) return "conj";
        }

        if (word != null && word.contains(" ")) {
            String lower = word.toLowerCase();
            if (lower.startsWith("abide by") || lower.startsWith("accustom to") || lower.startsWith("agree with")) {
                return "v";
            }
            return "phr";
        }

        if (meaning != null && !meaning.isBlank()) {
            String m = meaning.toLowerCase();
            if (m.contains("tính từ") || m.contains("thuộc về") || m.startsWith("rất ") || m.startsWith("có tính")) return "adj";
            if (m.contains("động từ") || m.startsWith("làm ") || m.startsWith("tuân ") || m.startsWith("tới ") || m.startsWith("đồng ý") || m.startsWith("hủy ") || m.startsWith("xác định")) return "v";
            if (m.contains("trạng từ") || m.contains("phó từ") || m.endsWith("một cách")) return "adv";
            if (m.contains("danh từ") || m.startsWith("sự ") || m.startsWith("người ") || m.startsWith("cuộc ") || m.startsWith("quả ") || m.startsWith("trái ")) return "n";
        }

        return "n";
    }

    public static String inferPhonetic(String word) {
        if (word == null || word.isBlank()) return "";
        String lower = word.toLowerCase().trim();
        String exact = PHONETIC_DICT.get(lower);
        if (exact != null) return exact;

        // If multi-word, see if parts exist
        if (lower.contains(" ")) {
            String[] parts = lower.split("\\s+");
            StringBuilder sb = new StringBuilder();
            for (String p : parts) {
                String sub = PHONETIC_DICT.get(p);
                if (sub != null) {
                    sb.append(sub.replaceAll("^/|/$", "")).append(" ");
                } else {
                    sb.append(p).append(" ");
                }
            }
            return "/" + sb.toString().trim() + "/";
        }

        return "/" + lower + "/";
    }

    public static String formatPhonetic(String p) {
        if (p == null || p.isBlank()) return "";
        String clean = p.trim().replaceAll("^/+|/+$", "");
        return "/" + clean + "/";
    }

    private static boolean isDirtyPhonetic(String phonetic, String word) {
        if (phonetic == null) return false;
        String p = phonetic.toLowerCase().replaceAll("^/+|/+$", "").trim();
        if (p.contains("to become") || p.contains("v.,") || p.contains("n.,") || p.contains("to reach") || p.contains("a settlement") || phonetic.length() > 35) {
            return true;
        }
        if (p.matches(".*\\s+(v|n|adj|adv|phr)$")) {
            return true;
        }
        return false;
    }

    private static boolean isDirtyDefinition(String def) {
        if (def == null) return false;
        return def.startsWith("L1 ") || def.startsWith("L2 ") || def.startsWith("L3") || def.matches("^L\\d+\\s+.*");
    }

    private static boolean isDirtyRelatedWords(String rw) {
        if (rw == null) return false;
        return rw.contains("to become") || rw.contains("v.,") || rw.contains("n.,") || rw.length() > 60;
    }

    private static String inferDefaultDefinition(String word, String meaning) {
        if (meaning != null && !meaning.isBlank()) {
            return meaning;
        }
        return "Thuật ngữ và bài học từ vựng cho " + word;
    }

    private static String generateCleanExampleEn(String word, String pos) {
        String w = word != null ? word.trim() : "";
        if ("v".equalsIgnoreCase(pos)) {
            return "Please " + w.toLowerCase() + " carefully according to instructions.";
        }
        if ("adj".equalsIgnoreCase(pos)) {
            return "This approach is very " + w.toLowerCase() + " in modern practice.";
        }
        return "The " + w.toLowerCase() + " is an essential part of the curriculum.";
    }

    private static String generateCleanExampleVi(String word, String meaning) {
        if (meaning != null && !meaning.isBlank()) {
            return "Ví dụ thực tế cho từ mang ý nghĩa: " + meaning;
        }
        return "Câu ví dụ thực tế minh họa cách sử dụng từ " + word + ".";
    }

    private static String generateRelatedWords(String word, List<String> synonyms) {
        if (synonyms != null && !synonyms.isEmpty()) {
            return String.join(" · ", synonyms);
        }
        // ONLY inflect if word is a single alphabetic word without spaces!
        if (word != null && !word.contains(" ") && word.matches("^[a-zA-Z]+$") && word.length() >= 3) {
            String lower = word.toLowerCase();
            return lower + "s · " + lower + "ing · " + lower + "ed";
        }
        return "";
    }
}
