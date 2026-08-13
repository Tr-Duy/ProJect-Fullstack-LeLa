package com.lela.QuizQuestion;

import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.QuizQuestion.dto.QuizQuestionRequest;
import com.lela.QuizQuestion.dto.QuizQuestionResponse;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.common.exception.NotFoundExeception;
import com.lela.flashcard.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizQuestionServiceImpl implements QuizQuestionService {

    private final QuizQuestionRepository repository;
    private final QuizRepository quizRepository;
    private final FlashcardRepository flashcardRepository;
    private final ModelMapper mapper;

    @Override
    public Page<QuizQuestionResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(e -> mapper.map(e, QuizQuestionResponse.class));
    }

    @Override
    public QuizQuestionResponse findById(Long id) {
        return repository.findById(id)
                .map(e -> mapper.map(e, QuizQuestionResponse.class))
                .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + id));
    }

    @Transactional
    @Override
    public QuizQuestionResponse create(QuizQuestionRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + request.getQuizId()));
        QuizQuestion entity = mapper.map(request, QuizQuestion.class);
        entity.setQuiz(quiz);
        if (request.getSourceCardId() != null) {
            entity.setSourceCard(flashcardRepository.findById(request.getSourceCardId())
                    .orElseThrow(() -> new NotFoundExeception("Flashcard not found: " + request.getSourceCardId())));
        }
        if (entity.getOptions() != null) {
            entity.getOptions().forEach(opt -> opt.setQuestion(entity));
        }
        return mapper.map(repository.save(entity), QuizQuestionResponse.class);
    }

    @Transactional
    @Override
    public QuizQuestionResponse update(Long id, QuizQuestionRequest request) {
        QuizQuestion existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + id));
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new NotFoundExeception("Quiz not found: " + request.getQuizId()));
        List<QuizQuestionOptionRequest> incomingOptions = request.getOptions();
        
        // Remove options not in incoming
        if (existing.getOptions() != null) {
            if (incomingOptions == null || incomingOptions.isEmpty()) {
                existing.getOptions().clear();
            } else {
                existing.getOptions().removeIf(opt -> opt.getId() != null && incomingOptions.stream()
                        .filter(inc -> inc.getId() != null)
                        .noneMatch(inc -> inc.getId().equals(opt.getId())));
            }
        }
        
        // Map scalar fields manually to avoid ModelMapper side effects on ID and relationships
        existing.setQuestionText(request.getQuestionText());
        existing.setQuestionImageUrl(request.getQuestionImageUrl());
        existing.setQuestionType(request.getQuestionType());
        existing.setExplanation(request.getExplanation());
        existing.setPoints(request.getPoints());
        existing.setQuestionTimeLimitSeconds(request.getQuestionTimeLimitSeconds());
        existing.setDisplayOrder(request.getDisplayOrder());
        existing.setIsActive(request.getIsActive());
        
        if (request.getVersion() != null) {
            existing.setVersion(request.getVersion());
        }
        
        // Now update/add options
        if (incomingOptions != null) {
            Map<Long, QuizQuestionOption> existingById = new LinkedHashMap<>();
            for (QuizQuestionOption option : existing.getOptions()) {
                if (option.getId() != null) {
                    existingById.put(option.getId(), option);
                }
            }

            for (QuizQuestionOptionRequest inc : incomingOptions) {
                QuizQuestionOption match = inc.getId() != null ? existingById.get(inc.getId()) : null;
                if (match != null) {
                    match.setOptionText(inc.getOptionText());
                    match.setOptionKey(inc.getOptionKey());
                    match.setNormalizedText(inc.getNormalizedText());
                    match.setIsCorrect(inc.getIsCorrect());
                    match.setDisplayOrder(inc.getDisplayOrder());
                    match.setQuestion(existing);
                } else {
                    if (inc.getId() != null) {
                        throw new NotFoundExeception("QuizQuestionOption not found: " + inc.getId());
                    }
                    QuizQuestionOption newOpt = new QuizQuestionOption();
                    newOpt.setOptionKey(inc.getOptionKey());
                    newOpt.setOptionText(inc.getOptionText());
                    newOpt.setNormalizedText(inc.getNormalizedText());
                    newOpt.setIsCorrect(inc.getIsCorrect());
                    newOpt.setDisplayOrder(inc.getDisplayOrder());
                    newOpt.setQuestion(existing);
                    existing.getOptions().add(newOpt);
                }
            }
        }
        if (existing.getOptions() != null) {
            existing.getOptions().forEach(opt -> opt.setQuestion(existing));
        }
        existing.setQuiz(quiz);
        if (request.getSourceCardId() != null) {
            existing.setSourceCard(flashcardRepository.findById(request.getSourceCardId())
                    .orElseThrow(() -> new NotFoundExeception("Flashcard not found: " + request.getSourceCardId())));
        }
        return mapper.map(repository.saveAndFlush(existing), QuizQuestionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundExeception("QuizQuestion not found: " + id);
        }
        repository.deleteById(id);
    }
}
