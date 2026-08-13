package com.lela.common.exception;
//Exception khi không tìm thấy dữ liệu
public class NotFoundExeception extends RuntimeException {
    public NotFoundExeception(String message) {
        super(message);
    }
}