/**
 * Code execution via Judge0 CE (https://ce.judge0.com)
 * Free, no API key required, supports all 14 languages.
 *
 * Handles:
 *  - 429 Too Many Requests  → exponential backoff retry (up to 3 attempts)
 *  - wait=true timeout      → falls back to async submit + poll
 *  - Compile errors         → returns compile_output as error
 *  - Runtime errors         → returns stderr + stdout
 *  - TLE                    → clear message
 *
 * Language IDs: https://ce.judge0.com/languages/
 */

const https = require('https');

const JUDGE0_HOST = 'ce.judge0.com';

// Verified language IDs against https://ce.judge0.com/languages/
const JUDGE0_LANG_IDS = {
  c:          50,  // C (GCC 9.2.0)
  cpp:        54,  // C++ (GCC 9.2.0)
  java:       62,  // Java (OpenJDK 13.0.1)
  python:     71,  // Python (3.8.1)
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  typescript: 74,  // TypeScript (3.7.4)
  csharp:     51,  // C# (Mono 6.6.0.161)
  go:         60,  // Go (1.13.5)
  rust:       73,  // Rust (1.40.0)
  swift:      83,  // Swift (5.2.3)
  ruby:       72,  // Ruby (2.7.0)
  php:        68,  // PHP (7.4.1)
  sql:        82,  // SQL (SQLite 3.27.2)
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// ─── Netlify handler ──────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { error: 'Invalid JSON body' });
  }

  const { language, code, input = '' } = body;

  if (!language || !code) {
    return respond(400, { error: 'language and code are required' });
  }

  // Web preview is rendered client-side in an iframe
  if (language === 'web') {
    return respond(200, { output: 'Web preview ready', error: null });
  }

  const languageId = JUDGE0_LANG_IDS[language];
  if (!languageId) {
    return respond(400, { error: `Unsupported language: ${language}` });
  }

  try {
    const result = await executeWithRetry(languageId, code, input);
    return respond(200, result);
  } catch (err) {
    console.error('Execution error:', err);
    return respond(200, { output: '', error: err.message });
  }
};

function respond(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

// ─── Execution with retry ─────────────────────────────────────────────────────

/**
 * Try synchronous submission (wait=true) with up to 3 retries on 429.
 * If all sync attempts fail, fall back to async submit + poll.
 */
async function executeWithRetry(languageId, sourceCode, stdin) {
  const MAX_SYNC_ATTEMPTS = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt++) {
    try {
      const result = await submitSync(languageId, sourceCode, stdin);

      // 429 — server queue is full, back off and retry
      if (result._rateLimited) {
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.log(`Rate limited (attempt ${attempt}/${MAX_SYNC_ATTEMPTS}), retrying in ${delay}ms`);
        await sleep(delay);
        lastError = new Error('Judge0 server is busy — too many requests');
        continue;
      }

      return result;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_SYNC_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  // All sync attempts failed — try async submit + poll as last resort
  console.log('Sync attempts exhausted, falling back to async polling');
  try {
    return await executeAsync(languageId, sourceCode, stdin);
  } catch (asyncErr) {
    // Return the most useful error message
    return {
      output: '',
      error: lastError?.message || asyncErr.message || 'Execution failed — Judge0 server is busy, please try again in a moment',
    };
  }
}

// ─── Synchronous submission (wait=true) ──────────────────────────────────────

function submitSync(languageId, sourceCode, stdin) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      source_code:     Buffer.from(sourceCode).toString('base64'),
      language_id:     languageId,
      stdin:           Buffer.from(stdin || '').toString('base64'),
      cpu_time_limit:  10,
      wall_time_limit: 15,
      memory_limit:    128000,
    });

    const options = {
      hostname: JUDGE0_HOST,
      port: 443,
      path: '/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,status,time,memory',
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // 429 — rate limited / queue full
        if (res.statusCode === 429) {
          resolve({ _rateLimited: true });
          return;
        }

        // 503 / 5xx — server error, treat as rate limit for retry purposes
        if (res.statusCode >= 500) {
          resolve({ _rateLimited: true });
          return;
        }

        try {
          const result = JSON.parse(data);
          console.log(`Judge0 sync: HTTP ${res.statusCode}, status=${result.status?.id} (${result.status?.description})`);

          // Judge0 sometimes returns a top-level message for queue overflow
          if (result.message && !result.status) {
            resolve({ _rateLimited: true });
            return;
          }

          resolve(parseJudge0Result(result));
        } catch (e) {
          reject(new Error(`Response parse error: ${e.message}. Raw: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error: ${e.message}`)));

    req.setTimeout(22000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

// ─── Async submission + polling ───────────────────────────────────────────────

async function executeAsync(languageId, sourceCode, stdin) {
  const token = await submitAsync(languageId, sourceCode, stdin);
  return await pollResult(token);
}

function submitAsync(languageId, sourceCode, stdin) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      source_code:     Buffer.from(sourceCode).toString('base64'),
      language_id:     languageId,
      stdin:           Buffer.from(stdin || '').toString('base64'),
      cpu_time_limit:  10,
      wall_time_limit: 15,
      memory_limit:    128000,
    });

    const options = {
      hostname: JUDGE0_HOST,
      port: 443,
      path: '/submissions?base64_encoded=true',
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 429 || res.statusCode >= 500) {
          reject(new Error('Judge0 server is busy — please try again in a moment'));
          return;
        }
        try {
          const result = JSON.parse(data);
          if (result.token) {
            resolve(result.token);
          } else {
            reject(new Error(`Submission failed: ${JSON.stringify(result).substring(0, 100)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error: ${e.message}`)));
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Submission timed out')); });
    req.write(payload);
    req.end();
  });
}

