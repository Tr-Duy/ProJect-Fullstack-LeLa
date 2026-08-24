package com.lela.config;

import com.lela.auth.JwtAuthenticationFilter;
import com.lela.auth.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:${app.frontend-url:http://localhost:5173}}")
    private String rawAllowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    }

    @Bean
    public SecurityFilterChain securityWebFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\",\"data\":null,\"timestamp\":null}");
                        })
                )
                .authorizeHttpRequests(auth -> auth

                        // ── Auth ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/auth/check-username").permitAll()
                        .requestMatchers(HttpMethod.GET, "/auth/check-email").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/refresh-token").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/oauth2/exchange").permitAll()

                        // ── Public browse (guest có thể xem) ─────────────
                        .requestMatchers(HttpMethod.POST, "/payments/webhook/sepay").permitAll()
                        .requestMatchers(HttpMethod.GET, "/languages").permitAll()
                        .requestMatchers(HttpMethod.GET, "/subscription-plans").permitAll()
                        .requestMatchers(HttpMethod.GET, "/decks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/decks/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/flashcards/deck/{deckId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/quizzes/deck/{deckId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/leaderboard/**").permitAll()

                        // ── Swagger / error ───────────────────────────────
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**"
                        ).permitAll()

                        // ── Chat & WebSocket ───────────────────────────────
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/chat/guest/**").permitAll()

                        // ── Admin Endpoints ───────────────────────────────
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // ── Tất cả còn lại phải login ─────────────────────
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler(new org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler(frontendUrl + "/login?error=true"))
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = java.util.Arrays.stream(rawAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

