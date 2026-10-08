import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, Store, CheckCircle2, Globe } from 'lucide-react';
import { LanguageCode } from '../types';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { api } from '../lib/api';
import { Spatial3DCard, Hologram3DOrb } from './Spatial3DWidgets';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { getLanguageInfo } from '../utils/languages';
import { useTranslation } from '../contexts/LanguageContext';

interface AuthViewProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onLogin: (role: 'wholesale' | 'retail' | 'customer', token?: string) => void;
}

export function AuthView({ language, onLanguageChange, onLogin }: AuthViewProps) {
  const { t, isRTL } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'wholesale' | 'retail' | 'customer'>('retail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    try {
      setIsSendingEmail(true);
      if (response.credential) {
        // Send a request to our backend to send the welcome email
        await api('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential, role })
        });
      }
      onLogin(role);
    } catch (error) {
      console.error('Failed to process Google Login:', error);
      setError('Google Login backend validation failed. Please check your credentials.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    setError('Google OAuth Failed. Please check your VITE_GOOGLE_CLIENT_ID.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      const response = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      localStorage.setItem('urimaiyalar_token', data.token);
      onLogin(data.user.role, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500 bg-slate-950">
      
      {/* Full Page Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/auth-hero.jpg" 
          alt="South Indian business owner using AI" 
          className="w-full h-full object-cover opacity-90"
        />
        {/* Dark overlay to ensure form and text are readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-900/90" />
        <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay" />
      </div>

      {/* Top Language Toggle (EN, தமிழ், 22 Languages) */}
      <div className="absolute top-6 right-6 z-50">
        <div className="flex items-center gap-1 bg-slate-900/90 rounded-xl border border-slate-700/80 p-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              language === 'en' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-200 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('ta')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              language === 'ta' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-200 hover:text-white'
            }`}
          >
            தமிழ்
          </button>
          <button
            onClick={() => setIsLangModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              language !== 'en' && language !== 'ta'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {language !== 'en' && language !== 'ta'
                ? getLanguageInfo(language).nativeName
                : '22 மொழிகள்'}
            </span>
          </button>
        </div>
      </div>

      {/* Top Left Branding */}
      <div className="absolute top-6 left-6 lg:top-12 lg:left-12 z-50 flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-2xl">
              URIMAIYALAR OS
            </h1>
            <p className="text-xs font-bold text-cyan-400 tracking-wide uppercase">
              Spatial 3D Business Intelligence
            </p>
          </div>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-slate-200 leading-tight drop-shadow-2xl max-w-xl">
          {t('auth.aiPowered')}
        </h2>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 z-10 items-center mt-20 lg:mt-0" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Empty left side to allow background visibility and push form to right */}
        <div className="hidden lg:block"></div>

        {/* Auth Form with 3D Spatial Tilt Card */}
        <div className="w-full max-w-md mx-auto relative">
          <Spatial3DCard depth={12} className="w-full">
            {/* Crisp High-Contrast Card */}
            <div className="relative bg-[#0c1322] border border-blue-500/40 p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
              
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 style={{ transform: 'translateZ(20px)' }} className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                    {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
                  </h2>
                  <p style={{ transform: 'translateZ(10px)' }} className="text-cyan-200/80 mt-1 text-xs font-semibold">
                    {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                  </p>
                </div>
                <Hologram3DOrb size={44} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Google OAuth Button */}
                <div style={{ transform: 'translateZ(15px)' }} className="flex justify-center w-full min-h-[50px] relative mt-2 mb-4">
                  {isSendingEmail && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-xs text-cyan-300 font-bold tracking-wider">VERIFYING...</p>
                    </div>
                  )}
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width="100%"
                  />
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative bg-slate-900 px-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold rounded-full">
                    {t('auth.orContinueWith')}
                  </div>
                </div>

                {/* Role Selection */}
                <div style={{ transform: 'translateZ(12px)' }} className="flex p-1 bg-black/40 rounded-xl border border-white/10 backdrop-blur-sm mb-4">
                  <button
                    type="button"
                    onClick={() => setRole('wholesale')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${role === 'wholesale' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t('auth.roleWholesale')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('retail')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${role === 'retail' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t('auth.roleRetail')}
                  </button>
                </div>

                {/* Email & Password Fields */}
                <div style={{ transform: 'translateZ(10px)' }} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-400" />
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{t('auth.emailLabel')}</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all backdrop-blur-sm"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">{t('auth.passwordLabel')}</label>
                      <a href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                        {t('auth.forgotPassword')}
                      </a>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/15 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all backdrop-blur-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary 3D Tactile Login Button */}
                <div style={{ transform: 'translateZ(18px)' }}>
                  <button
                    type="submit"
                    className="btn-3d-primary w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all mt-4"
                  >
                    <span>{isLogin ? t('buttons.login') : t('buttons.register')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative pt-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center pt-4">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative mt-4 bg-slate-900 px-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold rounded-full">
                    {t('auth.demoQuickLogin')}
                  </div>
                </div>

                <div style={{ transform: 'translateZ(14px)' }}>
                  <button
                    type="button"
                    onClick={() => onLogin(role)}
                    className="w-full bg-white/5 hover:bg-white/10 text-cyan-300 font-bold py-3.5 px-4 rounded-xl border border-cyan-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md"
                  >
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>{t('auth.demoQuickLogin')}</span>
                  </button>
                </div>

              </form>

              <div className="mt-6 text-center text-xs font-medium text-slate-300">
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                  }}
                  className="text-white hover:text-cyan-300 transition-colors font-bold underline decoration-cyan-400/50 underline-offset-4"
                >
                  {isLogin ? t('auth.signUpLink') : t('auth.loginLink')}
                </button>
              </div>
              
            </div>
          </Spatial3DCard>
        </div>
      </div>

      {/* Bottom badge */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
        <div className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-xs font-bold text-emerald-100 shadow-2xl">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Secured by URIMAIYALAR OS Enterprise</span>
        </div>
      </div>

      {/* 22 Indian Languages Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        currentLanguage={language}
        onSelect={onLanguageChange}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
}
