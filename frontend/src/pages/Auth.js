import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Code, LogIn, UserPlus, Zap, Globe, Shield } from 'lucide-react';

const Auth = ({ darkMode }) => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({ authorizationParams: { screen_hint: 'login' } });
  };

  const handleSignup = () => {
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  };

  const features = [
    { icon: Zap,    text: 'Run code in 14 languages instantly' },
    { icon: Globe,  text: 'Works in any browser, no install needed' },
    { icon: Shield, text: 'Secure Auth0 authentication' },
    { icon: Code,   text: 'Save, share and manage your projects' },
  ];

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 ${
        darkMode ? 'bg-dark-bg' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
    >
      <div className="max-w-md w-full space-y-8">

        {/* Logo + heading */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Code className="h-9 w-9 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
            Welcome to RapidCompiler
          </h1>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Free online IDE — write, compile and run code in your browser
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-2">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center space-x-3">
              <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text}</span>
            </li>
          ))}
        </ul>

        {/* Auth card */}
        <div
          className={`rounded-2xl shadow-xl p-8 space-y-4 ${
            darkMode ? 'bg-dark-surface border border-dark-border' : 'bg-white'
          }`}
        >
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-md"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign in to your account</span>
          </button>

          <button
            onClick={handleSignup}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors border-2 ${
              darkMode
                ? 'border-dark-border text-dark-text hover:bg-dark-bg'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create a free account</span>
          </button>

          <p className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            By continuing you agree to our{' '}
            <a href="#" className="text-blue-500 hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
          </p>
        </div>

        <p className={`text-center text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          You can also use RapidCompiler without an account —{' '}
          <a href="/" className="text-blue-500 hover:underline font-medium">
            start coding now
          </a>
        </p>

      </div>
    </div>
  );
};

export default Auth;
