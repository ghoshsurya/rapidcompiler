import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Copy } from 'lucide-react';
import { api } from '../lib/supabase';

const SharedProject = ({ darkMode }) => {
  const { shareId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchSharedProject();
  }, [shareId]);

  const fetchSharedProject = async () => {
    try {
      const response = await fetch(`/.netlify/functions/neon-api/share/${shareId}`);
      const data = await response.json();
      if (response.ok) {
        setProject(data);
      } else {
        setError('Project not found or not publicly shared');
      }
    } catch (error) {
      setError('Project not found or not publicly shared');
    } finally {
      setLoading(false);
    }
  };

  const runCode = async () => {
    if (!project) return;
    
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      const response = await fetch('/.netlify/functions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: project.language,
          code: project.code,
          input
        })
      });
      const data = await response.json();
      
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output || 'Program executed successfully (no output)');
      }
    } catch (error) {
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(project.code);
    alert('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading shared project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Project Not Found</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className={`border-b ${darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{project.title}</h1>
            <p className="text-sm text-gray-500">Shared Project • {project.language}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyCode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>Copy Code</span>
            </button>
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Code Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={project.language === 'cpp' ? 'cpp' : project.language}
            value={project.code}
            theme={darkMode ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false
            }}
          />
        </div>

        {/* Input/Output Panel */}
        <div className={`w-full lg:w-96 border-l ${darkMode ? 'border-dark-border' : 'border-gray-200'} flex flex-col`}>
          {/* Input Section */}
          <div className="h-1/2 flex flex-col">
            <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
              <span className="text-sm font-medium">Input</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for the program..."
              className={`flex-1 p-3 resize-none font-mono text-sm ${
                darkMode 
                  ? 'bg-dark-bg text-dark-text' 
                  : 'bg-white text-gray-900'
              } border-0 focus:outline-none`}
            />
          </div>

          {/* Output Section */}
          <div className="h-1/2 flex flex-col">
            <div className={`border-b border-t ${darkMode ? 'border-dark-border' : 'border-gray-200'} p-2`}>
              <span className="text-sm font-medium">Output</span>
            </div>
            <div className={`flex-1 p-3 font-mono text-sm terminal-output overflow-auto ${
              darkMode 
                ? 'bg-dark-bg text-dark-text' 
                : 'bg-gray-50 text-gray-900'
            }`}>
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedProject;