const https = require('https');

https.get('https://ip-ranges.amazonaws.com/ip-ranges.json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`Loaded ${json.ipv6_prefixes.length} IPv6 prefixes from AWS.`);
      for (const prefix of json.ipv6_prefixes) {
        if (prefix.ipv6_prefix.toLowerCase().startsWith('2406:da1c')) {
          console.log(`Prefix: ${prefix.ipv6_prefix} -> Region: ${prefix.region} (${prefix.service})`);
        }
      }
    } catch (e) {
      console.error('Failed to parse AWS IP ranges:', e);
    }
  });
}).on('error', (e) => {
  console.error('Request failed:', e);
});
