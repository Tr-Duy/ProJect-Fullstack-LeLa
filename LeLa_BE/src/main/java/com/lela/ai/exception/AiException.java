package com.lela.ai.exception;

import lombok.Getter;

@Getter
public class AiException extends RuntimeException {
    private final String errorCode;

    public AiException(String message) {
        super(message);
        this.errorCode = "GEMINI_ERROR";
    }

    public AiException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AiException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "GEMINI_ERROR";
    }

    public AiException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}
