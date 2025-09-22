import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Eye, EyeOff, Github, Mail } from 'lucide-react';

const Auth = ({ darkMode }) => {
  const { loginWithRedirect } = useAuth0();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleAuth0Login = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: isLogin ? 'login' : 'signup'
      }
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, redirect to Auth0 since we're using Auth0 authentication
    handleAuth0Login();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode ? 'bg-dark-bg' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl font-bold text-blue-600">RC</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className={`rounded-lg shadow-md p-8 ${
          darkMode ? 'bg-dark-surface border border-dark-border' : 'bg-white'
        }`}>
          {/* Auth0 Login Button */}
          <div className="space-y-4">
            <button
              onClick={handleAuth0Login}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              {isLogin ? 'Sign in with Auth0' : 'Sign up with Auth0'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${darkMode ? 'border-dark-border' : 'border-gray-300'}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${darkMode ? 'bg-dark-surface text-gray-400' : 'bg-white text-gray-500'}`}>
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                      darkMode 
                        ? 'bg-dark-bg border-dark-border text-dark-text' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="Full Name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    darkMode 
                      ? 'bg-dark-bg border-dark-border text-dark-text' 
                      : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="Email address"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`relative block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    darkMode 
                      ? 'bg-dark-bg border-dark-border text-dark-text' 
                      : 'border-gray-300 text-gray-900'
                  }`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                      darkMode 
                        ? 'bg-dark-bg border-dark-border text-dark-text' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="Confirm Password"
                  />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {isLogin ? 'Sign in with Email' : 'Sign up with Email'}
                </button>
              </div>
            </form>

            {isLogin && (
              <div className="text-center">
                <button className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          By {isLogin ? 'signing in' : 'signing up'}, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;