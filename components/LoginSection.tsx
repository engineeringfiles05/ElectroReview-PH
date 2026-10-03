'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  Zap,
  BookOpen,
  Award,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
  School,
  Calendar,
  LogOut,
  KeyRound,
  RotateCcw,
  Clock,
  Compass
} from 'lucide-react';
import { RevieweeUser } from '@/lib/types';
import { safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageRemove } from '@/lib/storage';

interface LoginSectionProps {
  currentUser: RevieweeUser | null;
  onLoginSuccess: (user: RevieweeUser) => void;
  onLogout: () => void;
  onNavigateToQuiz: () => void;
  onClose?: () => void;
}

export function LoginSection({
  currentUser,
  onLoginSuccess,
  onLogout,
  onNavigateToQuiz,
  onClose
}: LoginSectionProps) {
  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  React.useEffect(() => {
    const rememberedEmail = safeLocalStorageGet('electroreview_remembered_email', '');
    if (rememberedEmail) {
      setLoginEmail(rememberedEmail);
    }
    const rememberedPref = safeLocalStorageGet('electroreview_remember_me', 'true');
    if (rememberedPref !== null) {
      setRememberMe(rememberedPref === 'true');
    }
  }, []);

  // Form Fields - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTrack, setRegTrack] = useState<'REE' | 'RME' | 'BOTH'>('REE');
  const [regBatch, setRegBatch] = useState('April 2026 PRC Board Exam');
  const [regSchool, setRegSchool] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'enter_email' | 'enter_code' | 'new_password' | 'done'>('enter_email');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Handle Quick Demo Login
  const handleQuickDemo = (type: 'ree' | 'rme' | 'admin') => {
    setIsLoading(true);
    setErrorMessage('');
    
    setTimeout(() => {
      let demoUser: RevieweeUser;
      if (type === 'ree') {
        demoUser = {
          id: 'user-demo-ree-2026',
          name: 'Engr. Juan Dela Cruz',
          email: 'demo.ree@electroreview.ph',
          track: 'REE',
          targetExamBatch: 'April 2026 PRC Board Exam',
          role: 'member',
          joinedDate: '2026-01-15',
          streakDays: 14,
          solvedQuestionsCount: 184,
          schoolOrReviewCenter: 'University of Santo Tomas / Excel Review'
        };
      } else if (type === 'rme') {
        demoUser = {
          id: 'user-demo-rme-2026',
          name: 'Elena Ramos',
          email: 'demo.rme@electroreview.ph',
          track: 'RME',
          targetExamBatch: 'September 2026 PRC Board Exam',
          role: 'member',
          joinedDate: '2026-02-10',
          streakDays: 8,
          solvedQuestionsCount: 96,
          schoolOrReviewCenter: 'Mapua University / Powerline Review'
        };
      } else {
        demoUser = {
          id: 'user-admin-epc',
          name: 'Engr. Angelo Perfecto, PECE/REE',
          email: 'admin@electroreview.ph',
          track: 'BOTH',
          targetExamBatch: 'Review Director & Head Mentor',
          role: 'admin',
          joinedDate: '2025-08-01',
          streakDays: 45,
          solvedQuestionsCount: 650,
          schoolOrReviewCenter: 'PRC Board Review Master Faculty'
        };
      }

      if (rememberMe) {
        safeLocalStorageSet('electroreview_remembered_email', demoUser.email);
        safeLocalStorageSet('electroreview_remember_me', 'true');
      } else {
        safeLocalStorageRemove('electroreview_remembered_email');
        safeLocalStorageSet('electroreview_remember_me', 'false');
      }

      safeLocalStorageSet('electroreview_user', JSON.stringify(demoUser));
      setIsLoading(false);
      setSuccessMessage(`Welcome back, ${demoUser.name}!`);
      onLoginSuccess(demoUser);
    }, 450);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your candidate email address.');
      return;
    }
    if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your reviewee account password.');
      return;
    }
    if (loginPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Create or retrieve candidate profile
      const nameFromEmail = loginEmail.split('@')[0].replace(/[._]/g, ' ');
      const capitalizedName = nameFromEmail
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const isAdmin = loginEmail.toLowerCase().includes('admin');

      const user: RevieweeUser = {
        id: `user-${Date.now()}`,
        name: isAdmin ? `Engr. ${capitalizedName}` : capitalizedName,
        email: loginEmail.trim().toLowerCase(),
        track: loginEmail.toLowerCase().includes('rme') ? 'RME' : 'REE',
        targetExamBatch: 'April 2026 PRC Board Exam',
        role: isAdmin ? 'admin' : 'member',
        joinedDate: new Date().toISOString().split('T')[0],
        streakDays: 3,
        solvedQuestionsCount: 25,
        schoolOrReviewCenter: 'PRC Licensure Reviewee Candidate'
      };

      if (rememberMe) {
        safeLocalStorageSet('electroreview_remembered_email', loginEmail.trim().toLowerCase());
        safeLocalStorageSet('electroreview_remember_me', 'true');
      } else {
        safeLocalStorageRemove('electroreview_remembered_email');
        safeLocalStorageSet('electroreview_remember_me', 'false');
      }

      safeLocalStorageSet('electroreview_user', JSON.stringify(user));
      setIsLoading(false);
      setSuccessMessage(`Welcome, ${user.name}! Successfully signed in.`);
      onLoginSuccess(user);
    }, 600);
  };

  // Submit Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please enter your complete name as filed with the PRC.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage('Please provide a valid reviewee email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('Please agree to the PRC Board Review Honor Code & Terms of Service.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newUser: RevieweeUser = {
        id: `user-reg-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        track: regTrack,
        targetExamBatch: regBatch,
        role: 'member',
        joinedDate: new Date().toISOString().split('T')[0],
        streakDays: 1,
        solvedQuestionsCount: 0,
        schoolOrReviewCenter: regSchool.trim() || 'Self-Review Candidate'
      };

      safeLocalStorageSet('electroreview_user', JSON.stringify(newUser));
      if (rememberMe) {
        safeLocalStorageSet('electroreview_remembered_email', newUser.email);
        safeLocalStorageSet('electroreview_remember_me', 'true');
      }

      setIsLoading(false);
      setSuccessMessage(`Account created for ${newUser.name}! Starting your board exam preparation...`);
      onLoginSuccess(newUser);
    }, 700);
  };

  // If already logged in, show Candidate Profile and Portal Status
  if (currentUser) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-[#111116] border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header with Official Logo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1.5 shadow-xl border border-white/20 shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="ElectroReview PH Official Logo"
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentUser.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {currentUser.track} Candidate
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {currentUser.role === 'admin' ? 'Faculty Admin' : 'Reviewee'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentUser.email}</span>
                  {currentUser.schoolOrReviewCenter && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 text-xs">{currentUser.schoolOrReviewCenter}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-amber-400 font-semibold mt-1">
                  Target: {currentUser.targetExamBatch}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8 relative z-10">
            <div className="bg-[#18181f] border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Study Streak
              </span>
              <span className="text-2xl font-black text-amber-400">
                {currentUser.streakDays} Days
              </span>
              <span className="text-[10px] text-slate-500">Active daily practice</span>
            </div>

            <div className="bg-[#18181f] border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Solved Questions
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {currentUser.solvedQuestionsCount} Qs
              </span>
              <span className="text-[10px] text-slate-500">Board exams answered</span>
            </div>

            <div className="bg-[#18181f] border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                PRC Licensure Goal
              </span>
              <span className="text-2xl font-black text-indigo-300">
                {currentUser.track}
              </span>
              <span className="text-[10px] text-slate-500">Board Exam Syllabi</span>
            </div>

            <div className="bg-[#18181f] border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Account Status
              </span>
              <span className="text-2xl font-black text-cyan-300">
                Active
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Verified Candidate</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onNavigateToQuiz}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Resume Board Exam Review &amp; Whiteboard Solvers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm rounded-xl transition-all border border-white/10 cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-4 sm:px-6 relative">
      {/* Background Blueprint Grid Decor */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none rounded-3xl"
        style={{
          backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.25) 1px, transparent 1px), radial-gradient(rgba(99, 102, 241, 0.25) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      {/* Main Container Card */}
      <div className="bg-[#111116] border border-amber-500/25 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 backdrop-blur-xl">
        
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-600" />

        {/* Card Header with Branding */}
        <div className="p-6 sm:p-8 text-center border-b border-white/5 relative">
          {/* Circuit Traces Decorative Badges */}
          <div className="absolute top-4 left-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-mono text-amber-300">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>230V / 60Hz PEC</span>
          </div>

          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-300">
            <Award className="w-3 h-3 text-indigo-400" />
            <span>PRC REE &amp; RME</span>
          </div>

          {/* Official Brand Logo */}
          <div className="inline-block relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl p-2 shadow-2xl shadow-amber-500/15 border-2 border-white/40 flex items-center justify-center mx-auto">
              <img
                src="/logo.png"
                alt="ElectroReview PH Official Logo"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-[#111116] flex items-center justify-center shadow-md">
              <Zap className="w-3.5 h-3.5 text-black fill-black" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>ElectroReview</span>
            <span className="text-amber-400">PH</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Your Partner in REE &amp; RME Board Exam Preparation
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Interactive licensure reviewer portal with step-by-step whiteboard derivations and formula notebooks
          </p>

          {/* Tab Switcher */}
          <div className="mt-6 p-1 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Reviewee Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {/* Notification Alerts */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Candidate Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    autoComplete="email"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-amber-500 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setShowForgotModal(true);
                      setForgotStep('enter_email');
                      setForgotMessage('');
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-amber-500 focus:bg-white/[0.06] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Remember me on this review device</span>
                </label>
              </div>

              {/* Prominent Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all shadow-[0_10px_25px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Reviewee Credentials...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Sign In to Reviewee Portal</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* One-Click Quick Demo Accounts for Evaluators */}
              <div className="pt-4 border-t border-white/10">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                  ⚡ Fast Access • One-Click Candidate Profiles
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('ree')}
                    className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-wider">
                      REE Candidate
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-amber-200 block truncate">
                      Engr. Juan D.
                    </span>
                    <span className="text-[9px] text-slate-400 block">184 Solved • 14d Streak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('rme')}
                    className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-indigo-300 block uppercase tracking-wider">
                      RME Candidate
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-200 block truncate">
                      Elena Ramos
                    </span>
                    <span className="text-[9px] text-slate-400 block">96 Solved • 8d Streak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Faculty / Admin
                    </span>
                    <span className="text-xs font-semibold text-white group-hover:text-slate-200 block truncate">
                      Engr. Perfecto
                    </span>
                    <span className="text-[9px] text-emerald-400 block">All Board Privileges</span>
                  </button>
                </div>
              </div>

              {/* Bottom Switch Link */}
              <div className="text-center pt-2 text-xs text-slate-400">
                New candidate to ElectroReview PH?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Create an Account / Sign Up
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Complete Name (as filed with PRC)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Engr. Maria Santos"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* PRC Licensure Track Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target PRC Licensure Exam
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegTrack('REE')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regTrack === 'REE'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">REE</span>
                    <span className="block text-[9px] text-slate-400">Electrical Engr</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegTrack('RME')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regTrack === 'RME'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">RME</span>
                    <span className="block text-[9px] text-slate-400">Master Electrician</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegTrack('BOTH')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regTrack === 'BOTH'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">Both</span>
                    <span className="block text-[9px] text-slate-400">Dual Candidate</span>
                  </button>
                </div>
              </div>

              {/* Target Batch & School */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Exam Batch
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={regBatch}
                      onChange={(e) => setRegBatch(e.target.value)}
                      className="w-full bg-[#18181f] border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="April 2026 PRC Board Exam">April 2026 PRC Board</option>
                      <option value="September 2026 PRC Board Exam">September 2026 PRC Board</option>
                      <option value="April 2027 PRC Board Exam">April 2027 PRC Board</option>
                      <option value="Self-Paced Comprehensive Review">Self-Paced Comprehensive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    School / Review Center
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <School className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="e.g., UST / Excel / TIP"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    autoComplete="email"
                    className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showRegPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <div
                    onClick={() => setAgreedTerms(!agreedTerms)}
                    className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                      agreedTerms
                        ? 'bg-indigo-600 border-indigo-600 text-white font-black'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {agreedTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    I agree to the PRC Board Review Honor Code, Electrical Engineering Code of Ethics, and Platform Terms of Service.
                  </span>
                </label>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 transition-all shadow-[0_10px_25px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Registering PRC Candidate Profile...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Create Account &amp; Start Reviewing</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Switch Link */}
              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered with ElectroReview PH?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Sign In to Reviewee Portal
                </button>
              </div>
            </form>
          )}

          {/* Educational Accreditation Footer Note */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>PRC Licensure Accredited Review Content • REE &amp; RME Syllabi • Philippine Electrical Code (PEC) 2017</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121217] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Candidate Password</h3>
                    <p className="text-xs text-slate-400">ElectroReview PH Candidate Recovery</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4">
                {forgotMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                    {forgotMessage}
                  </div>
                )}

                {forgotStep === 'enter_email' && (
                  <>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Enter your registered reviewee email address. We will verify your candidate records and dispatch a 6-digit recovery code.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                        Reviewee Email
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={() => {
                        if (!forgotEmail.includes('@')) {
                          setForgotMessage('Please enter a valid candidate email.');
                          return;
                        }
                        setForgotLoading(true);
                        setTimeout(() => {
                          setForgotLoading(false);
                          setForgotStep('enter_code');
                          setForgotMessage('Verification code dispatched! For this demonstration, your simulated PRC code is: 849201');
                        }, 600);
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Recovery Code</span>}
                    </button>
                  </>
                )}

                {forgotStep === 'enter_code' && (
                  <>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Please enter the 6-digit code sent to your email. (Demo Code: <strong className="text-amber-400 font-mono">849201</strong>)
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                        6-Digit Recovery Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        placeholder="849201"
                        className="w-full text-center tracking-[0.5em] font-mono font-bold bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-3 text-lg text-amber-300 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (recoveryCode.trim() === '849201' || recoveryCode.trim().length === 6) {
                          setForgotStep('new_password');
                          setForgotMessage('Code verified! Enter your new password below.');
                        } else {
                          setForgotMessage('Invalid code. Please use the simulated demo code: 849201');
                        }
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Verify Code
                    </button>
                  </>
                )}

                {forgotStep === 'new_password' && (
                  <>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Create a strong new password for your reviewee account.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (newPassword.length < 6) {
                          setForgotMessage('Password must be at least 6 characters long.');
                          return;
                        }
                        setForgotStep('done');
                        setLoginPassword(newPassword);
                        setForgotMessage('Password successfully updated! You can now sign in.');
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Save New Password
                    </button>
                  </>
                )}

                {forgotStep === 'done' && (
                  <div className="text-center py-2 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">
                      Your candidate password has been reset successfully.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
