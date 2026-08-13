package com.lela.userroleassignment;

import com.lela.userroleassignment.domain.UserRoleAssignment;
import com.lela.userroleassignment.dto.UserRoleAssignmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, UserRoleAssignmentId> {
    @Query("SELECT u FROM UserRoleAssignment u WHERE u.id.userId = :userId")
    List<UserRoleAssignment> findByUserId(@Param("userId") Long userId);
}
