export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173')
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : ''
    : 'http://localhost:5000'
);
