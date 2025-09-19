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
  
  const languageMap = {
    'c': 'c',
    'cpp': 'cpp',
    'php': 'php'
  };

  const payload = {
    language: languageMap[language],
    version: 'latest',
    files: [{
      name: language === 'cpp' ? 'main.cpp' : language === 'c' ? 'main.c' : 'main.php',
      content: code
    }],
    stdin: input || ''
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'emkc.org',
      port: 443,
      path: '/api/v2/piston/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          console.log('API Response:', result); // Debug log
          
          if (result.run && result.run.stdout) {
            resolve({
              output: result.run.stdout,
              error: null
            });
          } else if (result.run && result.run.stderr) {
            resolve({
              output: result.run.stdout || '',
              error: result.run.stderr
            });
          } else if (result.compile && result.compile.stderr) {
            resolve({
              output: '',
              error: result.compile.stderr
            });
          } else {
            // Fallback - return whatever we got
            resolve({
              output: JSON.stringify(result, null, 2),
              error: null
            });
          }
        } catch (e) {
          resolve({ output: '', error: `Parse error: ${e.message}` });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ output: '', error: `Network error: ${e.message}` });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ output: '', error: 'Request timeout' });
    });

    req.write(postData);
    req.end();
  });
}