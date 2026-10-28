<template>
  <div class="auth-divider">
    <span>{{ dividerLabel }}</span>
  </div>

  <div class="auth-social">
    <button type="button" class="auth-social__btn" @click="startOAuth('google')">
      <svg class="auth-social__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.11A6.62 6.62 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.04 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      Google
    </button>
    <button type="button" class="auth-social__btn auth-social__btn--discord" @click="startOAuth('discord')">
      <svg class="auth-social__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.074.074 0 0 0-.079.037c-.34.6-.719 1.384-.984 2.001a18.27 18.27 0 0 0-5.487 0 12.65 12.65 0 0 0-1-2.001.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 5.17 4.369a.07.07 0 0 0-.032.027C1.533 9.795.546 15.06 1.03 20.262a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.027 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.105 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-6.012-.838-11.232-3.549-15.866a.06.06 0 0 0-.031-.028zM8.02 17.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
      Discord
    </button>
  </div>
</template>

<script setup lang="ts">
import { API_URL } from '@/config/api';

/** Connexion et inscription passent par la même route : l'API crée le compte s'il n'existe pas. */
defineProps<{ dividerLabel: string }>();

function startOAuth(provider: 'google' | 'discord') {
  window.location.href = `${API_URL}/api/auth/${provider}`;
}
</script>

<style lang="scss" scoped>
.auth-divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-sm) 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--surface-border);
  }

  span {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    white-space: nowrap;
  }
}

.auth-social {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.auth-social__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-elevated);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }

  // Couleur de marque Discord (« Blurple »), indépendante du thème.
  &--discord {
    color: #5865F2;
  }
}

.auth-social__icon {
  width: 18px;
  height: 18px;
}
</style>
