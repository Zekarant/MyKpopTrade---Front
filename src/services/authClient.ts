import { createAuthClient } from 'better-auth/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/api/auth/better',
  fetchOptions: {
    credentials: 'include',
  },
});

export async function signInWithGoogle(): Promise<void> {
  await authClient.signIn.social({
    provider: 'google',
    // better-auth termine l'OAuth puis redirige ici, qui repasse par notre
    // pont serveur pour émettre la paire JWT historique attendue par le reste
    // de l'app, puis renvoie vers /auth/callback côté front.
    callbackURL: `${API_URL}/api/auth/oauth-bridge`,
  });
}
