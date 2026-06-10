import React from 'react';

/**
 * ErrorBoundary — catches any JavaScript render error in child components
 * and displays the exact error.message + error.stack for debugging.
 *
 * Uses 100% inline styles (no Tailwind / CSS classes) so it renders
 * correctly even when the stylesheet fails to load.
 *
 * NOTE: position is NOT fixed — Android WebView / Capacitor can mis-handle
 * fixed positioning during first paint, causing a blank screen instead of
 * the fallback UI.  We use a simple block-flow full-viewport container.
 */
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
    // Always log to console for remote debugging (Logcat, etc.)
    console.error('[ErrorBoundary] ===== RENDER ERROR =====');
    console.error('[ErrorBoundary] message:', error?.message);
    console.error('[ErrorBoundary] stack:', error?.stack);
    console.error('[ErrorBoundary] componentStack:', info?.componentStack);
    console.error('[ErrorBoundary] ==========================');
  }

  handleReload = () => {
    // Unregister all service workers and clear every cache, then hard-reload
    const clearAndReload = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      }
      if ('caches' in window) {
        caches
          .keys()
          .then((names) => Promise.all(names.map((n) => caches.delete(n))))
          .catch(() => {});
      }
      setTimeout(() => {
        try {
          window.location.reload(true);
        } catch {
          window.location.href = '/';
        }
      }, 400);
    };
    clearAndReload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, info } = this.state;
    const msg   = error?.message  || 'Unknown error — no message provided.';
    const stack = error?.stack    || 'No stack trace available.';
    const comp  = info?.componentStack || 'No component stack available.';

    /* ── inline style tokens ───────────────────────────────────── */
    const root = {
      // Use block flow — NOT fixed, to avoid Android WebView first-paint bug
      display:         'block',
      width:           '100%',
      minHeight:       '100vh',
      backgroundColor: '#000000',
      color:           '#f0f0f0',
      fontFamily:      "'Urbanist', system-ui, -apple-system, sans-serif",
      boxSizing:       'border-box',
      padding:         '24px 16px 40px',
      overflowY:       'auto',
      WebkitOverflowScrolling: 'touch',
    };
    const card = {
      position:     'relative',
      width:        '100%',
      maxWidth:     '520px',
      margin:       '32px auto 0',
      background:   'rgba(12,12,12,0.98)',
      border:       '1px solid rgba(222,255,154,0.18)',
      borderRadius: '20px',
      padding:      '28px 22px 24px',
      boxShadow:    '0 0 80px rgba(0,0,0,0.9)',
    };
    const badge = {
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '56px',
      height:         '56px',
      borderRadius:   '14px',
      background:     'rgba(239,68,68,0.12)',
      border:         '1px solid rgba(239,68,68,0.3)',
      fontSize:       '26px',
      marginBottom:   '10px',
    };
    const title = {
      margin:        0,
      fontSize:      '19px',
      fontWeight:    900,
      color:         '#ffffff',
      letterSpacing: '-0.02em',
    };
    const subtitle = {
      margin:      '5px 0 0',
      fontSize:    '11px',
      color:       '#444',
      fontWeight:  600,
    };
    const sectionLabel = {
      margin:        0,
      fontSize:      '9px',
      fontWeight:    800,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom:  '6px',
    };
    const codeBox = {
      margin:      0,
      padding:     '12px 14px',
      fontSize:    '11px',
      fontFamily:  'ui-monospace, SFMono-Regular, Menlo, monospace',
      lineHeight:  1.6,
      wordBreak:   'break-all',
      whiteSpace:  'pre-wrap',
      overflowX:   'auto',
      borderRadius: '10px',
    };
    const btnPrimary = {
      width:        '100%',
      padding:      '14px',
      background:   '#deff9a',
      color:        '#000',
      border:       'none',
      borderRadius: '10px',
      fontSize:     '12px',
      fontWeight:   900,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      cursor:       'pointer',
      fontFamily:   "'Urbanist', system-ui, sans-serif",
      marginBottom: '8px',
    };
    const btnSecondary = {
      width:        '100%',
      padding:      '12px',
      background:   'transparent',
      color:        '#555',
      border:       '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      fontSize:     '11px',
      fontWeight:   700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      cursor:       'pointer',
      fontFamily:   "'Urbanist', system-ui, sans-serif",
    };

    return (
      <div style={root}>
        <div style={card}>

          {/* ── Header ──────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={badge}>⚠️</div>
            <h1 style={title}>Something went wrong</h1>
            <p style={subtitle}>A rendering error was caught by the Error Boundary</p>
          </div>

          {/* ── error.message ───────────────────────────── */}
          <div
            style={{
              background:    'rgba(239,68,68,0.08)',
              border:        '1px solid rgba(239,68,68,0.22)',
              borderRadius:  '12px',
              padding:       '14px',
              marginBottom:  '12px',
            }}
          >
            <p style={{ ...sectionLabel, color: '#f87171' }}>error.message</p>
            <pre style={{ ...codeBox, color: '#fca5a5', background: 'transparent' }}>
              {msg}
            </pre>
          </div>

          {/* ── error.stack ─────────────────────────────── */}
          <details
            style={{
              marginBottom:  '12px',
              background:    'rgba(255,200,0,0.04)',
              border:        '1px solid rgba(255,200,0,0.12)',
              borderRadius:  '12px',
              overflow:      'hidden',
            }}
            open
          >
            <summary
              style={{
                padding:       '10px 14px',
                fontSize:      '9px',
                fontWeight:    800,
                color:         '#a89040',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                userSelect:    'none',
              }}
            >
              error.stack (tap to collapse)
            </summary>
            <pre
              style={{
                ...codeBox,
                color:       '#c9a832',
                background:  'transparent',
                borderTop:   '1px solid rgba(255,200,0,0.08)',
                fontSize:    '10px',
              }}
            >
              {stack}
            </pre>
          </details>

          {/* ── componentStack ──────────────────────────── */}
          <details
            style={{
              marginBottom:  '20px',
              background:    'rgba(255,255,255,0.02)',
              border:        '1px solid rgba(255,255,255,0.06)',
              borderRadius:  '12px',
              overflow:      'hidden',
            }}
          >
            <summary
              style={{
                padding:       '10px 14px',
                fontSize:      '9px',
                fontWeight:    800,
                color:         '#444',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor:        'pointer',
                userSelect:    'none',
              }}
            >
              Component Stack (tap to expand)
            </summary>
            <pre
              style={{
                ...codeBox,
                color:      '#555',
                background: 'transparent',
                borderTop:  '1px solid rgba(255,255,255,0.04)',
                fontSize:   '10px',
              }}
            >
              {comp}
            </pre>
          </details>

          {/* ── Actions ─────────────────────────────────── */}
          <button style={btnPrimary} onClick={this.handleReload}>
            🔄 Clear Cache &amp; Reload
          </button>
          <button
            style={btnSecondary}
            onClick={() => this.setState({ hasError: false, error: null, info: null })}
          >
            Try Again Without Reload
          </button>

          {/* ── Footer ──────────────────────────────────── */}
          <p
            style={{
              marginTop:     '18px',
              textAlign:     'center',
              fontSize:      '9px',
              color:         '#2a2a2a',
              fontWeight:    700,
              letterSpacing: '0.08em',
            }}
          >
            MANAR SCHEDULE SYSTEM · ERROR BOUNDARY v2
          </p>
        </div>
      </div>
    );
  }
}
