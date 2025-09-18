const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        output: 'PHP preview ready', 
        error: null,
        webPreview: true
      })
    };
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