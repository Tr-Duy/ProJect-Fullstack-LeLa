package com.lela.config;

import com.lela.Quiz.decktest.DeckCardFilter;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

public class FlywayCleanDbVerificationTest {

    private static final String DB_USER = System.getenv().getOrDefault("DB_USERNAME", "root");
    private static final String DB_PASS = System.getenv("DB_PASSWORD");
    private static final String CLEAN_DB_NAME = "lela_flyway_clean_verify_db";
    private static final String MYSQL_ROOT_URL = "jdbc:mysql://127.0.0.1:3306/?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
    private static final String TARGET_DB_URL = "jdbc:mysql://127.0.0.1:3306/" + CLEAN_DB_NAME + "?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8";

    @Test
    @EnabledIfEnvironmentVariable(named = "LELA_RUN_FLYWAY_CLEAN_TEST", matches = "true")
    @DisplayName("Chạy Flyway V1..V57 trên DB hoàn toàn trống và kiểm tra số liệu")
    void testFlywayOnCleanDb() throws Exception {
        if (DB_PASS == null || DB_PASS.isBlank()) {
            throw new IllegalStateException("Biến môi trường DB_PASSWORD chưa được cấu hình. Không thể chạy FlywayCleanDbVerificationTest.");
        }
        System.out.println("================================================================================");
        System.out.println("BƯỚC 1: TẠO CSDL TRỐNG: " + CLEAN_DB_NAME);
        System.out.println("================================================================================");

        try (Connection rootConn = DriverManager.getConnection(MYSQL_ROOT_URL, DB_USER, DB_PASS);
             Statement stmt = rootConn.createStatement()) {
            stmt.execute("DROP DATABASE IF EXISTS " + CLEAN_DB_NAME);
            stmt.execute("CREATE DATABASE " + CLEAN_DB_NAME + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            System.out.println("✓ Đã tạo mới CSDL trống: " + CLEAN_DB_NAME);
        }

        System.out.println("\n================================================================================");
        System.out.println("BƯỚC 2: CHẠY FLYWAY MIGRATE V1..V57 TRÊN " + CLEAN_DB_NAME);
        System.out.println("================================================================================");

        Flyway flyway = Flyway.configure()
                .dataSource(TARGET_DB_URL, DB_USER, DB_PASS)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .load();

        var result = flyway.migrate();
        System.out.println("Flyway migrate hoàn tất! Số migration áp dụng: " + result.migrationsExecuted);
        System.out.println("Target version: " + result.targetSchemaVersion);

        System.out.println("\n================================================================================");
        System.out.println("BƯỚC 3: TRUY VẤN SỐ LIỆU TRÊN CSDL VỪA MIGRATE (DÁN NGUYÊN VĂN):");
        System.out.println("================================================================================");

        DeckCardFilter filter = new DeckCardFilter();

        long totalDecks = 0;
        long totalCards = 0;
        long totalPlaceholders = 0;
        int qualifiedDecksCount = 0;

        try (Connection conn = DriverManager.getConnection(TARGET_DB_URL, DB_USER, DB_PASS);
             Statement stmt = conn.createStatement()) {

            // 1. SELECT COUNT(*) FROM decks;
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM decks")) {
                if (rs.next()) {
                    totalDecks = rs.getLong(1);
                    System.out.println("SELECT COUNT(*) FROM decks; -> " + totalDecks);
                }
            }

            // 2. SELECT COUNT(*) FROM flashcards;
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM flashcards")) {
                if (rs.next()) {
                    totalCards = rs.getLong(1);
                    System.out.println("SELECT COUNT(*) FROM flashcards; -> " + totalCards);
                }
            }

            // 3. Số thẻ chứa "từ vựng thuộc nhóm"
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM flashcards WHERE back_text LIKE '%từ vựng thuộc nhóm%'")) {
                if (rs.next()) {
                    totalPlaceholders = rs.getLong(1);
                    System.out.println("SELECT COUNT(*) FROM flashcards WHERE back_text LIKE '%từ vựng thuộc nhóm%'; -> " + totalPlaceholders);
                }
            }

            // 4. Số bộ có >= 8 thẻ hợp lệ theo DeckCardFilter
            // Lấy danh sách deck_id đang hoạt động
            List<Long> activeDeckIds = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM decks WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id")) {
                while (rs.next()) {
                    activeDeckIds.add(rs.getLong("id"));
                }
            }

            // Lấy tất cả flashcards
            record SimpleCard(Long id, Long deckId, String front, String back, Boolean isActive, Object deletedAt) {}
            List<SimpleCard> allCards = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery("SELECT id, deck_id, front_text, back_text, is_active, deleted_at FROM flashcards ORDER BY id")) {
                while (rs.next()) {
                    allCards.add(new SimpleCard(
                            rs.getLong("id"),
                            rs.getLong("deck_id"),
                            rs.getString("front_text"),
                            rs.getString("back_text"),
                            rs.getBoolean("is_active"),
                            rs.getObject("deleted_at")
                    ));
                }
            }

            Map<Long, List<SimpleCard>> cardsByDeck = new HashMap<>();
            for (SimpleCard c : allCards) {
                cardsByDeck.computeIfAbsent(c.deckId(), k -> new ArrayList<>()).add(c);
            }

            for (Long deckId : activeDeckIds) {
                List<SimpleCard> deckCards = cardsByDeck.getOrDefault(deckId, List.of());
                Set<String> seenFronts = new HashSet<>();
                int validCount = 0;
                for (SimpleCard c : deckCards) {
                    if (Boolean.TRUE.equals(c.isActive()) && c.deletedAt() == null) {
                        String fn = DeckCardFilter.normalize(c.front());
                        String bk = DeckCardFilter.normalize(c.back());
                        if (!fn.isBlank() && !bk.isBlank() && fn.length() > 1 && bk.length() > 1
                                && !bk.contains("từ vựng thuộc nhóm") && !bk.contains("đang cập nhật")
                                && !bk.matches(".*\\s+(?:ad|adv|adj|n|v)\\.?$") && !fn.matches(".*\\s+(?:ad|adv|adj|n|v)\\.?$")
                                && !bk.matches(".*\\s*\\((?:a|adj|adv|n|v|prep|conj|pron)\\.?\\)\\s*$") && !fn.matches(".*\\s*\\((?:a|adj|adv|n|v|prep|conj|pron)\\.?\\)\\s*$")
                                && !bk.matches(".*[<>={}].*")) {
                            if (seenFronts.add(fn)) {
                                validCount++;
                            }
                        }
                    }
                }
                if (validCount >= 8) {
                    qualifiedDecksCount++;
                }
            }

            System.out.println("Số bộ có >= 8 thẻ hợp lệ theo DeckCardFilter: -> " + qualifiedDecksCount);
        }

        System.out.println("\n================================================================================");
        System.out.println("BƯỚC 4: DỌN DẸP / XÓA CSDL TRỐNG: " + CLEAN_DB_NAME);
        System.out.println("================================================================================");

        try (Connection rootConn = DriverManager.getConnection(MYSQL_ROOT_URL, DB_USER, DB_PASS);
             Statement stmt = rootConn.createStatement()) {
            stmt.execute("DROP DATABASE IF EXISTS " + CLEAN_DB_NAME);
            System.out.println("✓ Đã xóa hoàn toàn CSDL trống: " + CLEAN_DB_NAME);
        }

        System.out.println("================================================================================");
    }
}
