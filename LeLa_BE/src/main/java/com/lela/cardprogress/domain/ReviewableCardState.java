package com.lela.cardprogress.domain;



// Enum trạng thái thẻ được phép xuất hiện trong sự kiện review SRS.
public enum ReviewableCardState {
    NEW, // Thẻ mới, chưa học.
    LEARNING, // Thẻ đang trong giai đoạn học.
    REVIEW, // Thẻ đang trong giai đoạn ôn tập.
    RELEARNING // Thẻ đang học lại sau khi quên.
}

