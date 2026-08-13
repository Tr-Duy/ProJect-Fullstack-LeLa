(async () => {
  const base = 'http://localhost:8080/api/v1';
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'zxc', password: '123456' })
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
