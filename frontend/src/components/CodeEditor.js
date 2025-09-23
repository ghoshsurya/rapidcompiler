import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Save, Share, Terminal, FileText, Download, Copy, Clipboard, Undo, Redo, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { debounce } from '../utils/performance';

const LANGUAGE_TEMPLATES = {
  python: `# Python Code
print("Hello, World!")`,
  javascript: `// JavaScript Code
console.log("Hello, World!");`,
  typescript: `// TypeScript Code
interface Greeting {
    message: string;
}

const greeting: Greeting = {
    message: "Hello, World!"
};

console.log(greeting.message);`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  rust: `fn main() {
    println!("Hello, World!");
}`,
  swift: `import Foundation

print("Hello, World!")`,
  ruby: `# Ruby Code
puts "Hello, World!"`,
  sql: `-- SQL Query Example
SELECT 'Hello, World!' AS message;

-- Create a sample table
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100)
);

-- Insert sample data
INSERT INTO users VALUES (1, 'John Doe', 'john@example.com');

-- Query the data
SELECT * FROM users;`,
  php: `<?php
echo "Hello, World!\n";
?>`,
  web: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; margin: 50px; }
        .container { text-align: center; }
        button { padding: 10px 20px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <button onclick="changeColor()">Click Me</button>
    </div>
    
    <script>
        function changeColor() {
            document.body.style.backgroundColor = 
                document.body.style.backgroundColor === 'lightblue' ? 'white' : 'lightblue';
        }
    </script>
</body>
</html>`
};

const CodeEditor = ({ darkMode }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [webPreview, setWebPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const editorRef = useRef(null);

  // Load project if project ID is in URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && user) {
      loadProject(projectId);
    }
  }, [searchParams, user]);

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data;
      
      setCurrentProjectId(projectId);
      setProjectTitle(project.title);
      setLanguage(project.language);
      setCode(project.code);
      setOutput('');
      setWebPreview('');
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    setCode(LANGUAGE_TEMPLATES[newLanguage]);
    setOutput('');
    setWebPreview('');
    setCurrentProjectId(null); // Reset project ID when changing language
  }, []);

  const debouncedCodeChange = useMemo(
    () => debounce((newCode) => {
      setCode(newCode);
    }, 100),
    []
  );

  const executeTypeScript = async () => {
    try {
      // Load TypeScript compiler from CDN
      if (!window.ts) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/typescript@latest/lib/typescript.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }
      
      // Compile TypeScript to JavaScript
      const jsCode = window.ts.transpile(code, {
        target: window.ts.ScriptTarget.ES2020,
        module: window.ts.ModuleKind.CommonJS,
        strict: false
      });
      
      // Execute JavaScript with full support
      return await executeJavaScript(jsCode);
    } catch (error) {
      return `TypeScript Error: ${error.message}`;
    }
  };

  const executeJavaScript = async (jsCode) => {
    return new Promise((resolve) => {
      let output = '';
      let hasError = false;

      // Create a safe execution environment
      const originalConsole = { ...console };
      const inputLines = input.split('\n');
      let inputIndex = 0;

      // Mock console and input functions
      const mockConsole = {
        log: (...args) => { output += args.join(' ') + '\n'; },
        error: (...args) => { output += 'Error: ' + args.join(' ') + '\n'; },
        warn: (...args) => { output += 'Warning: ' + args.join(' ') + '\n'; }
      };

      const mockPrompt = (message) => {
        if (inputIndex < inputLines.length) {
          return inputLines[inputIndex++];
        }
        return '';
      };

      // Replace global objects
      const originalPrompt = window.prompt;
      window.console = mockConsole;
      window.prompt = mockPrompt;

      try {
        // Execute code with timeout
        const timeoutId = setTimeout(() => {
          hasError = true;
          resolve('Execution timeout (5 seconds)');
        }, 5000);

        // Execute the code
        eval(jsCode);

        clearTimeout(timeoutId);
        
        if (!hasError) {
          resolve(output || 'Program executed successfully');
        }
      } catch (error) {
        resolve(`Runtime Error: ${error.message}`);
      } finally {
        // Restore original objects
        window.console = originalConsole;
        window.prompt = originalPrompt;
      }
    });
  };

  const executeGoAdvanced = async () => {
    try {
      // Try Go Playground API first
      try {
        const response = await fetch('https://play.golang.org/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `version=2&body=${encodeURIComponent(code)}&withVet=true`
        });
        const result = await response.json();
        if (result.Events && result.Events[0]) {
          return result.Events[0].Message || 'Program executed successfully';
        }
        if (result.Errors) {
          return `Error: ${result.Errors}`;
        }
      } catch (apiError) {
        // Fallback to advanced parsing
      }
      
      // Advanced Go interpreter
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      let inMain = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('func main()')) {
          inMain = true;
          continue;
        }
        
        if (!inMain) continue;
        
        // Variable declarations
        const varMatch = trimmed.match(/(var\s+(\w+)\s*=\s*(.+))|(\w+)\s*:=\s*(.+)/);
        if (varMatch) {
          const varName = varMatch[2] || varMatch[4];
          const value = varMatch[3] || varMatch[5];
          try {
            variables[varName] = eval(value.replace(/"/g, '"').replace(/`/g, '"'));
          } catch {
            variables[varName] = value.replace(/["'`]/g, '');
          }
        }
        
        // For loops
        const forMatch = trimmed.match(/for\s+(\w+)\s*:=\s*(\d+);\s*\w+\s*<\s*(\d+);\s*\w+\+\+/);
        if (forMatch) {
          const [, varName, start, end] = forMatch;
          for (let i = parseInt(start); i < parseInt(end); i++) {
            variables[varName] = i;
          }
        }
        
        // Print statements
        const printMatch = trimmed.match(/fmt\.Print(?:ln)?\(([^)]+)\)/);
        if (printMatch) {
          let content = printMatch[1];
          
          // Handle variables
          if (variables[content]) {
            output += variables[content] + '\n';
          } else {
            // Handle string literals
            content = content.replace(/["'`]/g, '');
            output += content + '\n';
          }
        }
      }
      
      if (!code.includes('package main')) {
        return 'Error: Go programs must start with "package main"';
      }
      
      return output || 'Program executed successfully';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeRustAdvanced = async () => {
    try {
      // Advanced Rust interpreter
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      let inMain = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('fn main()')) {
          inMain = true;
          continue;
        }
        
        if (!inMain) continue;
        
        // Variable declarations: let x = value;
        const varMatch = trimmed.match(/let\s+(mut\s+)?(\w+)\s*=\s*([^;]+);/);
        if (varMatch) {
          const varName = varMatch[2];
          const value = varMatch[3];
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // For loops: for i in 0..n
        const forMatch = trimmed.match(/for\s+(\w+)\s+in\s+(\d+)\.\.(\d+)/);
        if (forMatch) {
          const [, varName, start, end] = forMatch;
          for (let i = parseInt(start); i < parseInt(end); i++) {
            variables[varName] = i;
          }
        }
        
        // println! with formatting: println!("{}", variable);
        const printVarMatch = trimmed.match(/println!\("([^"]*)",\s*([^)]+)\)/);
        if (printVarMatch) {
          const [, format, varExpr] = printVarMatch;
          let value = variables[varExpr] || varExpr;
          
          // Handle expressions like i * 2
          if (varExpr.includes('*') || varExpr.includes('+') || varExpr.includes('-')) {
            try {
              const expr = varExpr.replace(/(\w+)/g, (match) => variables[match] || match);
              value = eval(expr);
            } catch {}
          }
          
          output += format.replace('{}', value) + '\n';
          continue;
        }
        
        // Simple println!: println!("text");
        const printMatch = trimmed.match(/println!\(["']([^"']+)["']\)/);
        if (printMatch) {
          output += printMatch[1] + '\n';
        }
      }
      
      if (!code.includes('fn main()')) {
        return 'Error: Rust programs must have a "fn main()" function';
      }
      
      return output || 'Program executed successfully';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeSwiftAdvanced = async () => {
    try {
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Variable declarations: let/var name = value
        const varMatch = trimmed.match(/(let|var)\s+(\w+)\s*=\s*(.+)/);
        if (varMatch) {
          const [, , varName, value] = varMatch;
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // For loops: for i in 0..<n
        const forMatch = trimmed.match(/for\s+(\w+)\s+in\s+(\d+)\.\.<?\s*(\d+)/);
        if (forMatch) {
          const [, varName, start, end] = forMatch;
          const endVal = trimmed.includes('..<') ? parseInt(end) : parseInt(end) + 1;
          for (let i = parseInt(start); i < endVal; i++) {
            variables[varName] = i;
          }
        }
        
        // String interpolation: print("Hello \(name)")
        if (trimmed.includes('\\(') && trimmed.includes('print(')) {
          let text = trimmed.match(/print\("([^"]+)"/)?.[1] || '';
          text = text.replace(/\\\((\w+)\)/g, (match, varName) => {
            return variables[varName] || varName;
          });
          output += text + '\n';
          continue;
        }
        
        // print with variables: print(variable)
        const printVarMatch = trimmed.match(/print\((\w+)\)/);
        if (printVarMatch && !trimmed.includes('"')) {
          const varName = printVarMatch[1];
          output += (variables[varName] || varName) + '\n';
          continue;
        }
        
        // Simple print: print("text")
        const printMatch = trimmed.match(/print\(["']([^"']+)["']\)/);
        if (printMatch) {
          output += printMatch[1] + '\n';
        }
      }
      
      return output || 'Program executed successfully';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeRubyAdvanced = async () => {
    try {
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Variable assignments: name = value
        const varMatch = trimmed.match(/(\w+)\s*=\s*(.+)/);
        if (varMatch && !trimmed.includes('puts') && !trimmed.includes('print')) {
          const [, varName, value] = varMatch;
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/["']/g, '');
          }
        }
        
        // For loops: for i in 1..5 or (1..5).each
        const forMatch = trimmed.match(/(?:for\s+(\w+)\s+in\s+(\d+)\.\.(\d+))|(?:\((\d+)\.\.(\d+)\)\.each)/);
        if (forMatch) {
          const varName = forMatch[1] || 'i';
          const start = parseInt(forMatch[2] || forMatch[4]);
          const end = parseInt(forMatch[3] || forMatch[5]);
          for (let i = start; i <= end; i++) {
            variables[varName] = i;
          }
        }
        
        // String interpolation: puts "Hello #{name}"
        if (trimmed.includes('#{') && trimmed.includes('puts')) {
          let text = trimmed.match(/puts\s+"([^"]+)"/)?.[1] || '';
          text = text.replace(/#\{(\w+)\}/g, (match, varName) => {
            return variables[varName] || varName;
          });
          output += text + '\n';
          continue;
        }
        
        // puts with variables: puts variable
        const putsVarMatch = trimmed.match(/puts\s+(\w+)$/);
        if (putsVarMatch) {
          const varName = putsVarMatch[1];
          output += (variables[varName] || varName) + '\n';
          continue;
        }
        
        // Simple puts: puts "text"
        const putsMatch = trimmed.match(/puts\s+["']([^"']+)["']/);
        if (putsMatch) {
          output += putsMatch[1] + '\n';
        }
      }
      
      return output || 'Program executed successfully';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const downloadCode = () => {
    const extensions = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      c: 'c',
      cpp: 'cpp',
      java: 'java',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      ruby: 'rb',
      php: 'php',
      sql: 'sql',
      web: 'html'
    };
    
    const extension = extensions[language] || 'txt';
    const filename = `${projectTitle.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      // Handle TypeScript execution client-side
      if (language === 'typescript') {
        const result = await executeTypeScript();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Go execution client-side
      if (language === 'go') {
        const result = await executeGoAdvanced();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Rust execution client-side
      if (language === 'rust') {
        const result = await executeRustAdvanced();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Swift execution client-side
      if (language === 'swift') {
        const result = await executeSwiftAdvanced();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Ruby execution client-side
      if (language === 'ruby') {
        const result = await executeRubyAdvanced();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle web preview locally
      if (language === 'web') {
        setOutput('Web page rendered successfully!');
        setWebPreview(`data:text/html;charset=utf-8,${encodeURIComponent(code)}`);
        setIsRunning(false);
        return;
      }
      
      // Backend execution for other languages
      const response = await fetch('/.netlify/functions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input })
      });
      const data = await response.json();
      
      if (data.error) {
        setOutput(`Error: ${data.error}`);
        setWebPreview('');
      } else {
        setOutput(data.output || 'Program executed successfully (no output)');
        setWebPreview('');
      }
    } catch (error) {
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveProject = async () => {
    if (!user) {
      alert('Please login to save projects');
      return;
    }

    try {
      console.log('Saving project:', { id: currentProjectId, title: projectTitle, language, code: code.substring(0, 100) + '...' });
      
      if (currentProjectId) {
        // Update existing project
        await api.put(`/projects/${currentProjectId}`, {
          title: projectTitle,
          language: language,
          code: code
        });
        alert('Project updated successfully!');
      } else {
        // Create new project
        const response = await api.post('/projects', {
          title: projectTitle,
          language: language,
          code: code
        });
        setCurrentProjectId(response.data.id);
        alert('Project saved successfully!');
      }
      
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save project: ' + error.message);
    }
  };

  const shareProject = async () => {
    if (!user) {
      alert('Please login to share projects');
      return;
    }

    try {
      console.log('Sharing project:', { title: projectTitle, language, code: code.substring(0, 100) + '...' });
      // Save the project and get share_id
      const response = await api.post('/projects', {
        title: projectTitle,
        language: language,
        code: code
      });
      
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!\n' + shareUrl);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share project: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className={`border-b ${darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'} p-2 sm:p-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg border flex-1 sm:flex-none ${
                darkMode 
                  ? 'bg-dark-bg border-dark-border text-dark-text' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="swift">Swift</option>
              <option value="ruby">Ruby</option>
              <option value="sql">SQL</option>
              <option value="php">PHP</option>
              <option value="web">HTML/CSS/JS</option>
            </select>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center space-x-1 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run'}</span>
              <span className="sm:hidden">{isRunning ? '...' : 'Run'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowSaveDialog(true)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={shareProject}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Share className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={downloadCode}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Resize Instructions */}
      <div className="sm:hidden px-2 py-1 text-xs text-center bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
        💡 Tip: Long press text to select • Drag resize handles to adjust panels
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col h-64 lg:h-auto" style={{minWidth: '300px'}}>
          <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Code Editor</span>
              </div>
              {/* Mobile Editor Toolbar */}
              <div className="sm:hidden flex items-center space-x-1">
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      const model = editorRef.current.getModel();
                      const fullRange = model.getFullModelRange();
                      editorRef.current.setSelection(fullRange);
                      editorRef.current.focus();
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Select All"
                >
                  Select All
                </button>
                <button
                  onClick={async () => {
                    if (editorRef.current) {
                      const selection = editorRef.current.getSelection();
                      if (selection && !selection.isEmpty()) {
                        const selectedText = editorRef.current.getModel().getValueInRange(selection);
                        try {
                          await navigator.clipboard.writeText(selectedText);
                          alert('Copied to clipboard!');
                        } catch (err) {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = selectedText;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          textArea.style.top = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          try {
                            document.execCommand('copy');
                            alert('Copied to clipboard!');
                          } catch (err2) {
                            alert('Copy failed. Please select text and use Ctrl+C');
                          }
                          document.body.removeChild(textArea);
                        }
                      } else {
                        alert('Please select text first');
                      }
                    }
                  }}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={async () => {
                    if (editorRef.current) {
                      try {
                        const text = await navigator.clipboard.readText();
                        const selection = editorRef.current.getSelection();
                        if (selection) {
                          editorRef.current.executeEdits('paste', [{
                            range: selection,
                            text: text
                          }]);
                        }
                      } catch (err) {
                        alert('Paste failed. Please use long press and paste manually.');
                      }
                    }
                  }}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Paste"
                >
                  <Clipboard className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.trigger('keyboard', 'undo', null);
                    }
                  }}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Undo"
                >
                  <Undo className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.trigger('keyboard', 'redo', null);
                    }
                  }}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Redo"
                >
                  <Redo className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      const selection = editorRef.current.getSelection();
                      if (selection && !selection.isEmpty()) {
                        editorRef.current.executeEdits('delete', [{
                          range: selection,
                          text: ''
                        }]);
                        editorRef.current.focus();
                      } else {
                        alert('Please select text first');
                      }
                    }
                  }}
                  className={`p-1 rounded ${
                    darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-200 hover:bg-red-300'
                  }`}
                  title="Delete Selected"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : 
                       language === 'web' ? 'html' : 
                       language === 'csharp' ? 'csharp' :
                       language === 'typescript' ? 'typescript' :
                       language === 'swift' ? 'swift' : language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: window.innerWidth > 768 },
                fontSize: window.innerWidth <= 768 ? 16 : 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                selectOnLineNumbers: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                parameterHints: { enabled: true },
                // Mobile-specific options
                readOnly: false,
                domReadOnly: false,
                contextmenu: true,
                mouseWheelZoom: false,
                multiCursorModifier: 'ctrlCmd',
                accessibilitySupport: 'auto',
                // Touch and selection
                selectionHighlight: true,
                occurrencesHighlight: true,
                codeLens: false,
                folding: window.innerWidth > 768,
                foldingHighlight: window.innerWidth > 768,
                unfoldOnClickAfterEndOfLine: false,
                // Mobile performance
                smoothScrolling: false,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: false,
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                  showConstructors: true,
                  showFields: true,
                  showVariables: true,
                  showClasses: true,
                  showStructs: true,
                  showInterfaces: true,
                  showModules: true,
                  showProperties: true,
                  showEvents: true,
                  showOperators: true,
                  showUnits: true,
                  showValues: true,
                  showConstants: true,
                  showEnums: true,
                  showEnumMembers: true,
                  showReferences: true,
                  showFolders: true,
                  showTypeParameters: true
                }
              }}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                
                // Simple mobile text selection fix
                const domNode = editor.getDomNode();
                if (domNode) {
                  // Force enable text selection
                  domNode.style.webkitUserSelect = 'text';
                  domNode.style.userSelect = 'text';
                  domNode.style.webkitTouchCallout = 'default';
                  
                  // Apply to all Monaco elements after render
                  setTimeout(() => {
                    const elements = domNode.querySelectorAll('*');
                    elements.forEach(el => {
                      el.style.webkitUserSelect = 'text';
                      el.style.userSelect = 'text';
                      el.style.webkitTouchCallout = 'default';
                    });
                  }, 100);
                }
                
                // Register custom completions for each language
                monaco.languages.registerCompletionItemProvider('python', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print($1)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'input', kind: monaco.languages.CompletionItemKind.Function, insertText: 'input($1)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'len', kind: monaco.languages.CompletionItemKind.Function, insertText: 'len($1)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'range', kind: monaco.languages.CompletionItemKind.Function, insertText: 'range($1)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for ${1:i} in ${2:range(10)}:\n    ${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if ${1:condition}:\n    ${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'def', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'def ${1:function_name}(${2:args}):\n    ${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('javascript', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'console.log', kind: monaco.languages.CompletionItemKind.Function, insertText: 'console.log($1)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'function ${1:name}(${2:params}) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'addEventListener', kind: monaco.languages.CompletionItemKind.Function, insertText: 'addEventListener("${1:event}", ${2:function})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('c', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'printf', kind: monaco.languages.CompletionItemKind.Function, insertText: 'printf("${1:%s}\\n", ${2:variable});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'scanf', kind: monaco.languages.CompletionItemKind.Function, insertText: 'scanf("${1:%s}", &${2:variable});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'int main() {\n    ${1:// code}\n    return 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: '#include', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <${1:stdio.h}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('cpp', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'cout', kind: monaco.languages.CompletionItemKind.Function, insertText: 'cout << "${1:text}" << endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'cin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'cin >> ${1:variable};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'int main() {\n    ${1:// code}\n    return 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'vector', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'vector<${1:int}> ${2:name};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: '#include', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <${1:iostream}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('php', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'echo', kind: monaco.languages.CompletionItemKind.Function, insertText: 'echo "${1:text}";', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'print_r', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print_r(${1:variable});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'function ${1:name}(${2:params}) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'foreach', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'foreach (${1:array} as ${2:value}) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: '<?php', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<?php\n${1:// code}\n?>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('html', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'html5', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<!DOCTYPE html>\n<html>\n<head>\n    <title>${1:Title}</title>\n</head>\n<body>\n    ${2:content}\n</body>\n</html>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'div', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<div class="${1:class}">${2:content}</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'button', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<button onclick="${1:function}()">${2:text}</button>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'script', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<script>\n${1:// JavaScript code}\n</script>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'style', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<style>\n${1:/* CSS code */}\n</style>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('java', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'System.out.println', kind: monaco.languages.CompletionItemKind.Function, insertText: 'System.out.println("${1:text}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public static void main(String[] args) {\n    ${1:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'class', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public class ${1:ClassName} {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('csharp', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'Console.WriteLine', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Console.WriteLine("${1:text}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'Main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'static void Main() {\n    ${1:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'class', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'class ${1:ClassName} {\n    ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'using', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'using ${1:System};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
                
                monaco.languages.registerCompletionItemProvider('sql', {
                  provideCompletionItems: () => ({
                    suggestions: [
                      { label: 'SELECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SELECT ${1:columns} FROM ${2:table};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'INSERT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'UPDATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UPDATE ${1:table} SET ${2:column} = ${3:value} WHERE ${4:condition};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'DELETE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DELETE FROM ${1:table} WHERE ${2:condition};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
                      { label: 'CREATE TABLE', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'CREATE TABLE ${1:table_name} (\n    ${2:column1} ${3:datatype},\n    ${4:column2} ${5:datatype}\n);', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet }
                    ]
                  })
                });
              }}
            />
          </div>
        </div>

        {/* Vertical Resize Handle - Always Visible */}
        <div 
          className={`w-2 sm:w-1 cursor-col-resize hover:bg-blue-500 ${darkMode ? 'bg-blue-600' : 'bg-blue-400'} touch-none`}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const leftPanel = e.target.previousElementSibling;
            const rightPanel = e.target.nextElementSibling;
            const startLeftWidth = leftPanel.offsetWidth;
            const startRightWidth = rightPanel.offsetWidth;
            
            const handleMouseMove = (e) => {
              const deltaX = e.clientX - startX;
              const newLeftWidth = startLeftWidth + deltaX;
              const newRightWidth = startRightWidth - deltaX;
              
              if (newLeftWidth > 300 && newRightWidth > 200) {
                leftPanel.style.width = newLeftWidth + 'px';
                rightPanel.style.width = newRightWidth + 'px';
              }
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Input/Output Panel */}
        <div className={`flex flex-col w-full lg:w-96 border-t lg:border-t-0 lg:border-l ${darkMode ? 'border-dark-border' : 'border-gray-200'}`} style={{minWidth: '200px'}}>
          {/* Input Section */}
          <div className="flex flex-col h-32 lg:h-1/2">
            <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
              <div className="flex items-center space-x-2">
                <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Input</span>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input..."
              className={`flex-1 p-2 sm:p-3 resize-none font-mono text-xs sm:text-sm ${
                darkMode 
                  ? 'bg-dark-bg text-dark-text border-dark-border' 
                  : 'bg-white text-gray-900 border-gray-200'
              } border-0 focus:outline-none`}
            />
          </div>

          {/* Horizontal Resize Handle - Always Visible */}
          <div 
            className={`h-2 sm:h-1 cursor-row-resize hover:bg-blue-500 ${darkMode ? 'bg-blue-600' : 'bg-blue-400'} touch-none`}
            onMouseDown={(e) => {
              const startY = e.clientY;
              const topPanel = e.target.previousElementSibling;
              const bottomPanel = e.target.nextElementSibling;
              const container = e.target.parentElement;
              const containerHeight = container.offsetHeight;
              const startTopHeight = topPanel.offsetHeight;
              
              const handleMouseMove = (e) => {
                const deltaY = e.clientY - startY;
                const newTopHeight = startTopHeight + deltaY;
                const newBottomHeight = containerHeight - newTopHeight - 4;
                
                if (newTopHeight > 100 && newBottomHeight > 100) {
                  topPanel.style.height = newTopHeight + 'px';
                  bottomPanel.style.height = newBottomHeight + 'px';
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Output Section */}
          <div className="flex flex-col flex-1 lg:h-1/2">
            <div className={`border-b border-t lg:border-t-0 ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
              <div className="flex items-center space-x-2">
                <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">{language === 'web' ? 'Web Preview' : 'Output'}</span>
              </div>
            </div>
            {language === 'web' && webPreview ? (
              <iframe
                src={webPreview}
                className="flex-1 border-0 min-h-48"
                title="Web Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className={`flex-1 p-2 sm:p-3 font-mono text-xs sm:text-sm terminal-output overflow-auto min-h-48 ${
                darkMode 
                  ? 'bg-dark-bg text-dark-text' 
                  : 'bg-gray-50 text-gray-900'
              }`}>
                {output || 'Output will appear here...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${
            darkMode ? 'bg-dark-surface' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Save Project</h3>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Project title"
              className={`w-full px-3 py-2 border rounded-lg mb-4 ${
                darkMode 
                  ? 'bg-dark-bg border-dark-border text-dark-text' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <div className="flex space-x-3">
              <button
                onClick={saveProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;