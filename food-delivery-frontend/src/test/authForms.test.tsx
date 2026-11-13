import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

describe('LoginPage accessibility & behavior', () => {
  it('renders semantic autofill attributes, password toggle, and validation errors', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    expect(usernameInput).toHaveAttribute('autocomplete', 'username');
    expect(usernameInput).toHaveAttribute('spellcheck', 'false');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: 'Show' });
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  it('signs in with demo credentials when demo button is clicked', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'demo-jwt' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            username: 'customer',
            name: 'Demo',
            surname: 'Customer',
            email: 'customer@example.com',
            role: 'ROLE_CUSTOMER',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Customer (customer)' }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/user/login');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/api/user/me');

    vi.unstubAllGlobals();
  });
});

describe('RegisterPage accessibility & validation', () => {
  it('uses new-password autocomplete and validates required fields + email', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );

    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getAllByText('This field is required.').length).toBe(5);
  });
});
