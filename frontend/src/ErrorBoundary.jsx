import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info?.componentStack);
  }

  handleReload = () => {
    // Unregister service worker, clear caches, then reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    setTimeout(() => window.location.reload(true), 300);
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, info } = this.state;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          color: '#f0f0f0',
          fontFamily: "'Urbanist', system-ui, sans-serif",
          padding: '24px',
          boxSizing: 'border-box',
          zIndex: 99999,
          overflowY: 'auto',
        }}
      >
        {/* Glow orb decoration */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(222,255,154,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(222,255,154,0.15)',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset',
          }}
        >
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: '28px',
                marginBottom: '12px',
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Something went wrong
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#555', fontWeight: 600 }}>
              A rendering error was caught by the Error Boundary
            </p>
          </div>

          {/* Error message box */}
          <div
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: '#f87171',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Error Message
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: '#fca5a5',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                fontFamily: 'monospace',
              }}
            >
              {error?.message || 'Unknown error occurred'}
            </p>
          </div>

          {/* Component stack (collapsible via details) */}
          {info?.componentStack && (
            <details
              style={{
                marginBottom: '20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  padding: '10px 14px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#555',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Component Stack (tap to expand)
              </summary>
              <pre
                style={{
                  margin: 0,
                  padding: '12px 14px',
                  fontSize: '10px',
                  color: '#666',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  fontFamily: 'monospace',
                }}
              >
                {info.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px',
                background: '#deff9a',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Urbanist', system-ui, sans-serif",
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              🔄 Clear Cache &amp; Reload
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, info: null })}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#555',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: "'Urbanist', system-ui, sans-serif",
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#deff9a';
                e.target.style.borderColor = 'rgba(222,255,154,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#555';
                e.target.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              Try Again
            </button>
          </div>

          {/* Footer note */}
          <p
            style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#333',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            MANAR SCHEDULE SYSTEM · ERROR BOUNDARY
          </p>
        </div>
      </div>
    );
  }
}
