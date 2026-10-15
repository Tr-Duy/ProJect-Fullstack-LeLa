package com.lela.voice.repository;

import com.lela.voice.domain.FoundationWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface FoundationWordRepository extends JpaRepository<FoundationWord, Long> {

    @Query("SELECT LOWER(f.word) FROM FoundationWord f")
    Set<String> findAllWordsLower();

    @Query("SELECT LOWER(f.lemma) FROM FoundationWord f")
    Set<String> findAllLemmasLower();
}
