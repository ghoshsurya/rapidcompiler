/**
 * Code execution via Judge0 CE (https://ce.judge0.com)
 * Free, no API key required, supports all languages in this project.
 *
 * Language IDs: https://ce.judge0.com/languages/
 */

const https = require('https');

// Judge0 CE language IDs (verified against https://ce.judge0.com/languages/)
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

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { language, code, input = '' } = body;

  if (!language || !code) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'language and code are required' }),
    };
  }

  // Web preview is handled client-side
  if (language === 'web') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ output: 'Web preview ready', error: null }),
    };
  }

  const languageId = JUDGE0_LANG_IDS[language];
  if (!languageId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Unsupported language: ${language}` }),
    };
  }

  try {
    const result = await executeCode(languageId, code, input);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Execution error:', error);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ output: '', error: error.message }),
    };
  }
};

/**
 * Submit code to Judge0 CE with wait=true for a synchronous result.
 * All fields are base64-encoded as required by the API.
 */
function executeCode(languageId, sourceCode, stdin) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      source_code:      Buffer.from(sourceCode).toString('base64'),
      language_id:      languageId,
      stdin:            Buffer.from(stdin || '').toString('base64'),
      cpu_time_limit:   10,
      wall_time_limit:  15,
      memory_limit:     128000,
    });

    const options = {
      hostname: 'ce.judge0.com',
      port: 443,
      // wait=true makes the API block until execution completes (no polling needed)
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
        try {
          const result = JSON.parse(data);
          console.log('Judge0 response status:', result.status?.id, result.status?.description);
          resolve(parseJudge0Result(result));
        } catch (e) {
          resolve({ output: '', error: `Response parse error: ${e.message}. Raw: ${data.substring(0, 200)}` });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ output: '', error: `Network error connecting to Judge0: ${e.message}` });
    });

    // 20s total timeout (compile + run)
    req.setTimeout(20000, () => {
      req.destroy();
      resolve({ output: '', error: 'Execution timed out (20 seconds)' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Parse a Judge0 result object into { output, error }.
 * Judge0 status IDs:
 *   1 = In Queue, 2 = Processing
 *   3 = Accepted
 *   4 = Wrong Answer
 *   5 = Time Limit Exceeded
 *   6 = Compilation Error
 *   7-12 = Runtime Errors (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other)
 *   13 = Internal Error
 *   14 = Exec Format Error
 */
function parseJudge0Result(result) {
  const statusId = result.status?.id;

  // Decode base64 fields safely
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
      error: 'Time Limit Exceeded — your program ran for more than 10 seconds',
    };
  }

  // Runtime errors
  if (statusId >= 7 && statusId <= 12) {
    const errMsg = stderr || compileOutput || result.status?.description || 'Runtime error';
    return { output: stdout, error: errMsg };
  }

  // Internal / format errors
  if (statusId === 13 || statusId === 14) {
    return { output: '', error: `Internal error: ${result.status?.description}` };
  }

  // Still queued/processing (shouldn't happen with wait=true, but handle gracefully)
  if (statusId === 1 || statusId === 2) {
    return { output: '', error: 'Execution is still processing — please try again' };
  }

  // Accepted (3) or any other status — return whatever output we have
  // Combine stdout + stderr so nothing is lost (some programs write to stderr intentionally)
  const combined = [stdout, stderr].filter(Boolean).join('\n');
  return {
    output: combined || 'Program executed successfully (no output)',
    error: null,
  };
}
