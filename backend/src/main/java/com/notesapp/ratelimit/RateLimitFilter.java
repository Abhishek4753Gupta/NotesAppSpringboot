package com.notesapp.ratelimit;

import com.notesapp.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bucket4j-based sliding-window rate limiter.
 *
 * A separate bucket is kept per client IP. Each bucket allows
 * `capacity` tokens over a sliding window of `windowSeconds`. When a token is
 * consumed and the bucket is exhausted, the request is rejected with 429.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Bandwidth bandwidth;

    public RateLimitFilter(RateLimitProperties props) {
        // Sliding window: greedy refill of `capacity` tokens every `windowSeconds`.
        this.bandwidth = Bandwidth.builder()
                .capacity(props.getCapacity())
                .refillGreedy(props.getCapacity(), Duration.ofSeconds(props.getWindowSeconds()))
                .build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only rate-limit the REST API, not actuator/health or static.
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String clientKey = resolveClientKey(request);
        Bucket bucket = buckets.computeIfAbsent(clientKey, k -> Bucket.builder()
                .addLimit(bandwidth)
                .build());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.setHeader("X-RateLimit-Limit", String.valueOf(bandwidth.getCapacity()));
            long waitForRefill = bucket.getAvailableTokens() >= 1 ? 0 : 1;
            response.setHeader("Retry-After", String.valueOf(Math.max(waitForRefill, 1)));
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\"," +
                    "\"message\":\"Rate limit exceeded, please retry later\"}");
        }
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}