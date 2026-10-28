/**
 * Vrai si l'URL mène à PayPal (paypal.com, sandbox.paypal.com ou un de leurs
 * sous-domaines) en https. Les URL d'approbation enchaînées par success.vue
 * sont relues depuis le localStorage, modifiable par n'importe quel script de
 * la page : sans ce contrôle, on redirigerait l'acheteur vers un faux PayPal.
 */
export function isPayPalUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return false;
  const host = parsed.hostname.toLowerCase();
  // sandbox.paypal.com est lui-même un sous-domaine de paypal.com.
  return host === 'paypal.com' || host.endsWith('.paypal.com');
}

/**
 * Envoie l'acheteur sur l'URL d'approbation, seulement si elle mène à PayPal.
 * @returns false sans rediriger quand l'URL est absente ou étrangère à PayPal
 */
export function redirectToPayPal(url: unknown): boolean {
  if (typeof url !== 'string' || !isPayPalUrl(url)) return false;
  window.location.href = url;
  return true;
}
