// 临时禁用 Stripe 功能

export const stripe = null as any;

export async function createCheckoutSession(params: any) {
  return { id: 'test_' + Date.now(), url: '/test' };
}
