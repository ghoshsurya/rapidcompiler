const { spawn } = require('child_process');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { language, code, input = '' } = JSON.parse(event.body);

  // Web language handling
  if (language === 'web') {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        output: 'Web preview ready', 
        error: null,
        webPreview: true
      })
    };
  }

  // C/C++ execution using Judge0 API
  if (language === 'c' || language === 'cpp') {
    try {
      const result = await executeWithJudge0(language, code, input);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ output: '', error: error.message })
      };
    }
  }

  // PHP execution using Judge0 API
  if (language === 'php') {
    try {
      const result = await executeWithJudge0(language, code, input);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ output: '', error: error.message })
      };
    }
  }

  // Python execution
  if (language === 'python') {
    try {
      const result = await executeCode('python3', ['-c', code], input);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ output: '', error: error.message })
      };
    }
  }

  // JavaScript execution
  if (language === 'javascript') {
    try {
      const result = await executeCode('node', ['-e', code], input);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ output: '', error: error.message })
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ error: 'Language not supported' })
  };
};

function executeCode(command, args, input) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ output: stdout, error: null });
      } else {
        resolve({ output: '', error: stderr || 'Execution failed' });
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function executeWithJudge0(language, code, input) {
  const https = require('https');
  
  const languageIds = {
    'c': 50,
    'cpp': 54,
    'php': 68
  };

  const submission = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageIds[language],
    stdin: input ? Buffer.from(input).toString('base64') : ''
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(submission);
    
    const options = {
      hostname: 'judge0-ce.p.rapidapi.com',
      port: 443,
      path: '/submissions?base64_encoded=true&wait=true',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': 'demo-key',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.stdout) {
            resolve({
              output: Buffer.from(result.stdout, 'base64').toString(),
              error: null
            });
          } else if (result.stderr) {
            resolve({
              output: '',
              error: Buffer.from(result.stderr, 'base64').toString()
            });
          } else if (result.compile_output) {
            resolve({
              output: '',
              error: Buffer.from(result.compile_output, 'base64').toString()
            });
          } else {
            resolve({
              output: '',
              error: 'No output generated'
            });
          }
        } catch (e) {
          resolve({ output: '', error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ output: '', error: `Network error: ${e.message}` });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ output: '', error: 'Execution timeout' });
    });

    req.write(postData);
    req.end();
  });
}