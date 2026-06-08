async function testBackend() {
  const loginUrl = 'http://localhost:5000/api/auth/login';
  const studentsUrl = 'http://localhost:5000/api/admin/god-mode/students';

  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'mohammed', password: '708090' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nFetching God Mode Students...');
    const studentsRes = await fetch(studentsUrl, { headers });
    const studentsData = await studentsRes.json();
    console.log('Students Response Data:', studentsData);

  } catch (err) {
    console.error('ERROR OCCURRED DURING TEST:', err.message);
  }
}

testBackend();
