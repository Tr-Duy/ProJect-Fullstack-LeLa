package com.lela;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@EnableCaching
@EnableScheduling
public class Application {

    private static final Logger log = LoggerFactory.getLogger(Application.class);

    public static void main(String[] args) {
        loadEnvFile();
        SpringApplication.run(Application.class, args);
        checkGoogleOAuthConfig();
    }

    private static void loadEnvFile() {
        Path[] envPaths = new Path[]{
                Paths.get(".env"),
                Paths.get("LeLa_BE/.env"),
                Paths.get("../.env")
        };

        for (Path envPath : envPaths) {
            if (Files.exists(envPath)) {
                try {
                    List<String> lines = Files.readAllLines(envPath);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String key = line.substring(0, idx).trim();
                            String val = line.substring(idx + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    log.info("Successfully loaded environment variables from {}", envPath.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    log.warn("Failed to load environment file from {}: {}", envPath, e.getMessage());
                }
            }
        }
    }

    private static void checkGoogleOAuthConfig() {
        String clientId = System.getProperty("GOOGLE_CLIENT_ID", System.getenv("GOOGLE_CLIENT_ID"));
        String clientSecret = System.getProperty("GOOGLE_CLIENT_SECRET", System.getenv("GOOGLE_CLIENT_SECRET"));

        boolean hasClientId = clientId != null && !clientId.isBlank() 
                && !clientId.contains("YOUR_GOOGLE_CLIENT_ID")
                && clientId.endsWith(".apps.googleusercontent.com");

        boolean hasClientSecret = clientSecret != null && !clientSecret.isBlank() 
                && !clientSecret.contains("YOUR_GOOGLE_CLIENT_SECRET");

        log.info("=================================================");
        log.info("GOOGLE_CLIENT_ID: {}", hasClientId ? "PRESENT" : "MISSING");
        log.info("GOOGLE_CLIENT_SECRET: {}", hasClientSecret ? "PRESENT" : "MISSING");
        log.info("Authorized Redirect URI: http://localhost:8080/api/v1/login/oauth2/code/google");
        log.info("=================================================");
    }
}
