const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');

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

async function executeOnlineCompiler(language, code, input) {
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

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.run) {
      return {
        output: result.run.stdout || '',
        error: result.run.stderr || null
      };
    } else {
      return {
        output: '',
        error: result.compile?.stderr || 'Compilation failed'
      };
    }
  } catch (error) {
    return {
      output: '',
      error: `Execution error: ${error.message}`
    };
  }
}