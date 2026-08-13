const base = 'http://localhost:8080/api/v1';

async function main() {
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'zxc', password: '123456' }),
  });
  const loginBody = await loginRes.json();
  console.log('LOGIN_STATUS', loginRes.status);
  console.log('LOGIN_BODY', JSON.stringify(loginBody, null, 2));

  const token = loginBody?.data?.accessToken;
  if (!token) {
    console.error('No accessToken returned; aborting');
    process.exit(1);
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  const profileRes = await fetch(`${base}/auth/profile`, { headers: authHeader });
  const profileBody = await profileRes.json();
  console.log('PROFILE_STATUS', profileRes.status);
  console.log('PROFILE_BODY', JSON.stringify(profileBody, null, 2));

  const finalUrl = `${base}/quizzes/search?category=FINAL`;
  const finalRes = await fetch(finalUrl, { headers: authHeader });
  const finalBody = await finalRes.json();
  console.log('FINAL_REQUEST_URL', finalUrl);
  console.log('FINAL_STATUS', finalRes.status);
  console.log('FINAL_BODY', JSON.stringify(finalBody, null, 2));

  const dailyGetUrl = `${base}/users/me/daily-goal`;
  const dailyGetRes = await fetch(dailyGetUrl, { headers: authHeader });
  const dailyGetBody = await dailyGetRes.json();
  console.log('DAILY_GET_URL', dailyGetUrl);
  console.log('DAILY_GET_STATUS', dailyGetRes.status);
  console.log('DAILY_GET_BODY', JSON.stringify(dailyGetBody, null, 2));

  const dailyPostRes = await fetch(dailyGetUrl, {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetCards: 5 }),
  });
  const dailyPostBody = await dailyPostRes.json();
  console.log('DAILY_POST_STATUS', dailyPostRes.status);
  console.log('DAILY_POST_BODY', JSON.stringify(dailyPostBody, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});