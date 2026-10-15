package com.lela.flashcard.util;

import com.lela.flashcard.FlashcardRepository;
import com.lela.flashcard.domain.Flashcard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FlashcardSanitizerRunner implements ApplicationRunner {

    private final FlashcardRepository flashcardRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            List<Flashcard> allCards = flashcardRepository.findAll();
            int cleanedCount = 0;

            for (Flashcard card : allCards) {
                String originalFront = card.getFrontText();
                if (originalFront == null) continue;

                boolean isDirty = originalFront.contains("v.,")
                        || originalFront.contains("n.,")
                        || originalFront.contains("adj.,")
                        || originalFront.contains("adv.,")
                        || originalFront.contains("(v.)")
                        || originalFront.contains("(n.)")
                        || originalFront.contains("(adj.)")
                        || originalFront.contains("(adv.)")
                        || originalFront.contains("(v)")
                        || originalFront.contains("(n)")
                        || (card.getPhonetic() != null && card.getPhonetic().length() > 35)
                        || card.getPartOfSpeech() == null;

                if (isDirty) {
                    FlashcardDataSanitizer.SanitizedResult res = FlashcardDataSanitizer.sanitize(
                            card.getFrontText(),
                            card.getBackText(),
                            card.getPhonetic(),
                            card.getPartOfSpeech(),
                            card.getDefinition(),
                            card.getExampleText(),
                            card.getExampleTranslation(),
                            card.getRelatedWords(),
                            card.getHint(),
                            card.getNote()
                    );

                    card.setFrontText(res.getWord());
                    card.setBackText(res.getVietnameseMeaning());
                    card.setPartOfSpeech(res.getPartOfSpeech());
                    card.setPhonetic(res.getPhonetic());
                    card.setDefinition(res.getDefinition());
                    if (card.getExampleText() == null || card.getExampleText().isBlank()) {
                        card.setExampleText(res.getExampleEn());
                    }
                    if (card.getExampleTranslation() == null || card.getExampleTranslation().isBlank()) {
                        card.setExampleTranslation(res.getExampleVi());
                    }
                    card.setRelatedWords(res.getRelatedWords());
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                flashcardRepository.saveAll(allCards);
                log.info("[FlashcardDataSanitizer] Successfully cleaned and standardized {} flashcards in the database.", cleanedCount);
            }
        } catch (Exception e) {
            log.warn("[FlashcardDataSanitizer] Error during startup flashcard sanitization: {}", e.getMessage());
        }
    }
}
