import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock dependencies ────────────────────────────────────────────────────────
vi.mock('../api/authApi', () => ({
  login: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn((data) => ({ ...data, role: data?.role || 'CANDIDATE', userId: 1 })),
  }),
}));

import Login from '../pages/Login';
import { login } from '../api/authApi';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );

// ── Login Page Tests ─────────────────────────────────────────────────────────

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders GitHub login option', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls login API with email and password on submit', async () => {
    login.mockResolvedValueOnce({
      data: { token: 'test-token', role: 'CANDIDATE', userId: 1 },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'alice@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('alice@test.com', 'password123');
    });
  });

  it('shows loading state while logging in', async () => {
    login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Button should be disabled during loading
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /sign(ing)? in/i });
      expect(btn).toBeDisabled();
    });
  });

  it('renders link to Register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});
