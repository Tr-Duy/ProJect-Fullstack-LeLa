package com.lela.common;

import com.lela.common.domain.ProficiencyLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProficiencyLevelRepository extends JpaRepository<ProficiencyLevel, Long> {
    List<ProficiencyLevel> findByExamTypeIdOrderByDisplayOrderAsc(Long examTypeId);
}
