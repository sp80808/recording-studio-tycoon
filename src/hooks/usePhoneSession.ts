import { useEffect, useState } from 'react';

/**
 * Phone / constrained-height session console (#141).
 * Mirrors the CSS breakpoints in studio-play.css: phones (<= 540px wide) and
 * landscape phones / short windows (<= 500px tall). Desktop and tablet keep the
 * richer ActiveProject layout.
 */
export const PHONE_SESSION_QUERY = '(max-width: 540px), (max-height: 500px)';

const read = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE_SESSION_QUERY).matches
    : false;

export function usePhoneSession(): boolean {
  const [phone, setPhone] = useState<boolean>(read);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(PHONE_SESSION_QUERY);
    const onChange = () => setPhone(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return phone;
}
