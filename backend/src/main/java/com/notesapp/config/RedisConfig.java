package com.notesapp.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;

/**
 * Redis cache configuration.
 *
 * <p>Per-cache TTLs are applied through a {@link RedisCacheManagerBuilderCustomizer},
 * which is the hook Spring Boot's Redis cache auto-configuration actually reads
 * (a plain {@code Map<String, RedisCacheConfiguration>} bean is ignored).
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisCacheManagerBuilderCustomizer notesCacheManagerCustomizer() {
        RedisCacheConfiguration notes = baseConfig(Duration.ofMinutes(5));
        RedisCacheConfiguration search = baseConfig(Duration.ofMinutes(2));
        RedisCacheConfiguration suggestions = baseConfig(Duration.ofMinutes(1));

        return builder -> builder
                .withCacheConfiguration("notes", notes)
                .withCacheConfiguration("search", search)
                .withCacheConfiguration("suggestions", suggestions);
    }

    private RedisCacheConfiguration baseConfig(Duration ttl) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer(cacheObjectMapper())))
                .disableCachingNullValues();
    }

    /**
     * Dedicated ObjectMapper for cache values.
     *
     * <ul>
     *   <li>{@link JavaTimeModule} so {@link java.time.Instant} fields
     *       ({@code createdAt}, {@code updatedAt}) survive a round-trip.</li>
     *   <li>Default typing so the concrete type is embedded in the JSON and
     *       {@code PageResponse<NoteResponse>} deserializes back to the right
     *       class instead of a {@code LinkedHashMap}.</li>
     * </ul>
     */
    private ObjectMapper cacheObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        // Embed the concrete type so PageResponse<NoteResponse> deserializes back
        // to the right class instead of a LinkedHashMap.
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        return mapper;
    }
}