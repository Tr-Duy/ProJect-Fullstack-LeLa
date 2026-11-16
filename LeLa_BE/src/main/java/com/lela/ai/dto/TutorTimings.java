package com.lela.ai.dto;
import lombok.Data;

/** Numeric diagnostics only; never contains prompts, answers or credentials. */
@Data
public class TutorTimings {
    private double contextMs;
    private double promptMs;
    private double providerFirstByteMs;
    private double providerFirstTextMs;
    private double providerTotalMs;
    private double parseMs;
    private double dbMs;
    private double totalMs;
    private int attempts;
    private int retries;
    private int fallbacks;
}
