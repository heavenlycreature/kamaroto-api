const axios = require('axios');

const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  headers: {
    // penting: identitas + kontak yang valid
    'User-Agent': 'KamarOTO/1.0 (contact: support@kamaroto.example)',
    'Referer': 'https://company.kamaroto.example',
  },
  timeout: 12_000,
});

// throttle sangat sederhana (≤ 1 rps)
let lastCall = 0;
async function throttle1rps() {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastCall));
  if (wait) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
}

async function getWithRetry(url, params, tries = 3) {
  for (let i = 0; i < tries; i++) {
    await throttle1rps();
    try {
      return await nominatim.get(url, { params });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 429 || status === 503) { // rate limit / busy
        const backoff = 1000 * (i + 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      if (status === 403) {
        // biasanya UA/Referer salah sesuai kebijakan
        throw new Error(`Nominatim 403 (periksa User-Agent/Referer).`);
      }
      throw e;
    }
  }
  throw new Error('Nominatim: retry habis.');
}

module.exports = { getWithRetry };
