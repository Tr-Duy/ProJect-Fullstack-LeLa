package com.lela.common;

import com.lela.common.domain.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, Long> {
    java.util.Optional<ExamType> findByCode(String code);
}
