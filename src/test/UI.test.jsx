import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  StatusBadge,
  LoadingSpinner,
  LoadingSkeleton,
  EmptyState,
  Alert,
  Modal,
  Toast,
  Card,
  Button,
  Badge,
} from '../components/UI';

// ── StatusBadge ────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  it('renders known status label', () => {
    render(<StatusBadge status="APPLIED" />);
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('renders SHORTLISTED correctly', () => {
    render(<StatusBadge status="SHORTLISTED" />);
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  });

  it('renders OFFERED correctly', () => {
    render(<StatusBadge status="OFFERED" />);
    expect(screen.getByText('Offered')).toBeInTheDocument();
  });

  it('renders REJECTED correctly', () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });

  it('renders Unknown when no status provided', () => {
    render(<StatusBadge />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

// ── LoadingSpinner ─────────────────────────────────────────────────────────
describe('LoadingSpinner', () => {
  it('renders with accessible label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('accepts custom size', () => {
    render(<LoadingSpinner size={48} />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveStyle({ width: '48px', height: '48px' });
  });
});

// ── LoadingSkeleton ────────────────────────────────────────────────────────
describe('LoadingSkeleton', () => {
  it('renders default 3 skeleton lines', () => {
    render(<LoadingSkeleton />);
    const lines = document.querySelectorAll('.skeleton-line');
    expect(lines).toHaveLength(3);
  });

  it('renders custom number of rows', () => {
    render(<LoadingSkeleton rows={5} />);
    const lines = document.querySelectorAll('.skeleton-line');
    expect(lines).toHaveLength(5);
  });
});

// ── EmptyState ─────────────────────────────────────────────────────────────
describe('EmptyState', () => {
  it('renders title and message', () => {
    render(<EmptyState icon="📭" title="No results" message="Nothing to show yet." />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    const action = <button>Refresh</button>;
    render(<EmptyState icon="📭" title="Empty" message="Try again." action={action} />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});

// ── Alert ──────────────────────────────────────────────────────────────────
describe('Alert', () => {
  it('renders alert message', () => {
    render(<Alert type="error" message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('returns null when no message', () => {
    const { container } = render(<Alert />);
    expect(container.firstChild).toBeNull();
  });

  it('applies the correct type class', () => {
    render(<Alert type="success" message="Done!" />);
    const el = document.querySelector('.app-alert-success');
    expect(el).toBeInTheDocument();
  });
});

// ── Modal ──────────────────────────────────────────────────────────────────
describe('Modal', () => {
  it('renders when isOpen is true', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modal"><p>Content</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Hidden Modal"><p>Content</p></Modal>);
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Close Test"><p>Body</p></Modal>);
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal box is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="No Close"><p>Body</p></Modal>);
    fireEvent.click(document.querySelector('.modal-box'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── Toast ──────────────────────────────────────────────────────────────────
describe('Toast', () => {
  it('renders toast message', () => {
    render(<Toast message="Saved successfully!" type="success" onClose={() => {}} />);
    expect(screen.getByText('Saved successfully!')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Info" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct aria role', () => {
    render(<Toast message="Alert" onClose={() => {}} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ── Card ───────────────────────────────────────────────────────────────────
describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Card"><p>Body</p></Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
  });

  it('does not render title element when no title', () => {
    render(<Card><p>Body</p></Card>);
    expect(document.querySelector('.card-header')).not.toBeInTheDocument();
  });
});

// ── Button ─────────────────────────────────────────────────────────────────
describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('uses primary variant by default', () => {
    render(<Button>Submit</Button>);
    expect(document.querySelector('.btn-primary')).toBeInTheDocument();
  });

  it('accepts custom variant class', () => {
    render(<Button variant="secondary">Cancel</Button>);
    expect(document.querySelector('.btn-secondary')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});

// ── Badge ──────────────────────────────────────────────────────────────────
describe('Badge', () => {
  it('renders badge text', () => {
    render(<Badge type="info">New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies correct type class', () => {
    render(<Badge type="warning">Alert</Badge>);
    expect(document.querySelector('.badge-warning')).toBeInTheDocument();
  });
});
