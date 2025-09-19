import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, Share, Terminal, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

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
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [webPreview, setWebPreview] = useState('');
  const editorRef = useRef(null);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(LANGUAGE_TEMPLATES[newLanguage]);
    setOutput('');
    setWebPreview('');
  };

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
      const result = window.ts.transpile(code, {
        target: window.ts.ScriptTarget.ES2015,
        module: window.ts.ModuleKind.CommonJS
      });
      
      // Create a safe execution environment
      const originalConsoleLog = console.log;
      let output = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };
      
      // Execute the compiled JavaScript
      try {
        eval(result);
        console.log = originalConsoleLog;
        return output || 'Program executed successfully (no output)';
      } catch (error) {
        console.log = originalConsoleLog;
        return `Runtime Error: ${error.message}`;
      }
    } catch (error) {
      return `Compilation Error: ${error.message}`;
    }
  };

  const executeGo = async () => {
    try {
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        // Variable declarations: var name = value or name := value
        const varMatch = line.match(/(var\s+(\w+)\s*=\s*([^\n]+))|(\w+)\s*:=\s*([^\n]+)/);
        if (varMatch) {
          const varName = varMatch[2] || varMatch[4];
          const value = varMatch[3] || varMatch[5];
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // fmt.Println with variables: fmt.Println(variable)
        const printVarMatch = line.match(/fmt\.Println\((\w+)\)/);
        if (printVarMatch && !line.includes('"')) {
          const varName = printVarMatch[1];
          output += (variables[varName] || varName) + '\n';
          continue;
        }
        
        // Simple fmt.Println: fmt.Println("text")
        const printMatch = line.match(/fmt\.Println\(["'`]([^"'`]+)["'`]\)/);
        if (printMatch) {
          output += printMatch[1] + '\n';
        }
      }
      
      if (!code.includes('package main')) {
        return 'Error: Go programs must start with "package main"';
      }
      
      if (!code.includes('func main()')) {
        return 'Error: Go programs must have a "func main()" function';
      }
      
      return output || 'Program executed successfully (no output)';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeRust = async () => {
    try {
      let output = '';
      
      // Enhanced println! parsing with variables and expressions
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        // Variable declarations: let x = value;
        const varMatch = line.match(/let\s+(\w+)\s*=\s*([^;]+);/);
        if (varMatch) {
          const [, varName, value] = varMatch;
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // println! with variables: println!("{}", variable);
        const printVarMatch = line.match(/println!\("([^"]*)",\s*(\w+)\)/);
        if (printVarMatch) {
          const [, format, varName] = printVarMatch;
          const value = variables[varName] || varName;
          output += format.replace('{}', value) + '\n';
          continue;
        }
        
        // Simple println!: println!("text");
        const printMatch = line.match(/println!\(["']([^"']+)["']\)/);
        if (printMatch) {
          output += printMatch[1] + '\n';
        }
      }
      
      if (!code.includes('fn main()')) {
        return 'Error: Rust programs must have a "fn main()" function';
      }
      
      return output || 'Program executed successfully (no output)';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeSwift = async () => {
    try {
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        // Variable declarations: let/var name = value
        const varMatch = line.match(/(let|var)\s+(\w+)\s*=\s*([^\n]+)/);
        if (varMatch) {
          const [, , varName, value] = varMatch;
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // print with variables: print(variable)
        const printVarMatch = line.match(/print\((\w+)\)/);
        if (printVarMatch && !line.includes('"')) {
          const varName = printVarMatch[1];
          output += (variables[varName] || varName) + '\n';
          continue;
        }
        
        // Simple print: print("text")
        const printMatch = line.match(/print\(["']([^"']+)["']\)/);
        if (printMatch) {
          output += printMatch[1] + '\n';
        }
      }
      
      return output || 'Program executed successfully (no output)';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeRuby = async () => {
    try {
      let output = '';
      const lines = code.split('\n');
      const variables = {};
      
      for (const line of lines) {
        // Variable assignments: name = value
        const varMatch = line.match(/(\w+)\s*=\s*([^\n]+)/);
        if (varMatch && !line.includes('puts') && !line.includes('print')) {
          const [, varName, value] = varMatch;
          try {
            variables[varName] = eval(value.replace(/"/g, '"'));
          } catch {
            variables[varName] = value.replace(/"/g, '');
          }
        }
        
        // puts with variables: puts variable
        const putsVarMatch = line.match(/puts\s+(\w+)$/);
        if (putsVarMatch) {
          const varName = putsVarMatch[1];
          output += (variables[varName] || varName) + '\n';
          continue;
        }
        
        // Simple puts: puts "text"
        const putsMatch = line.match(/puts\s+["']([^"']+)["']/);
        if (putsMatch) {
          output += putsMatch[1] + '\n';
        }
      }
      
      return output || 'Program executed successfully (no output)';
    } catch (error) {
      return `Error: ${error.message}`;
    }
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
        const result = await executeGo();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Rust execution client-side
      if (language === 'rust') {
        const result = await executeRust();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Swift execution client-side
      if (language === 'swift') {
        const result = await executeSwift();
        setOutput(result);
        setWebPreview('');
        setIsRunning(false);
        return;
      }
      
      // Handle Ruby execution client-side
      if (language === 'ruby') {
        const result = await executeRuby();
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
      const response = await axios.post('/api/run', {
        language,
        code,
        input
      });
      
      if (response.data.error) {
        setOutput(`Error: ${response.data.error}`);
        setWebPreview('');
      } else {
        setOutput(response.data.output || 'Program executed successfully (no output)');
        setWebPreview('');
      }
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.error || 'Failed to execute code'}`);
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
      const response = await axios.post('http://localhost:5000/api/projects', {
        title: projectTitle,
        language,
        code
      });
      
      alert('Project saved successfully!');
      setShowSaveDialog(false);
    } catch (error) {
      alert('Failed to save project');
    }
  };

  const shareProject = async () => {
    if (!user) {
      alert('Please login to share projects');
      return;
    }

    try {
      // First save the project
      const saveResponse = await axios.post('http://localhost:5000/api/projects', {
        title: projectTitle,
        language,
        code
      });

      // Then share it
      const shareResponse = await axios.post(
        `http://localhost:5000/api/projects/${saveResponse.data.id}/share`
      );

      const shareUrl = `${window.location.origin}${shareResponse.data.share_url}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to share project');
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col h-64 lg:h-auto" style={{minWidth: '300px'}}>
          <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Code Editor</span>
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
              onChange={setCode}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                selectOnLineNumbers: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                parameterHints: { enabled: true },
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

        {/* Vertical Resize Handle - Hidden on mobile */}
        <div 
          className={`hidden lg:block w-1 cursor-col-resize hover:bg-blue-500 ${darkMode ? 'bg-dark-border' : 'bg-gray-300'}`}
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

          {/* Horizontal Resize Handle - Hidden on mobile */}
          <div 
            className={`hidden lg:block h-1 cursor-row-resize hover:bg-blue-500 ${darkMode ? 'bg-dark-border' : 'bg-gray-300'}`}
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