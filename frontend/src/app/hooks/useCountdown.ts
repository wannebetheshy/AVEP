import { useState, useEffect } from 'react';

export function useCountdown(expiresAt: Date | null) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return {
    timeRemaining,
    minutes,
    seconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    canExtend: timeRemaining < 15 * 60 * 1000 && timeRemaining > 0,
  };
}
