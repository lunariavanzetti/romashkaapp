// Example: Monitoring and analytics
import * as Sentry from '@sentry/browser';

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    tracesSampleRate: 1.0,
  });
}

export function captureError(error: Error) {
  Sentry.captureException(error);
}

export function trackEvent() {
  // Integrate with analytics provider (e.g., Plausible, Google Analytics)
  // window.plausible?.(event, { props: data });
} 