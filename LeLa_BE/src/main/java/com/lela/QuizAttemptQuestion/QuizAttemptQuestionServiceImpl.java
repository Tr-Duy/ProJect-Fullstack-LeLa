package com.lela.QuizAttemptQuestion;

import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizQuestion.QuizQuestionRepository;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionRequest;
import com.lela.QuizAttemptQuestion.dto.QuizAttemptQuestionResponse;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.common.exception.NotFoundExeception;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizAttemptQuestionServiceImpl implements QuizAttemptQuestionService {

    private final QuizAttemptQuestionRepository repository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ModelMapper mapper;

    @Override
    public Page<QuizAttemptQuestionResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(q -> mapper.map(q, QuizAttemptQuestionResponse.class));
    }

    @Override
    public QuizAttemptQuestionResponse findById(Long id) {
        return repository.findById(id)
                .map(e -> mapper.map(e, QuizAttemptQuestionResponse.class))
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + id));
    }

    @Transactional
    @Override
    public QuizAttemptQuestionResponse create(QuizAttemptQuestionRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + request.getAttemptId()));
        QuizAttemptQuestion entity = mapper.map(request, QuizAttemptQuestion.class);
        entity.setAttempt(attempt);
        if (request.getSourceQuestionId() != null) {
            QuizQuestion sourceQuestion = quizQuestionRepository.findById(request.getSourceQuestionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + request.getSourceQuestionId()));
            entity.setSourceQuestion(sourceQuestion);
        }
        return mapper.map(repository.save(entity), QuizAttemptQuestionResponse.class);
    }

    @Transactional
    @Override
    public QuizAttemptQuestionResponse update(Long id, QuizAttemptQuestionRequest request) {
        QuizAttemptQuestion existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + id));
        QuizAttempt attempt = quizAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + request.getAttemptId()));
        mapper.map(request, existing);
        existing.setAttempt(attempt);
        if (request.getSourceQuestionId() != null) {
            QuizQuestion sourceQuestion = quizQuestionRepository.findById(request.getSourceQuestionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + request.getSourceQuestionId()));
            existing.setSourceQuestion(sourceQuestion);
        }
        return mapper.map(repository.save(existing), QuizAttemptQuestionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundExeception("QuizAttemptQuestion not found: " + id);
        }
        repository.deleteById(id);
    }
}
