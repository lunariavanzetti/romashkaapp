declare global {
  interface Window {
    Paddle: unknown;
  }
}

// PaddleService for browser integration
const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/paddle.js';

function loadPaddleScript() {
  return new Promise<void>((resolve, reject) => {
    if ((window as unknown as { Paddle?: unknown }).Paddle) return resolve();
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e: unknown) => reject(e);
    document.body.appendChild(script);
  });
}

function initPaddle() {
  const paddle = (window as unknown as { Paddle?: unknown }).Paddle;
  if (typeof paddle === 'object' && paddle !== null) {
    (paddle as { Setup?: (options: Record<string, unknown>) => void })?.Setup?.({
      vendor: Number(import.meta.env.VITE_PADDLE_SELLER_ID),
      environment: import.meta.env.VITE_PADDLE_ENV || 'sandbox',
    });
  }
}

export class PaddleService {
  static async openCheckout(planId: string, email?: string) {
    await loadPaddleScript();
    initPaddle();
    (window as unknown as { Paddle?: { Checkout: { open: (options: unknown) => void } } }).Paddle?.Checkout.open({
      product: planId,
      email,
    });
  }

  static async openCustomerPortal(email: string) {
    await loadPaddleScript();
    initPaddle();
    (window as unknown as { Paddle?: { CustomerPortal: { open: (options: unknown) => void } } }).Paddle?.CustomerPortal.open({
      email,
    });
  }

  // Placeholder for webhook event handling (to be implemented server-side)
  static handleWebhook() {
    // Process Paddle webhook events for subscription updates
  }

  // Placeholder for usage-based billing, tax, currency
}

export {}; 