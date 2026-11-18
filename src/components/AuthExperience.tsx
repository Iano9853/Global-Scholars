import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { AuthScreen } from '../types/program';

interface AuthExperienceProps {
  screen: Exclude<AuthScreen, null | 'onboarding' | 'matching'>;
  contextMessage?: string | null;
  pendingVerifyEmail?: string;
  onSwitchScreen: (next: Exclude<AuthScreen, null | 'onboarding' | 'matching'>) => void;
  onBackToBrowse: () => void;
  onGoogleAuthenticated: (
    firebaseUser: User,
    mode: 'login' | 'signup'
  ) => Promise<{ ok: boolean; error?: string }>;
  onEmailVerificationSent: (email: string) => void;
  onEmailVerifiedAndReady: (firebaseUser: User) => Promise<void>;
  onEmailPasswordLoggedIn: (
    firebaseUser: User
  ) => Promise<{ ok: boolean; error?: string }>;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  if (!password) {
    return {
      score: 0,
      label: 'Enter a password',
      barColor: 'bg-slate-200',
      textColor: 'text-slate-400',
    };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Weak — add 8+ chars & numbers',
      barColor: 'bg-red-500',
      textColor: 'text-red-600',
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Fair — add uppercase or symbol',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700',
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: 'Good password',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    };
  }
  return {
    score: 4,
    label: 'Strong password',
    barColor: 'bg-emerald-600',
    textColor: 'text-emerald-700',
  };
}

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';

  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters long.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in window was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the Google sign-in popup. Please allow popups for this site and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${host}" is not authorized for Firebase sign-in yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). You can use Continue with Google or enable Email/Password in Firebase Console.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
}

