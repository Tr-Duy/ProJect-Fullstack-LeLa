(async () => {
  const base = 'http://localhost:8080/api/v1';
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'zxc', password: '123456' })
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