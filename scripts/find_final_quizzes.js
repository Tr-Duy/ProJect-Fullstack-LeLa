(async () => {
  const base = 'http://localhost:8080/api/v1';
  const testUser = process.env.TEST_USERNAME || process.env.TEST_USER;
  const testPass = process.env.TEST_PASSWORD || process.env.PLAYWRIGHT_PASSWORD;
  if (!testUser || !testPass) {
    console.error('Missing required environment variable: TEST_USERNAME (or TEST_USER) and TEST_PASSWORD (or PLAYWRIGHT_PASSWORD)');
    process.exit(1);
  }

  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: testUser, password: testPass })
  });
  const login = await loginRes.json();
  const token = login?.data?.accessToken || login?.data?.token || null;
  if (!token) {
    console.error('No token returned');
    process.exit(1);
  }

  for (const levelId of [1,2,3,4]) {
    const url = `${base}/quizzes/search?category=FINAL&levelId=${levelId}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    console.log('LEVEL', levelId, 'STATUS', res.status);
    console.log(JSON.stringify(body, null, 2));
  }
})();
