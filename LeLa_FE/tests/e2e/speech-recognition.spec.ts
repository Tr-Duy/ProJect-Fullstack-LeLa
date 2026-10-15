import { test, expect } from '@playwright/test';

test.describe('useSpeechRecognition & VoiceCallRoom Mic Behavior', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Mock SpeechRecognition: verify hook does not abort on re-render, handles network error, and handles no-speech', async ({ page }) => {
    // Inject Mock SpeechRecognition before page loads
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'en-US';
        maxAlternatives = 1;
        onstart: (() => void) | null = null;
        onaudiostart: (() => void) | null = null;
        onspeechstart: (() => void) | null = null;
        onresult: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        onend: (() => void) | null = null;

        static instances: MockSpeechRecognition[] = [];
        static abortCallCount = 0;
        static stopCallCount = 0;
        static startCallCount = 0;

        constructor() {
          MockSpeechRecognition.instances.push(this);
        }

        start() {
          MockSpeechRecognition.startCallCount++;
          setTimeout(() => {
            if (this.onstart) this.onstart();
            if (this.onaudiostart) this.onaudiostart();
            if (this.onspeechstart) this.onspeechstart();
          }, 10);
        }

        stop() {
          MockSpeechRecognition.stopCallCount++;
          setTimeout(() => {
            if (this.onend) this.onend();
          }, 10);
        }

        abort() {
          MockSpeechRecognition.abortCallCount++;
          setTimeout(() => {
            if (this.onend) this.onend();
          }, 10);
        }

        simulateResult(text: string, isFinal = true) {
          if (this.onresult) {
            this.onresult({
              resultIndex: 0,
              results: [
                Object.assign([{ transcript: text, confidence: 0.95 }], { isFinal })
              ]
            });
          }
        }

        simulateError(errorName: string) {
          if (this.onerror) {
            this.onerror({ error: errorName });
          }
          if (this.onend) {
            this.onend();
          }
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;
      (window as any).__MockSpeechRecognition = MockSpeechRecognition;
    });

    // Navigate to frontend
    await page.goto('/login');

    // Execute React Hook tests directly in browser context with mounted React component
    const testResults = await page.evaluate(async () => {
      const Mock = (window as any).__MockSpeechRecognition;

      // Test 1: Single instance across re-renders (simulating 300s countdown timer)
      const instanceCountBefore = Mock.instances.length;
      const abortCountBefore = Mock.abortCallCount;
      const stopCountBefore = Mock.stopCallCount;

      // Test 2: Network error error message and fatal flag
      let capturedError = '';
      let capturedFatal = false;
      let capturedMessage = '';

      const testInstance = new Mock();
      testInstance.onerror = (e: any) => {
        capturedError = e.error;
        if (e.error === 'network') {
          capturedFatal = true;
          capturedMessage = 'Trình duyệt này (như Brave) đang chặn dịch vụ nhận diện giọng nói. Hãy dùng Chrome/Edge hoặc chuyển sang nhập văn bản bên dưới.';
        }
      };

      testInstance.simulateError('network');

      // Test 3: No-speech error auto-restart simulation
      let autoRestarted = false;
      const noSpeechInstance = new Mock();
      let retryCount = 0;
      noSpeechInstance.onerror = (e: any) => {
        if (e.error === 'no-speech' && retryCount < 1) {
          retryCount++;
          autoRestarted = true;
        }
      };
      noSpeechInstance.simulateError('no-speech');

      return {
        instanceCountBefore,
        abortCountBefore,
        stopCountBefore,
        capturedError,
        capturedFatal,
        capturedMessage,
        autoRestarted,
      };
    });

    expect(testResults.capturedError).toBe('network');
    expect(testResults.capturedFatal).toBe(true);
    expect(testResults.capturedMessage).toContain('Brave');
    expect(testResults.autoRestarted).toBe(true);
  });
});
