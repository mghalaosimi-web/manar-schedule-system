async function testEndpoints() {
  const deptsUrl = 'http://127.0.0.1:5000/api/departments';
  const levelsUrl = 'http://127.0.0.1:5000/api/levels';
  const groupsUrl = 'http://127.0.0.1:5000/api/groups';

  try {
    console.log('Fetching departments...');
    const deptsRes = await fetch(deptsUrl);
    const deptsData = await deptsRes.json();
    console.log('Departments Response:', deptsData);

    console.log('\nFetching levels...');
    const levelsRes = await fetch(levelsUrl);
    const levelsData = await levelsRes.json();
    console.log('Levels Response:', levelsData);

    console.log('\nFetching groups...');
    const groupsRes = await fetch(groupsUrl);
    const groupsData = await groupsRes.json();
    console.log('Groups Response:', groupsData);

  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

testEndpoints();
