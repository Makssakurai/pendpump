// Small hook: tells us whether the system asked for reduced motion.
// On web we default to `false` but respect the media query if available.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Native API
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => { if (mounted) setReduce(v); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => {
      if (mounted) setReduce(v);
    });
    // Web media query
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) setReduce(true);
      const handler = (e: MediaQueryListEvent) => { if (mounted) setReduce(e.matches); };
      mq.addEventListener?.('change', handler);
      return () => {
        mounted = false;
        sub.remove();
        mq.removeEventListener?.('change', handler);
      };
    }
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