const GoogleButton: React.FC<{
  onClick: () => void;
  label: string;
  disabled?: boolean;
}> = ({ onClick, label, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-[#0C2340] font-semibold text-[14px] flex items-center justify-center gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
  >
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
    <span>{label}</span>
  </button>
);

export const AuthExperience: React.FC<AuthExperienceProps> = ({
  screen,
  contextMessage,
  pendingVerifyEmail,
  onSwitchScreen,
  onBackToBrowse,
  onGoogleAuthenticated,
  onEmailVerificationSent,
  onEmailVerifiedAndReady,
  onEmailPasswordLoggedIn,
}) => {
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(60);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [checkingVerify, setCheckingVerify] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loginError, setLoginError] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const strength = useMemo(() => getPasswordStrength(signupPassword), [signupPassword]);

  const activeVerifyEmail =
    pendingVerifyEmail || auth.currentUser?.email || signupEmail;

  // Countdown timer on verify-email screen
  useEffect(() => {
    if (screen !== 'verify-email') return;
    setResendSeconds(60);
    setVerifyFeedback('');
  }, [screen]);

  useEffect(() => {
    if (screen !== 'verify-email' || resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, resendSeconds]);

  // Automatic polling every 3s to detect when user clicks the real email verification link
  useEffect(() => {
    if (screen !== 'verify-email') return;

    const pollTimer = window.setInterval(async () => {
      const current = auth.currentUser;
      if (!current) return;
      try {
        await current.reload();
        if (current.emailVerified) {
          window.clearInterval(pollTimer);
          await current.getIdToken(true);
          await onEmailVerifiedAndReady(current);
        }
      } catch {
        // Ignore transient reload error while waiting for link click
      }
    }, 3000);

    return () => window.clearInterval(pollTimer);
  }, [screen, onEmailVerifiedAndReady]);

  const handleGoogleClick = async () => {
    setSignupError('');
    setLoginError('');
    setIsSubmitting(true);
    const mode = screen === 'signup' ? 'signup' : 'login';
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const res = await onGoogleAuthenticated(cred.user, mode);
      if (!res.ok) {
        if (mode === 'signup') setSignupError(res.error ?? 'Could not complete sign up.');
        else setLoginError(res.error ?? 'No account found. Please sign up first.');
      }
    } catch (err) {
      const message = mapFirebaseAuthError(err);
      if (mode === 'signup') setSignupError(message);
      else setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setSignupError('Please enter your full legal name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    if (!agreedTerms) {
      setSignupError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setSignupError('');
    setIsSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword
      );
      await updateProfile(cred.user, { displayName: fullName.trim() });
      await sendEmailVerification(cred.user, {
        url: window.location.origin,
      });
      onEmailVerificationSent(signupEmail.trim());
    } catch (err) {
      setSignupError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualVerifyCheck = async () => {
    const current = auth.currentUser;
    if (!current) {
      setVerifyFeedback('Session expired. Please sign up or log in again.');
      return;
    }
    setCheckingVerify(true);
    setVerifyFeedback('');
    try {
      await current.reload();
      if (current.emailVerified) {
        await current.getIdToken(true);
        await onEmailVerifiedAndReady(current);
      } else {
        setVerifyFeedback(
          'Not verified yet. Open the verification email in your inbox and click the link first.'
        );
      }
    } catch (err) {
      setVerifyFeedback(mapFirebaseAuthError(err));
    } finally {
      setCheckingVerify(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || !auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin,
      });
      setResendSeconds(60);
      setVerifyFeedback(`Fresh verification link sent to ${activeVerifyEmail}.`);
    } catch (err) {
      setVerifyFeedback(mapFirebaseAuthError(err));
    }
  };

  const handleChangeEmailFromVerify = async () => {
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await signOut(auth);
      }
    } catch {
      // ignore
    }
    onSwitchScreen('signup');
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Incorrect email or password.');
      return;
    }
    setLoginError('');
    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        loginEmail.trim(),
        loginPassword
      );
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user, { url: window.location.origin }).catch(
          () => {}
        );
        onEmailVerificationSent(cred.user.email ?? loginEmail.trim());
        return;
      }
      const res = await onEmailPasswordLoggedIn(cred.user);
      if (!res.ok) {
        setLoginError(res.error ?? 'No account found. Please sign up first.');
      }
    } catch (err) {
      setLoginError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetError('');
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      // Never leak whether email exists for security
      if (code === 'auth/user-not-found') {
        setResetSent(true);
      } else {
        setResetError(mapFirebaseAuthError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Panel (45% width — Brand & Value Trust Panel in Deep Navy #0F1E36) */}
      <aside className="lg:w-[45%] bg-[#0F1E36] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBackToBrowse}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59E16] rounded-md"
            >
              <span className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="font-display font-bold text-[17px] tracking-tight text-white">
                ScholarWork Global
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToBrowse}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Browse</span>
            </button>
          </div>

          <div className="mt-10 lg:mt-16 max-w-md">
            <h1 className="font-display font-extrabold text-[26px] sm:text-[34px] leading-[1.18] tracking-tight text-white [text-wrap:balance]">
              One Profile. Verified Global Scholarships &amp; Paid Work-Study.
            </h1>

            <ul className="mt-7 space-y-4">
              <li className="flex items-start gap-3 text-[14px] sm:text-[15px] text-slate-200 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span>Filter out domestic-only aid automatically based on your passport.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] sm:text-[15px] text-slate-200 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span>Store your transcripts, CV, and essays in an encrypted vault.</span>
              </li>
              <li className="flex items-start gap-3 text-[14px] sm:text-[15px] text-slate-200 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span>Track deadlines across UC Berkeley, Waterloo, and 200+ institutions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-10 pt-6 border-t border-white/10 flex items-center gap-2.5 text-[13px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#E59E16] shrink-0" aria-hidden="true" />
          <span>Every listing verified against official .edu and .ac policies</span>
        </div>
      </aside>

      {/* Right Panel (55% width — Clean White Registration / Login Surface) */}
      <main className="lg:w-[55%] flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white">
        <div className="w-full max-w-[460px]">
          {contextMessage && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-[13px] text-[#0C2340] font-medium">
              {contextMessage}
            </div>
          )}

          {/* SIGN UP SCREEN A */}
          {screen === 'signup' && (
            <div>
              <h2 className="font-display font-bold text-[24px] sm:text-[26px] text-[#0C2340] tracking-tight">
                Create your free student account
              </h2>
              <p className="mt-1.5 text-[14px] text-slate-600">
                Sign up with your Google account or register with your email.
              </p>

              <div className="mt-6">
                <GoogleButton
                  label={isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
                  disabled={isSubmitting}
                  onClick={handleGoogleClick}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-[12px] font-medium text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                <span>or register with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleSignupFormSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-[13px] font-semibold text-[#0C2340] mb-1"
                  >
                    Full Legal Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setSignupError('');
                    }}
                    placeholder="Your legal name"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                  />
                  <p className="mt-1 text-[12px] text-slate-500">
                    Enter your name as it appears on your passport or national ID
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-[13px] font-semibold text-[#0C2340] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      setSignupError('');
                    }}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-[13px] font-semibold text-[#0C2340] mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setSignupError('');
                      }}
                      placeholder="Create a strong password"
                      className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0C2340] cursor-pointer"
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Live Password Strength Indicator */}
                  <div className="mt-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((segment) => (
                        <div
                          key={segment}
                          className={`h-1.5 rounded-full transition-colors ${
                            strength.score >= segment ? strength.barColor : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 text-[12px] font-medium ${strength.textColor}`}>
                      {strength.label}
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      setSignupError('');
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#0C2340] cursor-pointer"
                  />
                  <span className="text-[12.5px] text-slate-600 leading-snug">
                    I agree to the{' '}
                    <span className="font-semibold text-[#0C2340]">Terms of Service</span> and{' '}
                    <span className="font-semibold text-[#0C2340]">Privacy Policy</span> regarding
                    secure storage of my academic records.
                  </span>
                </label>

                {signupError && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-[#FCE8E6] border border-red-200 text-[13px] text-[#8A1C17] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-[#E59E16] hover:bg-[#D48E0D] disabled:opacity-60 text-[#0C2340] font-display font-bold text-[15px] transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-[14px] text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchScreen('login')}
                  className="font-semibold text-[#0C2340] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </div>
          )}

          {/* SIGN UP SCREEN B: REAL EMAIL VERIFICATION GATE */}
          {screen === 'verify-email' && (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0C2340]/8 text-[#0C2340] flex items-center justify-center">
                <Mail className="w-6 h-6" aria-hidden="true" />
              </div>

              <h2 className="mt-5 font-display font-bold text-[26px] text-[#0C2340] tracking-tight">
                Check your inbox
              </h2>
              <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">
                We sent a real verification link to{' '}
                <strong className="font-semibold text-[#0C2340]">{activeVerifyEmail}</strong>.
                Open that email and click the verification link—this page will automatically
                detect when your email is verified and unlock your profile setup.
              </p>

              <div className="mt-4 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-[13px] text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#0C2340] shrink-0" />
                <span>Waiting for verification link click in your inbox...</span>
              </div>

              {verifyFeedback && (
                <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{verifyFeedback}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleManualVerifyCheck}
                  disabled={checkingVerify}
                  className="w-full h-11 rounded-lg bg-[#0C2340] hover:bg-[#16365E] disabled:opacity-60 text-white font-display font-bold text-[14px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${checkingVerify ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    {checkingVerify ? 'Checking Verification...' : 'Check Verification Status'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendSeconds > 0}
                  className={`w-full h-11 rounded-lg border text-[14px] font-semibold transition-colors ${
                    resendSeconds > 0
                      ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-300 text-[#0C2340] bg-white hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {resendSeconds > 0
                    ? `Resend verification link (${resendSeconds}s)`
                    : 'Resend verification link'}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={handleChangeEmailFromVerify}
                  className="font-semibold text-[#1D4E89] hover:underline cursor-pointer"
                >
                  Change email address
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchScreen('login')}
                  className="text-slate-500 hover:text-[#0C2340] cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </div>
          )}

          {/* LOG IN SCREEN A */}
          {screen === 'login' && (
            <div>
              <h2 className="font-display font-bold text-[24px] sm:text-[26px] text-[#0C2340] tracking-tight">
                Welcome back to ScholarWork Global
              </h2>
              <p className="mt-1.5 text-[14px] text-slate-600">
                Access your saved universities, deadline tracker, and Document Vault.
              </p>

              <div className="mt-6">
                <GoogleButton
                  label={isSubmitting ? 'Opening Google...' : 'Continue with Google'}
                  disabled={isSubmitting}
                  onClick={handleGoogleClick}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-[12px] font-medium text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                <span>or log in with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Error Banner (#FCE8E6) */}
              {loginError && (
                <div
                  role="alert"
                  className="mb-4 px-4 py-3 rounded-lg bg-[#FCE8E6] border border-red-200 text-[13px] text-[#8A1C17] flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span>{loginError} </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginEmail);
                        setResetSent(false);
                        setResetError('');
                        onSwitchScreen('forgot-password');
                      }}
                      className="font-semibold underline hover:no-underline cursor-pointer"
                    >
                      Need to reset your password?
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginFormSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[13px] font-semibold text-[#0C2340] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="login-password"
                      className="text-[13px] font-semibold text-[#0C2340]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginEmail);
                        setResetSent(false);
                        setResetError('');
                        onSwitchScreen('forgot-password');
                      }}
                      className="text-[12.5px] font-semibold text-[#1D4E89] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0C2340] cursor-pointer"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#0C2340] cursor-pointer"
                  />
                  <span className="text-[13px] text-slate-600">
                    Keep me logged in on this device
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-[#0C2340] hover:bg-[#16365E] disabled:opacity-60 text-white font-display font-bold text-[15px] transition-colors cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Logging In...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-[14px] text-slate-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchScreen('signup')}
                  className="font-semibold text-[#0C2340] hover:underline cursor-pointer"
                >
                  Sign up free
                </button>
              </p>
            </div>
          )}

          {/* FORGOT PASSWORD SCREEN B */}
          {screen === 'forgot-password' && (
            <div>
              <h2 className="font-display font-bold text-[24px] sm:text-[26px] text-[#0C2340] tracking-tight">
                Reset your password
              </h2>
              <p className="mt-1.5 text-[14px] text-slate-600">
                Enter the email address associated with your student account.
              </p>

              {resetSent ? (
                <div className="mt-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-start gap-2.5 text-[14px] text-emerald-900 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      If an account exists for <strong>{resetEmail}</strong>, we&apos;ve sent a
                      password reset link.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSwitchScreen('login')}
                    className="text-[13px] font-semibold text-[#0C2340] hover:underline cursor-pointer"
                  >
                    ← Back to Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-[13px] font-semibold text-[#0C2340] mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setResetError('');
                      }}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-[14px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                    />
                  </div>

                  {resetError && (
                    <div className="px-3.5 py-2.5 rounded-lg bg-[#FCE8E6] border border-red-200 text-[13px] text-[#8A1C17]">
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-lg bg-[#0C2340] hover:bg-[#16365E] text-white font-display font-bold text-[14px] transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => onSwitchScreen('login')}
                  className="text-[13px] font-semibold text-slate-600 hover:text-[#0C2340] cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
