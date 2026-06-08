export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : ''
    : 'http://localhost:5000'
);
