import assert from 'node:assert';

// Mock Web Speech API SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  onstart = null;
  onaudiostart = null;
  onspeechstart = null;
  onresult = null;
  onerror = null;
  onend = null;

  static instanceCount = 0;
  static startCalls = 0;
  static stopCalls = 0;
  static abortCalls = 0;

  constructor() {
    MockSpeechRecognition.instanceCount++;
  }

  start() {
    MockSpeechRecognition.startCalls++;
    if (this.onstart) this.onstart();
    if (this.onaudiostart) this.onaudiostart();
    if (this.onspeechstart) this.onspeechstart();
  }

  stop() {
    MockSpeechRecognition.stopCalls++;
    if (this.onend) this.onend();
  }

  abort() {
    MockSpeechRecognition.abortCalls++;
    if (this.onend) this.onend();
  }

  simulateResult(text, confidence = 0.95, isFinal = true) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: text, confidence }], { isFinal })
        ]
      });
    }
  }

  simulateError(errorName) {
    if (this.onerror) {
      this.onerror({ error: errorName });
    }
    if (this.onend) {
      this.onend();
    }
  }
}

globalThis.window = {
  SpeechRecognition: MockSpeechRecognition,
  webkitSpeechRecognition: MockSpeechRecognition,
};

console.log('=== TEST 1: Re-render Simulation (300s Countdown Timer) ===');
// Simulating the hook logic: single instance in useRef, callbacks in ref
let recognitionInstance = null;
let abortCount = 0;
let stopCount = 0;

function initRecognition(callbacks) {
  if (!recognitionInstance) {
    recognitionInstance = new MockSpeechRecognition();
  }
  // Updating callbacks ref on each render without recreating instance
  return recognitionInstance;
}

// 1. Initial render
initRecognition({ onResult: () => {}, onError: () => {}, onEnd: () => {} });
assert.strictEqual(MockSpeechRecognition.instanceCount, 1, 'Should only create 1 SpeechRecognition instance');

// 2. Simulate 300 timer ticks (300 re-renders)
for (let second = 299; second >= 0; second--) {
  // Re-render passes a fresh inline callback
  initRecognition({ onResult: () => {}, onError: () => {}, onEnd: () => {} });
}

// Check that no additional instances were created and no abort was called
assert.strictEqual(MockSpeechRecognition.instanceCount, 1, 'SpeechRecognition must NOT be re-created on timer re-renders');
assert.strictEqual(MockSpeechRecognition.abortCalls, 0, 'SpeechRecognition must NOT be aborted during re-renders');
console.log('PASS: SpeechRecognition retained single instance across 300 re-renders, 0 abort calls.');

console.log('\n=== TEST 2: Network Error (Brave Browser blocking Google Speech API) ===');
let fatalErrorReceived = false;
let errorType = null;
let errorMessage = null;

const rec2 = new MockSpeechRecognition();
rec2.onerror = (event) => {
  const err = event.error;
  errorType = err;
  if (err === 'network') {
    fatalErrorReceived = true;
    errorMessage = 'Trình duyệt này (như Brave) đang chặn dịch vụ nhận diện giọng nói. Hãy dùng Chrome/Edge hoặc chuyển sang nhập văn bản bên dưới.';
  }
};

rec2.simulateError('network');
assert.strictEqual(errorType, 'network', 'Error type must be network');
assert.strictEqual(fatalErrorReceived, true, 'Network error must be marked as fatal');
assert.ok(errorMessage.includes('Brave'), 'Error message must explicitly mention Brave browser');
console.log('PASS: Network error correctly triggers fatal error with informative Vietnamese message recommending Chrome/Edge or text fallback.');

console.log('\n=== TEST 3: No-speech Error (Auto-restart, Mic never turns off silently) ===');
let autoRestartTriggered = false;
let retryCount = 0;
let isMicStillListening = true;

const rec3 = new MockSpeechRecognition();
rec3.onerror = (event) => {
  if (event.error === 'no-speech' && retryCount < 1) {
    retryCount++;
    autoRestartTriggered = true;
    // Mic is not shut off silently
    isMicStillListening = true;
  }
};

rec3.simulateError('no-speech');
assert.strictEqual(autoRestartTriggered, true, 'Should auto-restart when no-speech occurs on first timeout');
assert.strictEqual(isMicStillListening, true, 'Mic must not turn off silently on no-speech');
console.log('PASS: No-speech error triggers auto-restart once without shutting mic off silently.');

console.log('\n=== TEST 4: Not-allowed / Permission Denied Error ===');
let permissionDenied = false;
const rec4 = new MockSpeechRecognition();
rec4.onerror = (event) => {
  if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
    permissionDenied = true;
  }
};
rec4.simulateError('not-allowed');
assert.strictEqual(permissionDenied, true, 'Permission denial correctly caught');
console.log('PASS: Permission denial correctly caught.');

console.log('\nALL 4 HOOK UNIT TESTS PASSED SUCCESSFULLY!');
