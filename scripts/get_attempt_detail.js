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

  const publicId = 'fc427341-7bb2-4471-8ebe-a08ee8494a2d';
  const res = await fetch(`${base}/quiz-attempts/${publicId}/detail`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  console.log('STATUS', res.status);
  console.log(JSON.stringify(body, null, 2));
})();
