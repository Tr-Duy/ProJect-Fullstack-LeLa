package com.lela.common.exception;
//Exception khi dữ liệu bị trùng
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}