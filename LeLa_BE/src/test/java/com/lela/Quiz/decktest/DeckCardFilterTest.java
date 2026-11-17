package com.lela.Quiz.decktest;

import com.lela.flashcard.domain.Flashcard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DeckCardFilterTest {

    private DeckCardFilter filter;

    @BeforeEach
    void setUp() {
        filter = new DeckCardFilter();
    }

    private Flashcard createCard(Long id, String front, String back, String pos) {
        Flashcard f = new Flashcard();
        f.setId(id);
        f.setFrontText(front);
        f.setBackText(back);
        f.setPartOfSpeech(pos);
        f.isActive = true;
        return f;
    }

    @Test
    @DisplayName("Thẻ hợp lệ phải vượt qua bộ lọc")
    void shouldAcceptValidCard() {
        Flashcard card = createCard(1L, "contract", "hợp đồng, giao kèo", "noun");
        assertThat(filter.isValidCard(card)).isTrue();
    }

    @Test
    @DisplayName("Loại bỏ thẻ có nghĩa placeholder dạng 'từ vựng thuộc nhóm...'")
    void shouldRejectPlaceholderGroupMeaning() {
        Flashcard card = createCard(2L, "automatic", "từ vựng thuộc nhóm automatic (tính từ / trạng từ)", "adj");
        assertThat(filter.isValidCard(card)).isFalse();
    }

    @Test
    @DisplayName("Loại bỏ thẻ có nghĩa 'đang cập nhật'")
    void shouldRejectUpdatingMeaning() {
        Flashcard card = createCard(3L, "negotiate", "đang cập nhật...", "verb");
        assertThat(filter.isValidCard(card)).isFalse();
    }

    @Test
    @DisplayName("Loại bỏ thẻ có đuôi rác như ' ad', ' adv', ' n', ' v'")
    void shouldRejectGarbageSuffix() {
        Flashcard card1 = createCard(4L, "bargain ad", "mặc cả", "verb");
        Flashcard card2 = createCard(5L, "bargain", "mặc cả ad", "verb");
        assertThat(filter.isValidCard(card1)).isFalse();
        assertThat(filter.isValidCard(card2)).isFalse();
    }

    @Test
    @DisplayName("Loại bỏ thẻ rỗng, null hoặc quá ngắn")
    void shouldRejectBlankOrTooShortCard() {
        Flashcard blankFront = createCard(6L, "", "hợp đồng", "noun");
        Flashcard blankBack = createCard(7L, "contract", "", "noun");
        Flashcard singleChar = createCard(8L, "a", "b", "noun");
        assertThat(filter.isValidCard(blankFront)).isFalse();
        assertThat(filter.isValidCard(blankBack)).isFalse();
        assertThat(filter.isValidCard(singleChar)).isFalse();
    }

    @Test
    @DisplayName("Loại bỏ thẻ inactive hoặc đã bị xóa mềm")
    void shouldRejectInactiveOrDeletedCard() {
        Flashcard inactive = createCard(9L, "warranty", "bảo hành", "noun");
        inactive.isActive = false;
        Flashcard deleted = createCard(10L, "warranty", "bảo hành", "noun");
        deleted.setDeletedAt(java.time.LocalDateTime.now());
        assertThat(filter.isValidCard(inactive)).isFalse();
        assertThat(filter.isValidCard(deleted)).isFalse();
    }

    @Test
    @DisplayName("filterValidCards lọc đúng danh sách thẻ hợp lệ")
    void shouldFilterListCorrectly() {
        List<Flashcard> list = List.of(
                createCard(1L, "contract", "hợp đồng", "noun"),
                createCard(2L, "bad", "từ vựng thuộc nhóm bad", "adj"),
                createCard(3L, "market", "thị trường", "noun")
        );
        List<Flashcard> valid = filter.filterValidCards(list);
        assertThat(valid).hasSize(2);
        assertThat(valid.stream().map(Flashcard::getFrontText)).containsExactly("contract", "market");
    }

    @Test
    @DisplayName("filterValidCards khử trùng lặp theo (deck_id, front_text chuẩn hóa), giữ thẻ đầu tiên")
    void shouldDeduplicateCardsWithSameNormalizedFrontTextWithinSameDeck() {
        com.lela.deck.domain.Deck deck22 = new com.lela.deck.domain.Deck();
        deck22.setId(22L);

        Flashcard card1 = createCard(893L, "Register", "Ghi vào sổ, đăng ký", "v");
        card1.setDeck(deck22);

        Flashcard card2 = createCard(894L, "register", "Sổ đăng ký", "n");
        card2.setDeck(deck22);

        Flashcard card3 = createCard(895L, "access", "truy cập", "v");
        card3.setDeck(deck22);

        List<Flashcard> result = filter.filterValidCards(List.of(card1, card2, card3));
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(893L);
        assertThat(result.get(0).getFrontText()).isEqualTo("Register");
        assertThat(result.get(1).getId()).isEqualTo(895L);
        assertThat(result.get(1).getFrontText()).isEqualTo("access");
    }

    @Test
    @DisplayName("filterValidCards cho phép cùng front_text ở 2 deck khác nhau")
    void shouldAllowSameFrontTextAcrossDifferentDecks() {
        com.lela.deck.domain.Deck deck22 = new com.lela.deck.domain.Deck();
        deck22.setId(22L);
        com.lela.deck.domain.Deck deck23 = new com.lela.deck.domain.Deck();
        deck23.setId(23L);

        Flashcard cardA = createCard(1L, "Register", "Ghi vào sổ", "v");
        cardA.setDeck(deck22);

        Flashcard cardB = createCard(2L, "Register", "Đăng ký", "v");
        cardB.setDeck(deck23);

        List<Flashcard> result = filter.filterValidCards(List.of(cardA, cardB));
        assertThat(result).hasSize(2);
    }
}
