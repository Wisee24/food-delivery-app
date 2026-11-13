import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RegisterFields {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterFields>({
    username: '',
    password: '',
    name: '',
    surname: '',
    email: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFields, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof RegisterFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: keyof RegisterFields) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const getFieldError = (key: keyof RegisterFields): string | null => {
    if (!touched[key]) return null;
    const val = form[key].trim();
    if (!val) return 'This field is required.';
    if (key === 'email' && !EMAIL_PATTERN.test(val)) {
      return 'Enter a valid email address.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      username: true,
      password: true,
      name: true,
      surname: true,
      email: true,
    });

    if (!event.currentTarget.checkValidity()) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const created = await register({
        username: form.username.trim(),
        password: form.password,
        name: form.name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
      });
      navigate('/login', {
        replace: true,
        state: { registered: created.username },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please check your details.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const usernameErr = getFieldError('username');
  const passwordErr = getFieldError('password');
  const nameErr = getFieldError('name');
  const surnameErr = getFieldError('surname');
  const emailErr = getFieldError('email');

  return (
    <section className="auth-card" aria-labelledby="register-heading">
      <div className="page-header">
        <div>
          <h1 id="register-heading">Create Account</h1>
          <p className="page-subtitle">
            Register as a customer to browse menus and place orders.
          </p>
        </div>
      </div>

      {error ? (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="form-row-2">
          <div className="field">
            <label className="field-label" htmlFor="reg-name">
              First Name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              className={`input-control${nameErr ? ' user-invalid-fallback' : ''}`}
              autoComplete="given-name"
              enterKeyHint="next"
              required
              value={form.name}
              aria-invalid={Boolean(nameErr)}
              aria-describedby={nameErr ? 'reg-name-error' : undefined}
              onBlur={() => markTouched('name')}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {nameErr ? (
              <span id="reg-name-error" className="field-error">
                {nameErr}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="reg-surname">
              Last Name
            </label>
            <input
              id="reg-surname"
              name="surname"
              type="text"
              className={`input-control${surnameErr ? ' user-invalid-fallback' : ''}`}
              autoComplete="family-name"
              enterKeyHint="next"
              required
              value={form.surname}
              aria-invalid={Boolean(surnameErr)}
              aria-describedby={surnameErr ? 'reg-surname-error' : undefined}
              onBlur={() => markTouched('surname')}
              onChange={(e) => updateField('surname', e.target.value)}
            />
            {surnameErr ? (
              <span id="reg-surname-error" className="field-error">
                {surnameErr}
              </span>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            className={`input-control${emailErr ? ' user-invalid-fallback' : ''}`}
            autoComplete="email"
            spellCheck={false}
            enterKeyHint="next"
            required
            value={form.email}
            aria-invalid={Boolean(emailErr)}
            aria-describedby={emailErr ? 'reg-email-error' : undefined}
            onBlur={() => markTouched('email')}
            onChange={(e) => updateField('email', e.target.value)}
          />
          {emailErr ? (
            <span id="reg-email-error" className="field-error">
              {emailErr}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="reg-username">
            Username
          </label>
          <input
            id="reg-username"
            name="username"
            type="text"
            className={`input-control${usernameErr ? ' user-invalid-fallback' : ''}`}
            autoComplete="username"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="next"
            required
            value={form.username}
            aria-invalid={Boolean(usernameErr)}
            aria-describedby={usernameErr ? 'reg-username-error' : undefined}
            onBlur={() => markTouched('username')}
            onChange={(e) => updateField('username', e.target.value)}
          />
          {usernameErr ? (
            <span id="reg-username-error" className="field-error">
              {usernameErr}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="reg-password">
            Password
          </label>
          <div className="password-wrap">
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`input-control${passwordErr ? ' user-invalid-fallback' : ''}`}
              autoComplete="new-password"
              enterKeyHint="done"
              required
              value={form.password}
              aria-invalid={Boolean(passwordErr)}
              aria-describedby={passwordErr ? 'reg-password-error' : undefined}
              onBlur={() => markTouched('password')}
              onChange={(e) => updateField('password', e.target.value)}
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
          {passwordErr ? (
            <span id="reg-password-error" className="field-error">
              {passwordErr}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="page-subtitle" style={{ marginBlockStart: '1rem' }}>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </section>
  );
}
