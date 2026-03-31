import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';

type NavigateFn = (href?: string) => void;

/**
 * Starts a native View Transition when running on the web; otherwise falls back to plain navigation.
 * Keeps navigation calls centralized so screens don't have to branch per platform.
 */
function runWithViewTransition(action: () => void) {
  if (Platform.OS !== 'web') {
    action();
    return;
  }

  const start = (globalThis as any).document?.startViewTransition;
  if (typeof start === 'function') {
    start(() => {
      action();
    });
  } else {
    action();
  }
}

export function useViewTransitionNavigation() {
  const router = useRouter();

  const push: NavigateFn = useCallback(
    (href) => runWithViewTransition(() => router.push(href ?? '/')),
    [router]
  );

  const replace: NavigateFn = useCallback(
    (href) => runWithViewTransition(() => router.replace(href ?? '/')),
    [router]
  );

  const back = useCallback(() => runWithViewTransition(() => router.back()), [router]);

  return {
    push,
    replace,
    back,
    prefetch: router.prefetch,
  };
}
