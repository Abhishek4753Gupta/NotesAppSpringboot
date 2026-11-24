package com.notesapp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "rate-limit")
@Data
public class RateLimitProperties {
    /** Max number of requests allowed per window per client. */
    private int capacity = 100;
    /** Window length in seconds (sliding window). */
    private int windowSeconds = 60;
}