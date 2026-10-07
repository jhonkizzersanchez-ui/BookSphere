import { useState } from 'react';
import type { Role } from '../App';
import { auth, ApiError } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

const roles: { id: Role; label: string; emoji: string; description: string; color: string; bg: string }[] = [
  { id: 'student', label: 'Student', emoji: '🎒', description: 'Find books, track reading, earn badges', color: '#2A9D8F', bg: '#E8F5F3' },
  { id: 'teacher', label: 'Teacher', emoji: '✏️', description: 'Monitor class reading & build lists', color: '#4361EE', bg: '#EEF0FD' },
  { id: 'librarian', label: 'Librarian', emoji: '🗂️', description: 'Manage the collection & reports', color: '#9B5DE5', bg: '#F3EEFF' },
];


type Screen = 'login' | 'signup' | 'signup-success' | 'forgot' | 'forgot-sent' | 'reset' | 'reset-success';

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 transition-all ${hasError ? 'border-[#E76F51] focus:ring-[#E76F51]/20' : 'border-[#E8EDF0] focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F]'}`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block" style={{ color: '#264653' }}>
        <span className="block text-xs font-semibold mb-1.5">{label}</span>
        {children}
      </label>
      {error && <p className="text-[11px] mt-1 font-medium" style={{ color: '#E76F51' }}>{error}</p>}
    </div>
  );
}

interface SignupForm {
  fullName: string;
  studentId: string;
  email: string;
  grade: string;
  classCode: string;
  staffId: string;
  password: string;
  confirmPassword: string;
}

const emptySignup: SignupForm = {
  fullName: '', studentId: '', email: '', grade: '', classCode: '', staffId: '', password: '', confirmPassword: '',
};

export default function Login({ onLogin }: LoginProps) {
  const [screen, setScreen] = useState<Screen>(() => new URLSearchParams(window.location.search).has('reset_token') ? 'reset' : 'login');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupRole, setSignupRole] = useState<Role>('student');
  const [signupForm, setSignupForm] = useState<SignupForm>(emptySignup);
  const [signupErrors, setSignupErrors] = useState<Partial<SignupForm>>({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [resetId, setResetId] = useState('');
  const [resetRole, setResetRole] = useState<Role>('student');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '');
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const sf = (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignupForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSignupErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<SignupForm> = {};
    if (!signupForm.fullName.trim())                            errs.fullName = 'Full name is required.';
    if (signupRole === 'student' && !signupForm.studentId.trim()) errs.studentId = 'Student ID is required.';
    if (!signupForm.email.trim())                             errs.email = 'School email is required.';
    if (signupRole === 'student' && !signupForm.grade)          errs.grade = 'Please select a grade.';
    if (signupRole === 'librarian' && !signupForm.staffId.trim()) errs.staffId = 'Staff ID is required.';
    if (!signupForm.password)                                    errs.password = 'Password is required.';
    else if (signupForm.password.length < 12 || !/[a-z]/i.test(signupForm.password) || !/\d/.test(signupForm.password)) errs.password = 'Use at least 12 characters with letters and numbers.';
    if (signupForm.password !== signupForm.confirmPassword)     errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setSignupErrors(errs); return; }
    setSignupLoading(true);
    setSignupError('');
    try {
      await auth.register({ ...signupForm, role: signupRole, fullName: signupForm.fullName.trim(), email: signupForm.email.trim(), studentId: signupForm.studentId.trim(), password_confirmation: signupForm.confirmPassword });
      setSignupForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setScreen('signup-success');
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : 'Registration failed.');
      if (error instanceof ApiError) {
        setSignupErrors(Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key === 'password_confirmation' ? 'confirmPassword' : key, messages[0]])));
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { setError('Please select your role first.'); return; }
    if (!username)     { setError(selectedRole === 'student' ? 'Please enter your Student ID.' : 'Please enter your username.'); return; }
    if (!password)     { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      onLogin(await auth.login(username, password));
    } catch (error) {
      setError(error instanceof ApiError ? error.errors.username?.[0] ?? error.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId.trim()) {
      setResetError('Please enter your registered school email.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await auth.forgotPassword(resetId);
      setScreen('forgot-sent');
    } catch (error) {
      setResetError(error instanceof ApiError ? error.errors.email?.[0] ?? error.message : 'Reset request failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      await auth.resetPassword(resetEmail, resetToken, newPassword, confirmNewPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      window.history.replaceState({}, '', window.location.pathname);
      setScreen('reset-success');
    } catch (error) {
      setResetError(error instanceof ApiError ? Object.values(error.errors)[0]?.[0] ?? error.message : 'Password reset failed.');
    } finally {
      setResetLoading(false);
    }
  };

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-5" style={{ backgroundColor: '#2A9D8F' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-5" style={{ backgroundColor: '#F4A261' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#2A9D8F' }}>
            📚
          </div>
          <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
            <span style={{ color: '#2A9D8F' }}>Book</span>
            <span style={{ color: '#F4A261' }}>Sphere</span>
          </h1>
          <p className="text-sm" style={{ color: '#6B8EA0' }}>Westview Academy Library System</p>
        </div>

        {/* ── LOGIN ── */}
        {screen === 'login' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-6">
              <p className="text-sm font-semibold mb-3" style={{ color: '#264653' }}>I am a…</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setError(''); }}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: selectedRole === role.id ? role.color : '#E8EDF0',
                      backgroundColor: selectedRole === role.id ? role.bg : 'white',
                    }}
                  >
                    <span className="text-xl">{role.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: selectedRole === role.id ? role.color : '#264653' }}>
                      {role.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedRole && (
                <p className="text-xs text-center mb-4 px-2 py-1.5 rounded-lg" style={{ color: selectedRoleData!.color, backgroundColor: selectedRoleData!.bg }}>
                  {selectedRoleData!.description}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                <div>
                  <label htmlFor="login-username" className="block text-xs font-semibold mb-1.5" style={{ color: '#264653' }}>
                    {selectedRole === 'student' ? 'Student ID or email' : 'School email or username'}
                  </label>
                  <input
                    type="text"
                    id="login-username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder={selectedRole === 'student' ? 'Enter Student ID or email' : 'Enter school email or username'}
                    autoComplete="username"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-semibold" style={{ color: '#264653' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setScreen('forgot'); setResetRole(selectedRole ?? 'student'); setResetError(''); setResetId(''); }}
                      className="text-xs font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: '#2A9D8F' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653] transition-colors text-xs"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-[#E76F51] bg-[#FEF0EE] px-3 py-2 rounded-lg">{error}</p>
                )}



                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: selectedRoleData?.color ?? '#2A9D8F' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Signing in…
                    </span>
                  ) : 'Sign In to BookSphere'}
                </button>
              </form>
            </div>

            {/* Create account link */}
            <p className="text-center text-sm mt-4" style={{ color: '#6B8EA0' }}>
              New to BookSphere?{' '}
              <button
                onClick={() => { setScreen('signup'); setSignupForm(emptySignup); setSignupErrors({}); }}
                className="font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#2A9D8F' }}
              >
                Create an account
              </button>
            </p>

          </>
        )}

        {/* ── SIGN UP ── */}
        {screen === 'signup' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-6">
            <button
              onClick={() => setScreen('login')}
              className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:opacity-70 transition-opacity"
              style={{ color: '#6B8EA0' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to sign in
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#E8F5F3' }}>
                ✨
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
                  Create your account
                </h2>
                <p className="text-xs" style={{ color: '#6B8EA0' }}>Join the Westview Academy library.</p>
              </div>
            </div>

            {/* Role selector */}
            <p className="text-xs font-semibold mb-2" style={{ color: '#264653' }}>I am a…</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { setSignupRole(role.id); setSignupErrors({}); }}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: signupRole === role.id ? role.color : '#E8EDF0',
                    backgroundColor: signupRole === role.id ? role.bg : 'white',
                  }}
                >
                  <span className="text-xl">{role.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: signupRole === role.id ? role.color : '#264653' }}>
                    {role.label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSignup} className="space-y-3">
              {/* Full name — all roles */}
              <Field label="Full Name" error={signupErrors.fullName}>
                <input
                  value={signupForm.fullName}
                  onChange={sf('fullName')}
                  placeholder="e.g. Jordan Lee"
                  className={inputCls(!!signupErrors.fullName)}
                />
              </Field>

              {/* Student fields */}
              {signupRole === 'student' && (
                <>
                  <Field label="Student ID" error={signupErrors.studentId}>
                    <input
                      value={signupForm.studentId}
                      onChange={sf('studentId')}
                      placeholder="e.g. 202407042"
                      className={inputCls(!!signupErrors.studentId)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Grade" error={signupErrors.grade}>
                      <select value={signupForm.grade} onChange={sf('grade')} className={inputCls(!!signupErrors.grade)}>
                        <option value="">Select grade</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={String(i + 1)}>Grade {i + 1}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Class (optional)">
                      <input
                        value={signupForm.classCode}
                        onChange={sf('classCode')}
                        placeholder="e.g. 7B"
                        className={inputCls(false)}
                      />
                    </Field>
                  </div>
                </>
              )}

              <Field label="School Email" error={signupErrors.email}>
                <input type="email" value={signupForm.email} onChange={sf('email')}
                  placeholder="Your school email" autoComplete="email" className={inputCls(!!signupErrors.email)} />
              </Field>
              {signupRole !== 'student' && (
                <>
                  {signupRole === 'librarian' && (
                    <Field label="Staff ID" error={signupErrors.staffId}>
                      <input
                        value={signupForm.staffId}
                        onChange={sf('staffId')}
                        placeholder="e.g. STAFF-2024-08"
                        className={inputCls(!!signupErrors.staffId)}
                      />
                    </Field>
                  )}
                </>
              )}

              {/* Password */}
              <Field label="Password" error={signupErrors.password}>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={sf('password')}
                  placeholder="12+ characters with letters and numbers"
                  className={inputCls(!!signupErrors.password)}
                />
              </Field>
              <Field label="Confirm Password" error={signupErrors.confirmPassword}>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={sf('confirmPassword')}
                  placeholder="Repeat your password"
                  className={inputCls(!!signupErrors.confirmPassword)}
                />
              </Field>

              {/* Approval note for staff */}
              {signupRole !== 'student' && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: '#EEF0FD' }}>
                  <span className="text-sm flex-shrink-0 mt-0.5">ℹ️</span>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#2B47CE' }}>
                    {signupRole === 'teacher'
                      ? 'Teacher accounts require approval from the school librarian before activation.'
                      : 'Librarian accounts require approval from an existing librarian.'}
                  </p>
                </div>
              )}

              {signupError && <p role="alert" className="text-xs text-[#E76F51] bg-[#FEF0EE] px-3 py-2 rounded-lg">{signupError}</p>}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: roles.find((r) => r.id === signupRole)?.color ?? '#2A9D8F' }}
              >
                {signupLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm mt-4" style={{ color: '#6B8EA0' }}>
              Already have an account?{' '}
              <button onClick={() => setScreen('login')} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#2A9D8F' }}>
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ── SIGN UP SUCCESS ── */}
        {screen === 'signup-success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: '#E8F5F3' }}>
                🎉
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm bg-white border-2 border-white shadow">
                {roles.find((r) => r.id === signupRole)?.emoji}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
              Account created!
            </h2>
            <p className="text-sm mb-1" style={{ color: '#264653' }}>
              Welcome to BookSphere, <strong>{signupForm.fullName || 'reader'}</strong>!
            </p>
            <p className="text-xs mb-6" style={{ color: '#6B8EA0' }}>
              {signupRole === 'student'
                ? 'Your account is ready. Sign in with your Student ID to start exploring the library.'
                : signupRole === 'teacher'
                ? 'Your account is pending librarian approval. Contact the library to activate it.'
                : 'Your account is pending approval from an existing librarian. Contact the library to activate it.'}
            </p>

            <div className="text-left space-y-2 mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F5F9FA' }}>
              {(signupRole === 'student'
                ? ['Account registered ✓', 'Sign in with your Student ID', 'Start borrowing books!']
                : ['Account request submitted ✓', 'Awaiting librarian approval', 'Sign in with your school email after approval']
              ).map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: roles.find((r) => r.id === signupRole)?.color ?? '#2A9D8F' }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs" style={{ color: '#264653' }}>{step}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setScreen('login'); setSignupForm(emptySignup); }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: roles.find((r) => r.id === signupRole)?.color ?? '#2A9D8F' }}
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {screen === 'forgot' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-6">
            <button
              onClick={() => setScreen('login')}
              className="flex items-center gap-1.5 text-sm font-medium mb-5 hover:opacity-70 transition-opacity"
              style={{ color: '#6B8EA0' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to sign in
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#FFF3E8' }}>
                🔑
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#264653' }}>
                  Forgot your password?
                </h2>
                <p className="text-xs" style={{ color: '#6B8EA0' }}>No worries — we will help you reset it.</p>
              </div>
            </div>

            {/* Role toggle */}
            <div className="flex gap-1 p-1 bg-[#F5F7F8] rounded-xl mb-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setResetRole(role.id); setResetError(''); }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: resetRole === role.id ? 'white' : 'transparent',
                    color: resetRole === role.id ? role.color : '#6B8EA0',
                    boxShadow: resetRole === role.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {role.emoji} {role.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <Field label="Registered school email" error={resetError}>
                <input type="email" value={resetId} onChange={e => { setResetId(e.target.value); setResetError(''); }}
                  required autoComplete="email" className={inputCls(!!resetError)} placeholder="Enter your registered email" />
              </Field>
              <p className="text-xs text-[#6B8EA0]">Use the email address you registered with. If you cannot access it, contact your librarian.</p>
              <button type="submit" disabled={resetLoading} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F] disabled:opacity-60">
                {resetLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </div>
        )}

        {screen === 'forgot-sent' && (
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-8 text-center">
            <h2 className="text-xl font-bold text-[#264653] mb-3">Reset link requested</h2>
            <p className="text-sm text-[#6B8EA0] mb-6">If an account exists for that email, a reset link has been requested. Check your inbox or contact the library.</p>
            <button onClick={() => setScreen('login')} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F]">Back to sign in</button>
          </div>
        )}
        {screen === 'reset' && (
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-6">
            <h2 className="text-xl font-bold text-[#264653] mb-4">Choose a new password</h2>
            <form onSubmit={handleNewPassword} className="space-y-4">
              <Field label="New password">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password" minLength={12} required className={inputCls(false)} placeholder="12+ characters with letters and numbers" />
              </Field>
              <Field label="Confirm password">
                <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password" required className={inputCls(false)} />
              </Field>
              {resetError && <p role="alert" className="text-xs text-[#E76F51]">{resetError}</p>}
              <button type="submit" disabled={resetLoading} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F] disabled:opacity-60">
                {resetLoading ? 'Updating…' : 'Update password'}
              </button>
            </form>
            <button onClick={() => { window.history.replaceState({}, '', window.location.pathname); setScreen('forgot'); }} className="mt-4 text-xs font-semibold text-[#2A9D8F]">Request a new reset link</button>
          </div>
        )}
        {screen === 'reset-success' && (
          <div className="bg-white rounded-2xl border border-[#E8EDF0] p-8 text-center">
            <h2 className="text-xl font-bold text-[#264653] mb-3">Password updated</h2>
            <p className="text-sm text-[#6B8EA0] mb-6">Sign in with your new password.</p>
            <button onClick={() => setScreen('login')} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F]">Back to sign in</button>
          </div>
        )}
      </div>
    </div>
  );
}
