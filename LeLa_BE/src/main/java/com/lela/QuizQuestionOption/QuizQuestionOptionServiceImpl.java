package com.lela.QuizQuestionOption;

import com.lela.QuizQuestion.QuizQuestionRepository;
import com.lela.QuizQuestion.domain.QuizQuestion;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionRequest;
import com.lela.QuizQuestionOption.dto.QuizQuestionOptionResponse;
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
public class QuizQuestionOptionServiceImpl implements QuizQuestionOptionService {

    private final QuizQuestionOptionRepository repository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ModelMapper mapper;

    @Override
    public Page<QuizQuestionOptionResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(e -> mapper.map(e, QuizQuestionOptionResponse.class));
    }

    @Override
    public QuizQuestionOptionResponse findById(Long id) {
        return repository.findById(id)
                .map(e -> mapper.map(e, QuizQuestionOptionResponse.class))
                .orElseThrow(() -> new NotFoundExeception("QuizQuestionOption not found: " + id));
    }

    @Transactional
    @Override
    public QuizQuestionOptionResponse create(QuizQuestionOptionRequest request) {
        QuizQuestion question = quizQuestionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + request.getQuestionId()));
        QuizQuestionOption entity = mapper.map(request, QuizQuestionOption.class);
        entity.setQuestion(question);
        return mapper.map(repository.save(entity), QuizQuestionOptionResponse.class);
    }

    @Transactional
    @Override
    public QuizQuestionOptionResponse update(Long id, QuizQuestionOptionRequest request) {
        QuizQuestionOption existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("QuizQuestionOption not found: " + id));
        QuizQuestion question = quizQuestionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new NotFoundExeception("QuizQuestion not found: " + request.getQuestionId()));
        mapper.map(request, existing);
        existing.setQuestion(question);
        return mapper.map(repository.save(existing), QuizQuestionOptionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundExeception("QuizQuestionOption not found: " + id);
        }
        repository.deleteById(id);
    }
}
