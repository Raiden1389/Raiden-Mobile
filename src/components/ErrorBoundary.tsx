import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/**
 * ErrorBoundary — Catches rendering errors and shows recovery UI
 * Prevents blank screen on crash
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f0f1a', color: '#e0e0e0',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>💥</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
            Có lỗi xảy ra
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.5, maxWidth: '300px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '24px',
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
            }}
          >
            🏠 Về Library
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
