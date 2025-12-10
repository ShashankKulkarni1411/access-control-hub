import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Sparkles, Mail, Lock, User, Loader2, Eye, EyeOff, Shield, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! You can now sign in.');
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: AppRole; label: string; color: string }[] = [
    { value: 'user', label: 'User', color: 'text-role-user' },
    { value: 'developer', label: 'Developer', color: 'text-role-developer' },
    { value: 'admin', label: 'Admin', color: 'text-role-admin' },
  ];

  return (
    <div className="min-h-screen workspace-layout flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 glow-effect mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-workspace-text">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-workspace-text-muted mt-2">
            {isLogin
              ? 'Sign in to access your workspace'
              : 'Start building with Access Control Hub'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-workspace animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-workspace-text mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-workspace-text-muted" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input-workspace pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-workspace-text mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-workspace-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={cn(
                    "input-workspace pl-10",
                    errors.email && "border-role-admin focus:ring-role-admin/50"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-role-admin mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-workspace-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-workspace-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={cn(
                    "input-workspace pl-10 pr-10",
                    errors.password && "border-role-admin focus:ring-role-admin/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-workspace-text-muted hover:text-workspace-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-role-admin mt-1">{errors.password}</p>
              )}
            </div>

            {/* Role Selector for Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-workspace-text mb-2">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Account Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="input-workspace flex items-center justify-between"
                  >
                    <span className={cn("font-medium", roles.find(r => r.value === selectedRole)?.color)}>
                      {roles.find(r => r.value === selectedRole)?.label}
                    </span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", showRoleDropdown && "rotate-180")} />
                  </button>
                  
                  {showRoleDropdown && (
                    <div className="absolute z-50 w-full mt-2 rounded-lg border border-workspace-border bg-workspace-panel shadow-lg">
                      {roles.map((roleOption) => (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(roleOption.value);
                            setShowRoleDropdown(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-workspace-border/50 first:rounded-t-lg last:rounded-b-lg transition-colors",
                            selectedRole === roleOption.value && "bg-primary/10"
                          )}
                        >
                          <span className={cn("font-medium", roleOption.color)}>{roleOption.label}</span>
                          <p className="text-xs text-workspace-text-muted mt-0.5">
                            {roleOption.value === 'admin' && 'Full access - manage users & projects'}
                            {roleOption.value === 'developer' && 'Create & edit projects'}
                            {roleOption.value === 'user' && 'View only access'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-workspace w-full py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-workspace-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Sample Credentials Info */}
        <div className="mt-6 card-workspace">
          <h3 className="font-semibold text-workspace-text mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Sample Admin Credentials
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-workspace-text-muted">Email:</span>
              <code className="text-role-admin">admin@example.com</code>
            </div>
            <div className="flex justify-between">
              <span className="text-workspace-text-muted">Password:</span>
              <code className="text-role-admin">admin123</code>
            </div>
          </div>
          <p className="text-xs text-workspace-text-muted mt-3">
            Or sign up with the role dropdown to create any account type.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
