import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import {
  Code2, Zap, Globe, Shield, FolderOpen,
  ArrowRight, Github, Chrome, Sparkles
} from 'lucide-react';

/* ─── Language pills shown on the hero side ─────────────────────────── */
const LANGS = [
  { name: 'Python',     color: 'bg-blue-500/20 text-blue-300 ring-blue-500/30' },
  { name: 'JavaScript', color: 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30' },
  { name: 'Rust',       color: 'bg-orange-500/20 text-orange-300 ring-orange-500/30' },
  { name: 'Go',         color: 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30' },
  { name: 'Java',       color: 'bg-red-500/20 text-red-300 ring-red-500/30' },
  { name: 'C++',        color: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
  { name: 'TypeScript', color: 'bg-sky-500/20 text-sky-300 ring-sky-500/30' },
  { name: 'C#',         color: 'bg-violet-500/20 text-violet-300 ring-violet-500/30' },
  { name: 'Ruby',       color: 'bg-rose-500/20 text-rose-300 ring-rose-500/30' },
  { name: 'Swift',      color: 'bg-pink-500/20 text-pink-300 ring-pink-500/30' },
  { name: 'PHP',        color: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30' },
  { name: 'SQL',        color: 'bg-green-500/20 text-green-300 ring-green-500/30' },
];

const FEATURES = [
  { icon: Zap,        title: 'Instant Execution',    desc: 'Run code in milliseconds across 14 languages' },
  { icon: Globe,      title: 'Zero Setup',           desc: 'Works in any browser — no installs, no config' },
  { icon: Shield,     title: 'Secure & Private',     desc: 'Auth0-powered authentication keeps you safe' },
  { icon: FolderOpen, title: 'Save & Share',          desc: 'Manage projects and share with a single link' },
];

/* ─── Animated code snippet ──────────────────────────────────────────── */
const CODE_LINES = [
  { indent: 0, tokens: [{ t: 'def ',         c: 'text-blue-400' }, { t: 'greet',    c: 'text-yellow-300' }, { t: '(name):', c: 'text-gray-300' }] },
  { indent: 1, tokens: [{ t: 'return ',      c: 'text-blue-400' }, { t: 'f"Hello, ', c: 'text-green-300' }, { t: '{name}',  c: 'text-orange-300' }, { t: '!"', c: 'text-green-300' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ t: 'print',        c: 'text-yellow-300' }, { t: '(',       c: 'text-gray-300' }, { t: 'greet', c: 'text-yellow-300' }, { t: '(', c: 'text-gray-300' }, { t: '"RapidCompiler"', c: 'text-green-300' }, { t: '))', c: 'text-gray-300' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ t: '# Output: ',   c: 'text-gray-500' }, { t: 'Hello, RapidCompiler!', c: 'text-gray-500' }] },
];

const Auth = ({ darkMode }) => {
  const { loginWithRedirect } = useAuth0();
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleLogin  = () => loginWithRedirect({ authorizationParams: { screen_hint: 'login'  } });
  const handleSignup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col lg:flex-row overflow-hidden">

      {/* ── LEFT: Hero panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center space-x-3 relative z-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">RapidCompiler</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-blue-300 text-xs font-medium">Free online IDE — no account needed to try</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
            Write, compile<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              and run code
            </span><br />
            in your browser.
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            A professional coding environment powered by Monaco Editor — the same engine behind VS Code.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippet */}
        <div className="relative z-10">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center space-x-2 px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-gray-500 text-xs font-mono">main.py</span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1">
              {CODE_LINES.map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-gray-600 select-none w-6 text-right mr-4 text-xs leading-6">{i + 1}</span>
                  <span style={{ paddingLeft: `${line.indent * 16}px` }} className="leading-6">
                    {line.tokens.map((tok, j) => (
                      <span key={j} className={tok.c}>{tok.t}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Language pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {LANGS.map(({ name, color }) => (
              <span key={name} className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${color}`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 relative">

        {/* Mobile background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none lg:hidden" />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30 mb-4">
              <Code2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">RapidCompiler</h1>
            <p className="text-gray-400 text-sm mt-1">Free online IDE for everyone</p>
          </div>

          {/* Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl">

            <div className="mb-7">
              <h2 className="text-white text-2xl font-bold mb-1">Get started</h2>
              <p className="text-gray-400 text-sm">Sign in or create a free account to save your work</p>
            </div>

            {/* Sign in button */}
            <button
              onClick={handleLogin}
              onMouseEnter={() => setHoveredBtn('login')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="group w-full relative flex items-center justify-center space-x-3 py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:shadow-xl mb-3"
            >
              <span className="flex items-center space-x-2">
                <Chrome className="h-4 w-4" />
                <span>Continue with Google</span>
              </span>
              <ArrowRight className={`h-4 w-4 absolute right-4 transition-transform duration-200 ${hoveredBtn === 'login' ? 'translate-x-1' : ''}`} />
            </button>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-[#30363d]" />
              <span className="mx-3 text-gray-500 text-xs">or continue with email</span>
              <div className="flex-1 border-t border-[#30363d]" />
            </div>

            {/* Email sign in */}
            <button
              onClick={handleLogin}
              onMouseEnter={() => setHoveredBtn('email')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="group w-full flex items-center justify-center space-x-2 py-3.5 px-5 rounded-xl border border-[#30363d] hover:border-blue-500/50 text-gray-200 hover:text-white font-semibold text-sm transition-all duration-200 hover:bg-blue-500/5 mb-3"
            >
              <span>Sign in to your account</span>
              <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${hoveredBtn === 'email' ? 'translate-x-1' : ''}`} />
            </button>

            {/* Create account */}
            <button
              onClick={handleSignup}
              onMouseEnter={() => setHoveredBtn('signup')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="group w-full flex items-center justify-center space-x-2 py-3.5 px-5 rounded-xl border border-dashed border-[#30363d] hover:border-purple-500/50 text-gray-400 hover:text-purple-300 font-semibold text-sm transition-all duration-200 hover:bg-purple-500/5"
            >
              <span>Create a free account</span>
              <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${hoveredBtn === 'signup' ? 'translate-x-1' : ''}`} />
            </button>

            {/* Terms */}
            <p className="text-center text-xs text-gray-600 mt-6">
              By continuing you agree to our{' '}
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a>
            </p>
          </div>

          {/* Skip to editor */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Just want to try it?{' '}
              <Link to="/" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors inline-flex items-center space-x-1">
                <span>Start coding now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>

          {/* GitHub */}
          <div className="mt-4 text-center">
            <a
              href="https://github.com/ghoshsurya/rapidcompiler"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Open source on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
