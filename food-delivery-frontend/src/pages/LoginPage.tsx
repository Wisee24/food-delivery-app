import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { label: 'Customer', username: 'customer', password: 'customer' },
  { label: 'Owner', username: 'owner', password: 'owner' },
  { label: 'Admin', username: 'admin', password: 'admin' },
] as const;

export function LoginPage() {
  const { user, login, authNotice, clearAuthNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { from?: string; registered?: string } | null;
  const redirectTo = state?.from && state.from !== '/login' ? state.from : '/restaurants';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const performLogin = async (u: string, p: string) => {
    setError(null);
    clearAuthNotice();
    setSubmitting(true);
    try {
      await login({ username: u.trim(), password: p });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ username: true, password: true });
    if (!event.currentTarget.checkValidity()) {
      return;
    }
    await performLogin(username, password);
  };

  const usernameInvalid = Boolean(touched.username && !username.trim());
  const passwordInvalid = Boolean(touched.password && !password);

  return (
    <section className="auth-card" aria-labelledby="login-heading">
      <div className="page-header">
        <div>
          <h1 id="login-heading">Sign In</h1>
          <p className="page-subtitle">
            Access restaurants, dishes, and your active order.
          </p>
        </div>
      </div>

      {state?.registered ? (
        <div className="banner banner-success" role="status">
          <span>
            Account <strong>{state.registered}</strong> created. Please sign in.
          </span>
        </div>
      ) : null}

      {authNotice ? (
        <div className="banner banner-warning" role="status">
          <span>{authNotice}</span>
        </div>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="login-username">
            Username
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            className={`input-control${usernameInvalid ? ' user-invalid-fallback' : ''}`}
            autoComplete="username"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="next"
            required
            value={username}
            aria-invalid={usernameInvalid}
            aria-describedby={usernameInvalid ? 'login-username-error' : undefined}
            onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
            onChange={(e) => setUsername(e.target.value)}
          />
          {usernameInvalid ? (
            <span id="login-username-error" className="field-error">
              Username is required.
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <div className="password-wrap">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`input-control${passwordInvalid ? ' user-invalid-fallback' : ''}`}
              autoComplete="current-password"
              enterKeyHint="done"
              required
              value={password}
              aria-invalid={passwordInvalid}
              aria-describedby={passwordInvalid ? 'login-password-error' : undefined}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {passwordInvalid ? (
            <span id="login-password-error" className="field-error">
              Password is required.
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="page-subtitle" style={{ marginBlockStart: '1rem' }}>
        New here? <Link to="/register">Create an account</Link>
      </p>

      <div className="demo-accounts">
        <span className="field-hint">
          Quick sign-in with seeded backend accounts:
        </span>
        <div className="demo-buttons">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.username}
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={submitting}
              onClick={() => {
                setUsername(demo.username);
                setPassword(demo.password);
                void performLogin(demo.username, demo.password);
              }}
            >
              {demo.label} ({demo.username})
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
