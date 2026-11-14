package com.lela.Quiz.timed;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.Quiz.QuizRepository;
import com.lela.Quiz.domain.Quiz;
import com.lela.QuizAttempt.QuizAttemptRepository;
import com.lela.QuizAttempt.domain.QuizAttempt;
import com.lela.QuizAttemptQuestion.QuizAttemptQuestionRepository;
import com.lela.QuizAttemptQuestion.domain.QuizAttemptQuestion;
import com.lela.QuizAttemptOption.QuizAttemptOptionRepository;
import com.lela.QuizAttemptOption.domain.QuizAttemptOption;
import com.lela.QuizQuestion.domain.QuestionType;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class TimedQuizEngine {
    private final TimedQuizProperties config;
    private final VocabularyRepository vocabulary;
    private final VocabularyGenerator generator;
    private final QuizRepository quizzes;
    private final QuizAttemptRepository attempts;
    private final QuizAttemptQuestionRepository questions;
    private final QuizAttemptOptionRepository options;
    private final UsersRepository users;
    private final TimedQuizStateRepository states;
    private final ObjectMapper json;

    @Data public static class Cell {
        private String id;
        private String text;
        public Cell() {}
        public Cell(String id, String text) { this.id = id; this.text = text; }
    }
    @Data public static class Screen {
        private Long questionId;
        private String type;
        private String prompt;
        private List<Cell> left = new ArrayList<>();
        private List<Cell> right = new ArrayList<>();
        private Map<String,String> solution = new LinkedHashMap<>();
        private Set<String> matched = new HashSet<>();
        private int errors;
        private int seconds;
        private long deadline;
        private Long pausedAt;
        private boolean done;
        private boolean timedOut;
        private String selected;
        private BigDecimal score = BigDecimal.ZERO;
    }
    @Data public static class Session {
        private boolean participated;
        private List<Screen> screens = new ArrayList<>();
        private int index;
        private boolean closed;
        private int toleranceSeconds;
        private BigDecimal pairPoints;
        private BigDecimal errorPenalty;
        private Map<String,String> receipts = new HashMap<>();
    }
    @Data public static class Event {
        private String action;
        private int index;
        private String requestId;
        private String leftId;
        private String rightId;
    }
    public record View(Long attemptId, String publicId, String title, int index, int total,
                       long serverNow, long deadline, int seconds, boolean started, boolean paused, boolean done, boolean timedOut,
                       boolean closed, String type, String prompt, List<Cell> left, List<Cell> right,
                       Set<String> matched, int errors, String selected, Map<String,String> solution,
                       BigDecimal score, Boolean lastCorrect) {}
    public record Earned(BigDecimal score, int correct, BigDecimal maxScore) {}

    public Map<String,Object> modes() {
        return Map.of("MULTIPLE_CHOICE_MEANING", config.isMultipleChoiceEnabled(), "MATCHING_PAIRS", config.isMatchingEnabled(),
                "questionSeconds", config.getQuestionSeconds(), "screenSeconds", config.getScreenSeconds(),
                "questionCount", config.getQuestionCount(), "screenCount", config.getScreenCount());
    }

    private Users currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new AccessDeniedException("Authentication required");
        return users.findByUsername(auth.getName()).orElseThrow(() -> new AccessDeniedException("Unknown user"));
    }
    private QuizAttempt owned(Long id) {
        QuizAttempt a = attempts.findById(id).orElseThrow();
        if (!Objects.equals(a.getUser().getId(), currentUser().getId())) throw new AccessDeniedException("Not your attempt");
        return a;
    }
    public static boolean isNew(QuestionType type) {
        return type == QuestionType.MULTIPLE_CHOICE_MEANING || type == QuestionType.MATCHING_PAIRS;
    }

    @Transactional
    public View start(String type) {
        boolean meaning = type.equals("MULTIPLE_CHOICE_MEANING");
        if (!(meaning || type.equals("MATCHING_PAIRS")) || (meaning ? !config.isMultipleChoiceEnabled() : !config.isMatchingEnabled()))
            throw new IllegalArgumentException("Dạng bài đang tắt hoặc không được hỗ trợ");
        if (config.getQuestionSeconds() < 1 || config.getScreenSeconds() < 1 || config.getQuestionCount() < 1
                || config.getScreenCount() < 1 || config.getToleranceSeconds() < 0 || config.getPairPoints().signum() <= 0
                || config.getErrorPenalty().signum() < 0) throw new IllegalStateException("Invalid vocabulary quiz configuration");
        Users user = currentUser();
        Long level = user.getCurrentLevel() == null ? null : user.getCurrentLevel().getId();
        List<VocabularyGenerator.Item> items = generator.generate(type, generator.clean(vocabulary.findSystemWords(config.getSystemOwner(), level)),
                meaning ? config.getQuestionCount() : config.getScreenCount());
        Quiz quiz = quizzes.findByQuizCode(meaning ? "VOCAB-MEANING-V1" : "VOCAB-MATCHING-V1").orElseThrow();
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz); attempt.setUser(user); attempt.setPublicId(UUID.randomUUID().toString());
        attempt.setStartedAt(LocalDateTime.now()); attempt.setLevelAtAttempt(user.getCurrentLevel());
        attempt.setAttemptNumber(attempts.findMaxAttemptNumber(user.getId(), quiz.getId()) + 1);
        attempt.setTotalQuestions(items.size());
        attempt = attempts.save(attempt);
        Session session = new Session();
        session.setPairPoints(config.getPairPoints()); session.setErrorPenalty(config.getErrorPenalty());
        session.setToleranceSeconds(config.getToleranceSeconds());
        int order = 0;
        for (var item : items) {
            QuizAttemptQuestion question = new QuizAttemptQuestion();
            question.setAttempt(attempt); question.setQuestionType(QuestionType.valueOf(type));
            question.setQuestionText(meaning ? item.words().getFirst().meaning() : quiz.getTitle());
            question.setPoints(meaning ? 1 : Math.max(1, config.getPairPoints().multiply(BigDecimal.valueOf(4)).intValue()));
            question.setQuestionTimeLimitSeconds(meaning ? config.getQuestionSeconds() : config.getScreenSeconds());
            question.setDisplayOrder(order++); question = questions.save(question);
            Screen screen = new Screen();
            screen.setQuestionId(question.getId()); screen.setType(type); screen.setPrompt(question.getQuestionText());
            screen.setSeconds(question.getQuestionTimeLimitSeconds());
            if (meaning) {
                for (var word : item.choices()) {
                    QuizAttemptOption option = new QuizAttemptOption();
                    option.setAttemptQuestion(question); option.setOptionText(word.english());
                    option.setIsCorrect(word.id() == item.words().getFirst().id());
                    option.setDisplayOrder(screen.getLeft().size()); option = options.save(option);
                    String key = option.getId().toString(); screen.getLeft().add(new Cell(key, word.english()));
                    if (option.getIsCorrect()) screen.getSolution().put("answer", key);
                }
            } else {
                for (var word : item.words()) {
                    String left = UUID.randomUUID().toString(), right = UUID.randomUUID().toString();
                    screen.getLeft().add(new Cell(left, word.english())); screen.getRight().add(new Cell(right, word.meaning()));
                    screen.getSolution().put(left, right);
                }
                shuffleColumns(screen);
            }
            session.getScreens().add(screen);
        }
        session.getScreens().getFirst().setDeadline(now() + session.getScreens().getFirst().getSeconds() * 1000L);
        TimedQuizState state = new TimedQuizState(); state.setAttemptId(attempt.getId());
        save(state, session);
        return view(attempt, session, null);
    }

    static long now() { return Instant.now().toEpochMilli(); }

    // Initialize only the added question types in an existing (including mixed) quiz.
    public void attach(QuizAttempt attempt, List<QuizAttemptQuestion> snapshots) {
        List<QuizAttemptQuestion> added = snapshots.stream().filter(q -> isNew(q.getQuestionType())).toList();
        if (added.isEmpty()) return;
        Users user = attempt.getUser();
        var pool = generator.clean(vocabulary.findSystemWords(config.getSystemOwner(),
                user.getCurrentLevel() == null ? null : user.getCurrentLevel().getId()));
        Session session = new Session();
        session.setPairPoints(config.getPairPoints()); session.setErrorPenalty(config.getErrorPenalty());
        session.setToleranceSeconds(config.getToleranceSeconds());
        Map<String,Iterator<VocabularyGenerator.Item>> generated = new HashMap<>();
        for (var type : List.of(QuestionType.MULTIPLE_CHOICE_MEANING, QuestionType.MATCHING_PAIRS)) {
            int count = (int) added.stream().filter(q -> q.getQuestionType() == type).count();
            if (count == 0) continue;
            if (type == QuestionType.MULTIPLE_CHOICE_MEANING ? !config.isMultipleChoiceEnabled() : !config.isMatchingEnabled())
                throw new IllegalStateException("Dạng bài đang tắt");
            var items = generator.generate(type.name(), pool, count);
            if (items.size() != count) throw new IllegalStateException("Kho từ không đủ cho bài trộn");
            generated.put(type.name(), items.iterator());
        }
        for (var question : added) {
            var item = generated.get(question.getQuestionType().name()).next();
            boolean meaning = question.getQuestionType() == QuestionType.MULTIPLE_CHOICE_MEANING;
            question.setQuestionText(meaning ? item.words().getFirst().meaning() : "Ghép cặp từ - Định nghĩa");
            question.setPoints(meaning ? 1 : Math.max(1, config.getPairPoints().multiply(BigDecimal.valueOf(4)).intValue()));
            question.setQuestionTimeLimitSeconds(meaning ? config.getQuestionSeconds() : config.getScreenSeconds());
            questions.save(question);
            Screen screen = new Screen(); screen.setQuestionId(question.getId());
            screen.setType(item.type()); screen.setPrompt(question.getQuestionText()); screen.setSeconds(question.getQuestionTimeLimitSeconds());
            if (meaning) {
                for (var word : item.choices()) {
                    QuizAttemptOption option = new QuizAttemptOption(); option.setAttemptQuestion(question);
                    option.setOptionText(word.english()); option.setIsCorrect(word.id() == item.words().getFirst().id());
                    option.setDisplayOrder(screen.getLeft().size()); option = options.save(option);
                    String key = option.getId().toString(); screen.getLeft().add(new Cell(key, word.english()));
                    if (option.getIsCorrect()) screen.getSolution().put("answer", key);
                }
            } else {
                for (var word : item.words()) {
                    String left = UUID.randomUUID().toString(), right = UUID.randomUUID().toString();
                    screen.getLeft().add(new Cell(left, word.english())); screen.getRight().add(new Cell(right, word.meaning()));
                    screen.getSolution().put(left, right);
                }
                shuffleColumns(screen);
            }
            session.getScreens().add(screen);
        }
        TimedQuizState state = new TimedQuizState(); state.setAttemptId(attempt.getId()); save(state, session);
    }

    public View snapshot(QuizAttempt attempt) {
        return states.findById(attempt.getId()).map(s -> view(attempt, read(s), null)).orElse(null);
    }

    public List<Screen> review(QuizAttempt attempt) {
        if (attempt.getSubmittedAt() == null) return List.of();
        return states.findById(attempt.getId()).map(s -> read(s).getScreens()).orElse(List.of());
    }
    public boolean participated(Long id) {
        return states.findById(id).map(s -> read(s).isParticipated()).orElse(false);
    }
    Session read(TimedQuizState state) {
        try { return json.readValue(state.getPayload(), Session.class); }
        catch (Exception ex) { throw new IllegalStateException("Invalid timed quiz snapshot", ex); }
    }
    void save(TimedQuizState state, Session session) {
        try { state.setPayload(json.writeValueAsString(session)); states.save(state); }
        catch (Exception ex) { throw new IllegalStateException("Cannot persist timed quiz", ex); }
    }
    static boolean late(Screen screen, long time, int toleranceSeconds) {
        return screen.getDeadline() > 0 && screen.getPausedAt() == null && time > screen.getDeadline() + toleranceSeconds * 1000L;
    }
    static boolean fullyAligned(Screen screen) {
        if (screen.getLeft().size() != screen.getRight().size() || screen.getLeft().isEmpty()) return false;
        for (int i = 0; i < screen.getLeft().size(); i++)
            if (!Objects.equals(screen.getSolution().get(screen.getLeft().get(i).getId()), screen.getRight().get(i).getId())) return false;
        return true;
    }
    static void avoidAlignedColumns(Screen screen) {
        if (!fullyAligned(screen)) return;
        Collections.shuffle(screen.getRight());
        if (fullyAligned(screen)) Collections.rotate(screen.getRight(), 1);
    }
    static void shuffleColumns(Screen screen) {
        Collections.shuffle(screen.getLeft()); Collections.shuffle(screen.getRight());
        avoidAlignedColumns(screen);
    }
    static BigDecimal matchingScore(int correct, int errors, BigDecimal points, BigDecimal penalty) {
        return points.multiply(BigDecimal.valueOf(correct)).subtract(penalty.multiply(BigDecimal.valueOf(errors))).max(BigDecimal.ZERO);
    }
    static void complete(Screen screen, Session session, boolean timeout) {
        screen.setDone(true); screen.setTimedOut(timeout); screen.setPausedAt(null);
        screen.setScore(screen.getType().equals("MATCHING_PAIRS")
                ? matchingScore(screen.getMatched().size(), screen.getErrors(), session.getPairPoints(), session.getErrorPenalty())
                : Objects.equals(screen.getSelected(), screen.getSolution().get("answer")) ? BigDecimal.ONE : BigDecimal.ZERO);
    }

    @Transactional
    public View event(Long id, Event event) {
        TimedQuizState state = states.lockByAttemptId(id).orElseThrow();
        QuizAttempt attempt = owned(id);
        Session session = read(state);
        if (event.getRequestId() == null || event.getRequestId().isBlank() || event.getRequestId().length() > 100)
            throw new IllegalArgumentException("requestId required");
        String fingerprint;
        try { fingerprint = json.writeValueAsString(event); } catch (Exception ex) { throw new IllegalArgumentException(ex); }
        String receipt = session.getReceipts().get(event.getRequestId());
        if (receipt != null) {
            if (!receipt.equals(fingerprint)) throw new IllegalArgumentException("requestId reused with different payload");
            return view(attempt, session, null);
        }
        if (session.isClosed()) return view(attempt, session, null);
        if (session.getIndex() != event.getIndex()) throw new IllegalArgumentException("Stale screen index");
        Screen screen = session.getScreens().get(session.getIndex());
        long time = now();
        Boolean correct = null;
        if (!screen.isDone() && late(screen, time, session.getToleranceSeconds())) {
            session.setParticipated(true); complete(screen, session, true);
        }
        switch (event.getAction()) {
            case "BEGIN" -> { if (screen.getDeadline() == 0) screen.setDeadline(time + screen.getSeconds() * 1000L); }
            case "ANSWER" -> {
                if (!screen.isDone() && screen.getDeadline() > 0 && screen.getPausedAt() == null && screen.getType().equals("MULTIPLE_CHOICE_MEANING")) {
                    if (screen.getLeft().stream().noneMatch(c -> c.getId().equals(event.getLeftId()))) throw new IllegalArgumentException("Invalid option");
                    screen.setSelected(event.getLeftId()); complete(screen, session, false);
                    session.setParticipated(true);
                    correct = screen.getScore().signum() > 0;
                }
            }
            case "PAIR" -> {
                if (!screen.isDone() && screen.getDeadline() > 0 && screen.getPausedAt() == null && screen.getType().equals("MATCHING_PAIRS")) {
                    if (!screen.getSolution().containsKey(event.getLeftId()) || screen.getRight().stream().noneMatch(c -> c.getId().equals(event.getRightId())))
                        throw new IllegalArgumentException("Invalid pair");
                    if (screen.getMatched().contains(event.getLeftId()) || screen.getMatched().stream().anyMatch(k -> screen.getSolution().get(k).equals(event.getRightId())))
                        throw new IllegalArgumentException("Pair already locked");
                    correct = screen.getSolution().get(event.getLeftId()).equals(event.getRightId());
                    session.setParticipated(true);
                    if (correct) screen.getMatched().add(event.getLeftId()); else screen.setErrors(screen.getErrors() + 1);
                    if (screen.getMatched().size() == 4) complete(screen, session, false);
                }
            }
            case "TIMEOUT" -> { if (!screen.isDone() && screen.getDeadline() > 0 && screen.getPausedAt() == null && time >= screen.getDeadline()) { session.setParticipated(true); complete(screen, session, true); } }
            case "PAUSE" -> { if (!screen.isDone() && screen.getDeadline() > 0 && screen.getPausedAt() == null) screen.setPausedAt(time); }
            case "RESUME" -> {
                if (screen.getPausedAt() != null) { screen.setDeadline(screen.getDeadline() + time - screen.getPausedAt()); screen.setPausedAt(null); }
            }
            case "NEXT" -> {
                if (!screen.isDone()) throw new IllegalArgumentException("Screen not completed");
                if (session.getIndex() + 1 < session.getScreens().size()) {
                    session.setIndex(session.getIndex() + 1);
                    Screen next = session.getScreens().get(session.getIndex()); next.setDeadline(time + next.getSeconds() * 1000L);
                } else session.setClosed(true);
            }
            case "SYNC" -> { }
            default -> throw new IllegalArgumentException("Unsupported action");
        }
        session.getReceipts().put(event.getRequestId(), fingerprint);
        save(state, session);
        return view(attempt, session, correct);
    }

    // Called within the existing submit transaction. Locks once, freezing all credit.
    public Map<Long,Earned> finalizeForSubmit(Long id) {
        Optional<TimedQuizState> found = states.lockByAttemptId(id);
        if (found.isEmpty()) return Map.of();
        owned(id);
        Session session = read(found.get());
        // Older in-flight snapshots predate the participation flag.
        session.setParticipated(session.isParticipated() || session.getScreens().stream().anyMatch(s ->
                s.getSelected() != null || !s.getMatched().isEmpty() || s.getErrors() > 0 || (s.isDone() && s.isTimedOut() && s.getDeadline() > 0)));
        Map<Long,Earned> earned = new HashMap<>();
        for (Screen s : session.getScreens()) {
            if (!s.isDone()) {
                // Preserve confirmed matching pairs; untouched words earn nothing.
                complete(s, session, true);
            }
            earned.put(s.getQuestionId(), new Earned(s.getScore(), s.getType().equals("MATCHING_PAIRS")
                    ? s.getMatched().size() : s.getScore().intValue(), s.getType().equals("MATCHING_PAIRS")
                    ? session.getPairPoints().multiply(BigDecimal.valueOf(4)) : BigDecimal.ONE));
        }
        session.setClosed(true); save(found.get(), session);
        return earned;
    }

    private View view(QuizAttempt attempt, Session session, Boolean correct) {
        Screen s = session.getScreens().get(session.getIndex());
        boolean paused = s.getPausedAt() != null;
        Set<String> matchedCells = new HashSet<>(s.getMatched());
        s.getMatched().forEach(k -> matchedCells.add(s.getSolution().get(k)));
        return new View(attempt.getId(), attempt.getPublicId(), s.getType().equals("MATCHING_PAIRS") ? "Ghép cặp từ - Định nghĩa" : "Chọn đáp án đúng", session.getIndex(), session.getScreens().size(),
                now(), s.getDeadline(), s.getSeconds(), s.getDeadline() > 0, paused, s.isDone(), s.isTimedOut(), session.isClosed(), s.getType(), paused ? "" : s.getPrompt(),
                paused ? List.of() : s.getLeft(), paused ? List.of() : s.getRight(), matchedCells, s.getErrors(), s.getSelected(),
                !paused && s.isDone() ? s.getSolution() : Map.of(), s.getScore(), correct);
    }
}
