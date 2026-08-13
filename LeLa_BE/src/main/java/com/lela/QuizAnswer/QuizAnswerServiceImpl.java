package com.lela.QuizAnswer;

import com.lela.QuizAnswer.domain.QuizAnswer;
import com.lela.QuizAnswer.dto.QuizAnswerRequest;
import com.lela.QuizAnswer.dto.QuizAnswerResponse;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
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
public class QuizAnswerServiceImpl implements QuizAnswerService {

    private final QuizAnswerRepository quizAnswerRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptQuestionRepository quizAttemptQuestionRepository;
    private final QuizAttemptOptionRepository quizAttemptOptionRepository;
    private final ModelMapper mapper;

    @Override
    public Page<QuizAnswerResponse> findAll(Pageable pageable) {
        return quizAnswerRepository.findAll(pageable)
                .map(q -> mapper.map(q, QuizAnswerResponse.class));
    }

    @Override
    public QuizAnswerResponse findById(Long id) {
        return quizAnswerRepository.findById(id)
                .map(q -> mapper.map(q, QuizAnswerResponse.class))
                .orElseThrow(() -> new NotFoundExeception("QuizAnswer not found: " + id));
    }

    @Transactional
    @Override
    public QuizAnswerResponse create(QuizAnswerRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + request.getAttemptId()));
        QuizAttemptQuestion attemptQuestion = quizAttemptQuestionRepository.findById(request.getAttemptQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + request.getAttemptQuestionId()));

        QuizAnswer entity = mapper.map(request, QuizAnswer.class);
        entity.setAttempt(attempt);
        entity.setAttemptQuestion(attemptQuestion);

        if (request.getSelectedAttemptOptionId() != null) {
            QuizAttemptOption option = quizAttemptOptionRepository.findById(request.getSelectedAttemptOptionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizAttemptOption not found: " + request.getSelectedAttemptOptionId()));
            entity.setSelectedAttemptOption(option);
        }
        return mapper.map(quizAnswerRepository.save(entity), QuizAnswerResponse.class);
    }

    @Transactional
    @Override
    public QuizAnswerResponse update(Long id, QuizAnswerRequest request) {
        QuizAnswer existing = quizAnswerRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizAnswer not found: " + id));
        QuizAttempt attempt = quizAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttempt not found: " + request.getAttemptId()));
        QuizAttemptQuestion attemptQuestion = quizAttemptQuestionRepository.findById(request.getAttemptQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizAttemptQuestion not found: " + request.getAttemptQuestionId()));

        mapper.map(request, existing);
        existing.setAttempt(attempt);
        existing.setAttemptQuestion(attemptQuestion);

        if (request.getSelectedAttemptOptionId() != null) {
            QuizAttemptOption option = quizAttemptOptionRepository.findById(request.getSelectedAttemptOptionId())
                    .orElseThrow(() -> new NotFoundExeception("QuizAttemptOption not found: " + request.getSelectedAttemptOptionId()));
            existing.setSelectedAttemptOption(option);
        }
        return mapper.map(quizAnswerRepository.save(existing), QuizAnswerResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!quizAnswerRepository.existsById(id)) {
            throw new NotFoundExeception("QuizAnswer not found: " + id);
        }
        quizAnswerRepository.deleteById(id);
    }
}