async function pollResult(token, maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(attempt === 0 ? 1500 : 2000);

    const result = await fetchResult(token);
    const statusId = result.status?.id;

    console.log(`Poll ${attempt + 1}/${maxAttempts}: status=${statusId} (${result.status?.description})`);

    // Still in queue or processing
    if (statusId === 1 || statusId === 2) continue;

    return parseJudge0Result(result);
  }

  return { output: '', error: 'Execution timed out waiting for result — please try again' };
}

function fetchResult(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: JUDGE0_HOST,
      port: 443,
      path: `/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error: ${e.message}`)));
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Poll timed out')); });
    req.end();
  });
}

// ─── Result parser ────────────────────────────────────────────────────────────

/**
 * Judge0 status IDs:
 *   1  = In Queue
 *   2  = Processing
 *   3  = Accepted
 *   4  = Wrong Answer
 *   5  = Time Limit Exceeded
 *   6  = Compilation Error
 *   7  = Runtime Error (SIGSEGV)
 *   8  = Runtime Error (SIGXFSZ)
 *   9  = Runtime Error (SIGFPE)
 *   10 = Runtime Error (SIGABRT)
 *   11 = Runtime Error (NZEC)
 *   12 = Runtime Error (Other)
 *   13 = Internal Error
 *   14 = Exec Format Error
 */
function parseJudge0Result(result) {
  const statusId = result.status?.id;

  const decode = (b64) => {
    if (!b64) return '';
    try { return Buffer.from(b64, 'base64').toString('utf8'); } catch { return b64; }
  };

  const stdout        = decode(result.stdout);
  const stderr        = decode(result.stderr);
  const compileOutput = decode(result.compile_output);

  // Compilation error
  if (statusId === 6) {
    return { output: '', error: compileOutput || 'Compilation error (no details)' };
  }

  // Time limit exceeded
  if (statusId === 5) {
    return {
      output: stdout,
      error: 'Time Limit Exceeded — program ran for more than 10 seconds',
    };
  }

  // Runtime errors (7–12)
  if (statusId >= 7 && statusId <= 12) {
    const errMsg = stderr || compileOutput || result.status?.description || 'Runtime error';
    return { output: stdout, error: errMsg };
  }

  // Internal / format errors
  if (statusId === 13 || statusId === 14) {
    return { output: '', error: `Internal error: ${result.status?.description}` };
  }

  // Still queued/processing (shouldn't reach here normally)
  if (statusId === 1 || statusId === 2) {
    return { output: '', error: 'Still processing — please try again' };
  }

  // Accepted (3) or any other — combine stdout + stderr
  const combined = [stdout, stderr].filter(Boolean).join('\n');
  return {
    output: combined || 'Program executed successfully (no output)',
    error: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
