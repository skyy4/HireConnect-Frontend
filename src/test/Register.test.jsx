import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock dependencies ────────────────────────────────────────────────────────
vi.mock('../api/authApi', () => ({
  register: vi.fn(),
}));

vi.mock('../api/profileApi', () => ({
  createCandidateProfile: vi.fn(),
  createRecruiterProfile: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn((data) => ({ ...data, role: data?.role || 'CANDIDATE', userId: 1 })),
  }),
}));

import Register from '../pages/Register';
import { register } from '../api/authApi';

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
    </MemoryRouter>
  );

// ── Register Page Tests ───────────────────────────────────────────────────────

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1: email and password fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/password/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders role selector (Candidate / Recruiter)', () => {
    renderRegister();
    expect(screen.getByText(/candidate/i)).toBeInTheDocument();
    expect(screen.getByText(/recruiter/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' },
    });

    const passwordFields = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: 'pass1234' } });
    fireEvent.change(passwordFields[1], { target: { value: 'different' } });

    fireEvent.click(screen.getByRole('button', { name: /continue|next/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' },
    });

    const passwordFields = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: '123' } });
    fireEvent.change(passwordFields[1], { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /continue|next/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('renders link to Login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /sign in|log in/i })).toBeInTheDocument();
  });

  it('shows error on failed registration', async () => {
    register.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });

    renderRegister();

    // Fill Step 1
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'dupe@test.com' },
    });
    const passwordFields = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: 'pass123' } });
    fireEvent.change(passwordFields[1], { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /continue|next/i }));

    // Now on Step 2, submit
    await waitFor(() => {
      const submitBtn = screen.queryByRole('button', { name: /create account|register|sign up/i });
      if (submitBtn) fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText(/email already exists/i) ||
             screen.queryByText(/error/i)).toBeTruthy();
    });
  });
});
