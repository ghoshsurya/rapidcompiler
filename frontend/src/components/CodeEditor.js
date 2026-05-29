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
  const [editorHeight, setEditorHeight] = useState(60); // percentage
  const [editorWidth, setEditorWidth] = useState(50); // percentage for desktop
  const [inputOutputHeight, setInputOutputHeight] = useState(50); // percentage for desktop input/output split
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const editorRef = useRef(null);

  // Load project if project ID is in URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && user) {
      loadProject(projectId);
    }
  }, [searchParams, user]);

  // Handle window resize for desktop detection
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // All languages are executed via the Piston API through the Netlify function.
  // No client-side interpreters — they were unreliable and only handled trivial programs.

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
    setOutput('⏳ Running...');
    setWebPreview('');

    try {
      // HTML/CSS/JS — render in iframe, no server needed
      if (language === 'web') {
        setOutput('✅ Web page rendered successfully!');
        setWebPreview(`data:text/html;charset=utf-8,${encodeURIComponent(code)}`);
        return;
      }

      // All other languages go through the Piston API via the Netlify function
      const response = await fetch('/.netlify/functions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input }),
      });

      if (!response.ok) {
        const text = await response.text();
        setOutput(`❌ Server error (${response.status}): ${text}`);
        return;
      }

      const data = await response.json();

      // Show stderr (compile/runtime errors) prominently, but still show any stdout
      if (data.error && data.output) {
        setOutput(`${data.output}\n\n⚠️ Stderr:\n${data.error}`);
      } else if (data.error) {
        setOutput(`❌ ${data.error}`);
      } else {
        setOutput(data.output || '✅ Program executed successfully (no output)');
      }
    } catch (error) {
      setOutput(`❌ Failed to run code: ${error.message}`);
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

      {/* Mobile Instructions */}
      {!isDesktop && (
        <div className="px-2 py-1 text-xs text-center bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
          💡 Tip: Long press text to select • scroll down to see output
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex ${isDesktop ? 'flex-row' : 'flex-col'}`}>
        {/* Code Editor */}
        <div 
          className="flex flex-col" 
          style={isDesktop ? {
            width: `${editorWidth}%`,
            minWidth: '300px'
          } : {
            height: '50vh',
            minHeight: '300px'
          }}
        >
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

        {/* Desktop Width Resize Handle */}
        {isDesktop && (
          <div 
            className={`w-3 cursor-col-resize flex items-center justify-center group transition-colors ${
              darkMode ? 'bg-gray-700 hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-500'
            } ${isResizing ? 'bg-blue-500' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              const startX = e.clientX;
              const container = e.target.parentElement;
              const containerWidth = container.offsetWidth;
              const startWidth = editorWidth;
              
              const handleMouseMove = (e) => {
                const deltaX = e.clientX - startX;
                const deltaPercent = (deltaX / containerWidth) * 100;
                const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));
                setEditorWidth(newWidth);
              };
              
              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className={`w-1 h-12 rounded-full transition-colors ${
              darkMode ? 'bg-gray-500 group-hover:bg-white' : 'bg-gray-400 group-hover:bg-white'
            } ${isResizing ? 'bg-white' : ''}`} />
          </div>
        )}

        {/* Input/Output Panel */}
        <div 
          className={`flex flex-col ${isDesktop ? 'border-l' : ''} ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}
          style={isDesktop ? {
            width: `${100 - editorWidth}%`,
            minWidth: '300px'
          } : {
            height: '50vh',
            minHeight: '300px'
          }}
        >
          {/* Input Section */}
          <div 
            className="flex flex-col"
            style={isDesktop ? {
              height: `${inputOutputHeight}%`,
              minHeight: '150px'
            } : {
              height: '40%',
              minHeight: '120px'
            }}
          >
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

          {/* Desktop Input/Output Height Resize Handle */}
          {isDesktop && (
            <div 
              className={`h-3 cursor-row-resize flex items-center justify-center group transition-colors ${
                darkMode ? 'bg-gray-700 hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-500'
              } ${isResizing ? 'bg-blue-500' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
                const startY = e.clientY;
                const container = e.target.parentElement;
                const containerHeight = container.offsetHeight;
                const startHeight = inputOutputHeight;
                
                const handleMouseMove = (e) => {
                  const deltaY = e.clientY - startY;
                  const deltaPercent = (deltaY / containerHeight) * 100;
                  const newHeight = Math.max(20, Math.min(80, startHeight + deltaPercent));
                  setInputOutputHeight(newHeight);
                };
                
                const handleMouseUp = () => {
                  setIsResizing(false);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className={`w-12 h-1 rounded-full transition-colors ${
                darkMode ? 'bg-gray-500 group-hover:bg-white' : 'bg-gray-400 group-hover:bg-white'
              } ${isResizing ? 'bg-white' : ''}`} />
            </div>
          )}

          {/* Output Section */}
          <div 
            className="flex flex-col"
            style={isDesktop ? {
              height: `${100 - inputOutputHeight}%`,
              minHeight: '150px'
            } : {
              height: '60%',
              minHeight: '180px'
            }}
          >
            <div className={`border-b ${isDesktop ? 'border-t' : ''} ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">{language === 'web' ? 'Web Preview' : 'Output'}</span>
                </div>
                {language === 'web' && webPreview && (
                  <button
                    onClick={() => {
                      const newWindow = window.open('', '_blank');
                      newWindow.document.write(code);
                      newWindow.document.close();
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Open in new tab"
                  >
                    Full Preview
                  </button>
                )}
              </div>
            </div>
            {language === 'web' && webPreview ? (
              <iframe
                src={webPreview}
                className={`flex-1 border-0 ${isDesktop ? 'min-h-0' : 'h-full'}`}
                title="Web Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className={`flex-1 p-2 sm:p-3 font-mono text-xs sm:text-sm terminal-output overflow-auto whitespace-pre-wrap ${isDesktop ? 'min-h-0' : 'h-full'} ${
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