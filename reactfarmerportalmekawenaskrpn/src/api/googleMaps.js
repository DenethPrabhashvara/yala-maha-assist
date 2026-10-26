// Loads the Google Maps JavaScript API once. Needs VITE_GOOGLE_MAPS_API_KEY in .env
// (Maps JavaScript API enabled; Geocoding API too if you want landmark search).
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

let promise;
let authFailed = false;

export function loadGoogleMaps() {
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error('No Google Maps API key'));
  if (authFailed) return Promise.reject(new Error('Google Maps key rejected'));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (promise) return promise;
  promise = new Promise((resolve, reject) => {
    const cb = `__gmapsReady${Date.now()}`;
    window[cb] = () => { delete window[cb]; resolve(window.google.maps); };
    // Google calls this on a bad / restricted key, sometimes after the script has loaded.
    window.gm_authFailure = () => {
      authFailed = true;
      reject(new Error('Google Maps key rejected'));
      window.dispatchEvent(new Event('gmaps-auth-failure'));
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly&loading=async&region=LK&callback=${cb}`;
    s.async = true;
    s.onerror = () => { promise = null; reject(new Error('Could not load Google Maps')); };
    document.head.appendChild(s);
  });
  return promise;
}

// Straight-line distance in metres.
export function haversine(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
