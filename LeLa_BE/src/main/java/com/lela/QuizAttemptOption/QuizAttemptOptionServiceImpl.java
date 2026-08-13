package com.lela.QuizAttemptOption;

import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionRequest;
import com.lela.QuizAttemptOption.dto.QuizAttemptOptionResponse;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizQuestionOption.QuizQuestionOptionRepository;
import com.lela.QuizQuestionOption.domain.QuizQuestionOption;
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
public class QuizAttemptOptionServiceImpl implements QuizAttemptOptionService {

    private final QuizAttemptOptionRepository repository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final QuizQuestionOptionRepository quizQuestionOptionRepository;
    private final ModelMapper mapper;

    @Override
    public Page<QuizAttemptOptionResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(q -> mapper.map(q, QuizAttemptOptionResponse.class));
    }

    @Override
    public QuizAttemptOptionResponse findById(Long id) {
        return repository.findById(id)
                .map(e -> mapper.map(e, QuizAttemptOptionResponse.class))
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptOption not found: " + id));
    }

    @Transactional
    @Override
    public QuizAttemptOptionResponse create(QuizAttemptOptionRequest request) {
        QuizAttemptQuestion attemptQuestion = quizAttemptQuestionRepository.findById(request.getAttemptQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + request.getAttemptQuestionId()));
        QuizAttemptOption entity = mapper.map(request, QuizAttemptOption.class);
        entity.setAttemptQuestion(attemptQuestion);
        if (request.getSourceOptionId() != null) {
            QuizQuestionOption sourceOption = quizQuestionOptionRepository.findById(request.getSourceOptionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizQuestionOption not found: " + request.getSourceOptionId()));
            entity.setSourceOption(sourceOption);
        }
        return mapper.map(repository.save(entity), QuizAttemptOptionResponse.class);
    }

    @Transactional
    @Override
    public QuizAttemptOptionResponse update(Long id, QuizAttemptOptionRequest request) {
        QuizAttemptOption existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptOption not found: " + id));
        QuizAttemptQuestion attemptQuestion = quizAttemptQuestionRepository.findById(request.getAttemptQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + request.getAttemptQuestionId()));
        mapper.map(request, existing);
        existing.setAttemptQuestion(attemptQuestion);
        if (request.getSourceOptionId() != null) {
            QuizQuestionOption sourceOption = quizQuestionOptionRepository.findById(request.getSourceOptionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizQuestionOption not found: " + request.getSourceOptionId()));
            existing.setSourceOption(sourceOption);
        }
        return mapper.map(repository.save(existing), QuizAttemptOptionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundExeception("QuizAttemptOption not found: " + id);
        }
        repository.deleteById(id);
    }
}
