package com.lela.Quiz.timed;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "timed_quiz_states")
@Getter @Setter
public class TimedQuizState {
    @Id
    private Long attemptId;
    @Column(nullable = false, columnDefinition = "longtext")
    private String payload;
}
