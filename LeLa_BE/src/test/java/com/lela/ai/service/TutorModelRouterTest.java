package com.lela.ai.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TutorModelRouterTest {

    private TutorModelRouter router;

    @BeforeEach
    void setUp() {
        router = new TutorModelRouter();
        router.setPrimaryModel("gemini-3.6-flash");
        router.setLiteModel("gemini-3.5-flash-lite");
        router.setLiteEnabled(true);
        router.setLongPromptThreshold(160);
    }

    @Test
    void testLiteModesRouting() {
        assertEquals("gemini-3.5-flash-lite", router.selectModel("translation", "Dịch câu này"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("sentence", "I goes to school"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("sentence_correction", "Check this"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("vocabulary", "Giải thích từ resilient"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("grammar", "Cách dùng a/an/the"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("explain", "Giải thích"));
    }

    @Test
    void testPersonalizationRoutingInChatMode() {
        assertEquals("gemini-3.5-flash-lite", router.selectModel("chat", "Tôi nên ôn gì hôm nay?"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("chat", "Lộ trình học tiếp theo của tôi thế nào?"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("chat", "Tiến độ học hôm nay đã đạt mục tiêu chưa?"));
        assertEquals("gemini-3.5-flash-lite", router.selectModel("chat", "Gợi ý học tập cho bài quiz vừa rồi"));
    }

    @Test
    void testDeepAnalysisAndLongPromptRouting() {
        // Deep analysis keyword triggers primary model
        assertEquals("gemini-3.6-flash", router.selectModel("chat", "Giải thích bài đọc hiểu Part 7 sau đây..."));
        assertEquals("gemini-3.6-flash", router.selectModel("chat", "Phân tích sâu ngữ pháp đoạn văn này với nhiều phần"));

        // Prompt longer than 160 characters in chat mode triggers primary model
        String longPrompt = "a".repeat(161);
        assertEquals("gemini-3.6-flash", router.selectModel("chat", longPrompt));

        // Short normal chat defaults to lite
        assertEquals("gemini-3.5-flash-lite", router.selectModel("chat", "Hello, how are you?"));
    }

    @Test
    void testLiteDisabledAlwaysRoutesToPrimary() {
        router.setLiteEnabled(false);
        assertEquals("gemini-3.6-flash", router.selectModel("translation", "Dịch câu"));
        assertEquals("gemini-3.6-flash", router.selectModel("vocabulary", "Từ vựng"));
        assertEquals("gemini-3.6-flash", router.selectModel("chat", "Tôi nên ôn gì hôm nay?"));
    }

    @Test
    void testThinkingLevelCalculation() {
        assertEquals("minimal", router.determineThinkingLevel("gemini-3.5-flash-lite", "vocabulary", "resilient"));
        assertEquals("minimal", router.determineThinkingLevel("gemini-3.6-flash", "chat", "Hello"));
        assertEquals("low", router.determineThinkingLevel("gemini-3.6-flash", "chat", "Phân tích sâu nhiều phần về thì hiện tại hoàn thành"));
        assertEquals("low", router.determineThinkingLevel("gemini-3.6-flash", "chat", "a".repeat(161)));
    }
}
