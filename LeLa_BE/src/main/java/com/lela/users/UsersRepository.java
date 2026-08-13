package com.lela.users;

import com.lela.users.domain.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {
        Optional<Users> findByUsername(String username);

        Optional<Users> findByEmail(String email);

        boolean existsByUsername(String username);

        boolean existsByEmail(String email);

        @org.springframework.data.jpa.repository.Query("SELECT u.createdAt FROM Users u WHERE u.createdAt >= :startDate")
        java.util.List<java.time.LocalDateTime> findUserRegistrationDatesSince(
                        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "currentLevel" })
        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM Users u LEFT JOIN u.roleAssignments ra LEFT JOIN ra.role r "
                        +
                        "WHERE (:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))) "
                        +
                        "AND (:role IS NULL OR r.roleCode = :role)")
        org.springframework.data.domain.Page<Users> searchUsers(
                        @org.springframework.data.repository.query.Param("search") String search,
                        @org.springframework.data.repository.query.Param("role") String role,
                        org.springframework.data.domain.Pageable pageable);
}
