package com.notesapp.exception;

import lombok.Getter;

@Getter
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}