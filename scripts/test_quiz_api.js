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
  console.log('LOGIN_STATUS', loginRes.status);
  console.log(JSON.stringify(login, null, 2));

  const token = login?.data?.accessToken || login?.data?.token || null;
  if (!token) {
    console.error('No token returned');
    process.exit(1);
  }

  // call quizzes search for FINAL
  const url = `${base}/quizzes/search?category=FINAL`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  console.log('REQUEST_URL', url);
  console.log('STATUS', res.status);
  console.log('RESPONSE', JSON.stringify(body, null, 2));
})();
