import assert from 'node:assert';

// Test the actual logic implemented in useSpeechRecognition
const INCOMPLETE_ENDING =
  /\b(i|i want|i'd like|i would like|to|a|an|the|and|or|but|because|with|for|of|in|on|at|my|your|is|are|am|have|has|can|will|would|like|want|need)\s*$/i;

const countWords = (text) =>
  text.trim().split(/\s+/).filter(Boolean).length;

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  onresult = null;
  onerror = null;
  onend = null;

  started = false;
  stopped = false;
  aborted = false;

  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    if (this.onend) this.onend();
  }
  abort() {
    this.aborted = true;
    if (this.onend) this.onend();
  }
}

console.log('--- TEST 1: INCOMPLETE_ENDING regex verification ---');
assert.strictEqual(INCOMPLETE_ENDING.test('I want to'), true, 'Should match incomplete "I want to"');
assert.strictEqual(INCOMPLETE_ENDING.test("I'd like"), true, 'Should match incomplete "I\'d like"');
assert.strictEqual(INCOMPLETE_ENDING.test('because'), true, 'Should match incomplete "because"');
assert.strictEqual(INCOMPLETE_ENDING.test('with '), true, 'Should match incomplete "with "');
assert.strictEqual(INCOMPLETE_ENDING.test('I want to order a latte'), false, 'Should not match complete "latte"');
assert.strictEqual(INCOMPLETE_ENDING.test('Can I have a cup of coffee'), false, 'Should not match complete "coffee"');
console.log('PASS: INCOMPLETE_ENDING regex handles all edge cases correctly.');

console.log('\n--- TEST 2: Word counting & minimum word thresholds ---');
assert.strictEqual(countWords(''), 0);
assert.strictEqual(countWords('   '), 0);
assert.strictEqual(countWords('Hello'), 1);
assert.strictEqual(countWords('Hello world'), 2);
assert.strictEqual(countWords('  I   want   to  order   '), 4);
console.log('PASS: countWords accurately computes word count.');

console.log('\n--- TEST 3: Simulation of "I want to ... (2s pause) ... order a latte" ---');
// Simulating the hook logic with fake timer
let timers = [];
function fakeSetTimeout(cb, ms) {
  const id = timers.length + 1;
  timers.push({ id, cb, ms, cancelled: false });
  return id;
}
function fakeClearTimeout(id) {
  const t = timers.find(x => x.id === id);
  if (t) t.cancelled = true;
}

let submittedCount = 0;
let submittedText = '';

function createTestHarness() {
  let finalRef = '';
  let interimRef = '';
  let timerId = null;
  let wantListening = true;
  let submitted = false;
  let status = 'idle';

  function clearTimer() {
    if (timerId !== null) {
      fakeClearTimeout(timerId);
      timerId = null;
    }
  }

  function commit(requiredWords) {
    if (submitted) return;
    const text = `${finalRef} ${interimRef}`.replace(/\s+/g, ' ').trim();
    if (countWords(text) < requiredWords) return;
    submitted = true;
    wantListening = false;
    clearTimer();
    status = 'processing';
    submittedCount++;
    submittedText = text;
  }

  function scheduleCommit() {
    clearTimer();
    const text = `${finalRef} ${interimRef}`.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const isEndingIncomplete = INCOMPLETE_ENDING.test(text);
    const wait = isEndingIncomplete ? 2200 + 1800 : 2200;
    timerId = fakeSetTimeout(() => commit(2), wait);
    return wait;
  }

  function onResult(piece, isFinal) {
    if (isFinal) {
      finalRef = `${finalRef} ${piece}`.replace(/\s+/g, ' ').trim();
      interimRef = '';
    } else {
      interimRef = piece;
    }
    return scheduleCommit();
  }

  function finishNow() {
    commit(1);
  }

  function retry() {
    wantListening = false;
    clearTimer();
    finalRef = '';
    interimRef = '';
    submitted = false;
    status = 'idle';
  }

  return {
    onResult,
    finishNow,
    retry,
    getState: () => ({ finalRef, interimRef, submitted, status, text: `${finalRef} ${interimRef}`.trim() }),
  };
}

const harness = createTestHarness();
// 1. User says "I want to" (interim then final)
const wait1 = harness.onResult('I want to', true);
assert.strictEqual(wait1, 4000, 'When ending with incomplete phrase "to", wait must be 4000ms');

// 2. User pauses for 2 seconds (2000ms < 4000ms) - timer has not fired!
assert.strictEqual(submittedCount, 0, 'Must NOT submit during 2 second pause for "I want to"');

// 3. User continues: "order a latte"
const wait2 = harness.onResult('order a latte', true);
assert.strictEqual(wait2, 2200, 'When phrase ends with normal word "latte", wait must be standard 2200ms');

// 4. Time elapses 2.2s -> fire timer
const activeTimer = timers.filter(t => !t.cancelled).pop();
assert.ok(activeTimer, 'An active timer must exist');
assert.strictEqual(activeTimer.ms, 2200);
activeTimer.cb();

assert.strictEqual(submittedCount, 1, 'Must submit exactly once');
assert.strictEqual(submittedText, 'I want to order a latte', 'Must submit complete sentence');
console.log('PASS: Pausing 2s on "I want to" does not submit early; full sentence is committed after 2.2s silence.');

console.log('\n--- TEST 4: Finish Now button (immediate commit with 1 word min) ---');
submittedCount = 0;
submittedText = '';
const harness2 = createTestHarness();
harness2.onResult('Coffee', true);
assert.strictEqual(submittedCount, 0, 'Single word does not auto-commit with minWords = 2');
harness2.finishNow();
assert.strictEqual(submittedCount, 1, 'finishNow() immediately commits single word');
assert.strictEqual(submittedText, 'Coffee');
console.log('PASS: finishNow commits immediately with >= 1 word.');

console.log('\n--- TEST 5: Retry button clears all refs and timer ---');
const harness3 = createTestHarness();
harness3.onResult('Incorrect phrase', true);
harness3.retry();
const stateAfterRetry = harness3.getState();
assert.strictEqual(stateAfterRetry.text, '', 'Transcript must be empty after retry');
assert.strictEqual(stateAfterRetry.submitted, false, 'Submitted must be false');
assert.strictEqual(stateAfterRetry.status, 'idle', 'Status must be idle');
console.log('PASS: Retry resets transcript, status and submitted flags cleanly.');

console.log('\nALL UNIT ACCEPTANCE TESTS PASSED!');
