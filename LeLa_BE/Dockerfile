# Multi-stage Dockerfile for Spring Boot (Java 21) - Production deployment on Render

# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy pom.xml first to cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: Create and switch to non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy compiled executable WAR artifact from builder stage
COPY --from=builder /app/target/*.war app.war

# Default production environment variables (overridden by Render runtime environment)
ENV APP_PROFILE=prod \
    PORT=8080

EXPOSE ${PORT}

# Start Spring Boot application bound to 0.0.0.0:${PORT}
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.war"]
