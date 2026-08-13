package com.lela.deck.domain;

// Enum phạm vi hiển thị của deck.
public enum DeckVisibility {
    PUBLIC, // Mọi người đều có thể xem.
    UNLISTED, // Chỉ xem được khi có liên kết trực tiếp.
    PRIVATE // Chỉ chủ sở hữu hoặc người được cấp quyền xem.
}
