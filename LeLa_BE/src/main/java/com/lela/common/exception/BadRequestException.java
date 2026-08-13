package com.lela.common.exception;
//Exception khi dữ liệu đầu vào sai
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}