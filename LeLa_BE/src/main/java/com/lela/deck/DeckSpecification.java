package com.lela.deck;

import com.lela.deck.domain.Deck;
import com.lela.deck.domain.DeckDifficulty;
import com.lela.deck.domain.DeckStatus;
import com.lela.deck.domain.DeckVisibility;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class DeckSpecification {

    public static Specification<Deck> filterDecks(
            String search,
            Long levelId,
            Long topicId,
            Long tagId,
            DeckDifficulty difficulty,
            DeckStatus status,
            DeckVisibility visibility
    ) {
        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            // Active & non-deleted
            predicates.add(cb.equal(root.get("isActive"), true));
            predicates.add(cb.isNull(root.get("deletedAt")));

            // Search (title, deckCode, slug, description)
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate codeLike = cb.like(cb.lower(root.get("deckCode")), pattern);
                Predicate slugLike = cb.like(cb.lower(root.get("slug")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleLike, codeLike, slugLike, descLike));
            }

            // Level ID
            if (levelId != null) {
                predicates.add(cb.equal(root.get("level").get("id"), levelId));
            }

            // Topic ID
            if (topicId != null) {
                predicates.add(cb.equal(root.get("topic").get("id"), topicId));
            }

            // Tag ID
            if (tagId != null) {
                Join<Object, Object> tagJoin = root.join("tags", JoinType.LEFT);
                predicates.add(cb.equal(tagJoin.get("id"), tagId));
            }

            // Difficulty
            if (difficulty != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficulty));
            }

            // Status
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Visibility
            if (visibility != null) {
                predicates.add(cb.equal(root.get("visibility"), visibility));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
