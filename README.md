# LeLa - English Vocabulary Learning System

An AI-assisted English vocabulary learning platform powered by the Spaced Repetition System (SRS).

## Overview

LeLa is an English vocabulary learning platform designed to help learners improve vocabulary retention through spaced repetition and personalized learning features.

The backend is built with Java and Spring Boot, providing RESTful APIs for learning, authentication, quizzes, progress tracking, subscriptions, payments, achievements, notifications, and real-time communication.

## Features

- Spaced Repetition System (SRS)
- Flashcard-based vocabulary learning
- Review scheduling and progress tracking
- Learning sessions
- JWT/OAuth2 authentication
- Role-based authorization
- Refresh token management
- AI-generated quizzes with Google Gemini
- Personalized learning features
- Subscription management
- Payment processing with SePay
- Achievement system
- Leaderboard
- Notifications
- Real-time chat with WebSocket

## Tech Stack

### Backend

- Java
- Spring Boot
- Spring Data JPA
- Hibernate
- Spring Security
- JWT / OAuth2
- Maven

### Database

- MySQL
- Flyway

### Integration

- Google Gemini API
- SePay
- WebSocket
- Swagger / OpenAPI

### Testing

- JUnit 5
- Mockito

## Architecture

The backend follows a layered architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database

The project separates business logic, data access, API contracts, authentication, and external service integrations to improve maintainability and scalability.

API Documentation

Swagger/OpenAPI is integrated into the project for API documentation and testing.

Project Structure
src/
├── main/
│   ├── java/
│   │   └── ...
│   └── resources/
│       └── ...
└── test/
    └── ...
Getting Started
Requirements
Java 21+
Maven
MySQL
Git
Clone the repository
git clone https://github.com/Tr-Duy/LeLa-Backend.git
cd LeLa-Backend
Configure database

Update the database configuration in:

src/main/resources/application.yml
Run the application
./mvnw spring-boot:run

On Windows:

mvnw.cmd spring-boot:run
Testing

Run the test suite with:

./mvnw test

On Windows:

mvnw.cmd test
