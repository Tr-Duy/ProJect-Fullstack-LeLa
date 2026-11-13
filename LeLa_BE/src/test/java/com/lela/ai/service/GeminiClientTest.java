package com.lela.ai.service;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.ai.config.GeminiConfiguration;
import com.lela.ai.dto.GeminiRequest;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class GeminiClientTest {
    @Test
    void sendsKeyOnlyInHeaderForBothEndpointsAndRedactsErrorLogs() throws Exception {
        String key = "test-secret-key-never-log";
        var uri = new AtomicReference<String>();
        var header = new AtomicReference<String>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/models/", exchange -> {
            uri.set(exchange.getRequestURI().toString());
            header.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            exchange.getRequestBody().readAllBytes();
            byte[] response = ("error echoed " + key).getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(400, response.length);
            try (var body = exchange.getResponseBody()) { body.write(response); }
        });
        Logger logger = (Logger) LoggerFactory.getLogger(GeminiClient.class);
        var logs = new ListAppender<ILoggingEvent>();
        logs.start();
        logger.addAppender(logs);
        server.start();
        try {
            var config = new GeminiConfiguration();
            config.setApiKey(key);
            config.setPrimaryModel("test-model");
            config.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/models");
            var client = new GeminiClient(config, new ObjectMapper());
            var request = new GeminiRequest();

            assertEquals(400, client.generateContent(request).get(5, TimeUnit.SECONDS).statusCode());
            assertEquals("/models/test-model:generateContent", uri.get());
            assertEquals(key, header.get());
            assertFalse(config.getApiUrl().contains(key));
            assertEquals("/models/fallback:generateContent",
                    java.net.URI.create(config.getGenerateContentUrl("fallback")).getPath());

            try (var body = client.streamGenerateContent(request).get(5, TimeUnit.SECONDS).body()) {
                assertNotNull(body);
            }
            assertEquals("/models/test-model:streamGenerateContent?alt=sse", uri.get());
            assertEquals(key, header.get());
            assertFalse(logs.list.isEmpty());
            for (var event : logs.list) {
                assertFalse(event.getFormattedMessage().contains(key), "API key leaked in logs");
                if (event.getThrowableProxy() != null) {
                    assertFalse(ch.qos.logback.classic.spi.ThrowableProxyUtil
                            .asString(event.getThrowableProxy()).contains(key));
                }
            }
            assertTrue(logs.list.stream().anyMatch(e -> e.getFormattedMessage().contains("[REDACTED]")));
        } finally {
            server.stop(0);
            logger.detachAppender(logs);
            logs.stop();
        }
    }
}
