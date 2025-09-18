const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

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

  // PHP language handling
  if (language === 'php') {
    try {
      const result = await executeOnlineCompiler('php', code, input);
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

  // C/C++ execution using online compiler
  if (language === 'c' || language === 'cpp') {
    try {
      const result = await executeOnlineCompiler(language, code, input);
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
    body: JSON.stringify({ error: 'Language not supported in serverless environment' })
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

function executeOnlineCompiler(language, code, input) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      language: language === 'cpp' ? 'cpp17' : 'c',
      version: 'latest',
      code: code,
      input: input
    });

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
          if (result.run) {
            resolve({
              output: result.run.stdout || '',
              error: result.run.stderr || (result.run.code !== 0 ? 'Execution failed' : null)
            });
          } else {
            resolve({ output: '', error: 'Compilation failed' });
          }
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Network error: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}