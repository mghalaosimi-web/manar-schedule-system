const rawApiUrl = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? 'https://manar-schedule-system.onrender.com/api'
    : (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000')
);

export const API_URL = rawApiUrl.replace(/\/api\/?$/, '');
