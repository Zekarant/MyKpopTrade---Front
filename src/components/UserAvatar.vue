<template>
  <span class="app-avatar" :style="sizeStyle">
    <img
      v-if="src"
      class="app-avatar__img"
      :src="src"
      :alt="altText"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <span v-else class="app-avatar__initial" role="img" :aria-label="altText">{{ initial }}</span>
  </span>
</template>

<script setup lang="ts">
/**
 * Avatar d'un membre : sa photo, ou l'initiale de son pseudo si elle manque ou
 * ne se charge pas. Remplace l'ancien HTML construit à la main et injecté par
 * v-html (avec un onerror inline) : ici tout passe par des liaisons Vue, donc
 * un pseudo ou une URL piégés ne peuvent plus injecter de balisage.
 */
import { computed, ref, watch } from 'vue';
import { mediaUrl } from '@/utils/format';

/** Avatar par défaut posé par l'API sur les comptes sans photo. */
const DEFAULT_AVATAR_URL = 'https://mykpoptrade.com/images/avatar-default.png';

const props = defineProps<{
  user: { username?: string; profilePicture?: string | null } | null | undefined;
  /** Côté en pixels ; sans valeur, l'avatar remplit son conteneur. */
  size?: number;
}>();

const failed = ref(false);

const src = computed(() => {
  if (failed.value) return '';
  // Interlocuteur inconnu (compte supprimé, donnée pas encore chargée).
  if (!props.user) return DEFAULT_AVATAR_URL;
  const picture = props.user.profilePicture?.trim();
  // L'avatar par défaut de l'API est moins parlant que l'initiale.
  if (!picture || picture === DEFAULT_AVATAR_URL) return '';
  return mediaUrl(picture);
});

// Nouvelle photo (changement de profil, de conversation) : on lui redonne sa chance.
watch(() => props.user?.profilePicture, () => { failed.value = false; });

const initial = computed(() => {
  const letter = props.user?.username?.trim().charAt(0).toUpperCase();
  return letter || '?';
});

const altText = computed(() =>
  props.user?.username ? `Avatar de ${props.user.username}` : 'Avatar'
);

const sizeStyle = computed(() =>
  props.size
    ? {
        width: `${props.size}px`,
        height: `${props.size}px`,
        borderRadius: '50%',
        fontSize: `${Math.round(props.size * 0.45)}px`
      }
    : undefined
);
</script>

<style lang="scss" scoped>
.app-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: inherit;
  font-size: 20px;
}

.app-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-avatar__initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--accent-gradient);
  color: var(--text-on-accent);
  font-weight: 700;
  line-height: 1;
  user-select: none;
}
</style>
