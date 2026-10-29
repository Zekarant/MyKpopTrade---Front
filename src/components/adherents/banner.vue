<template>
  <div class="content" @click="isMenuVisible = false" @keydown.esc="isMenuVisible = false">
    <ProfileMediaEditor
      :banner="profilInfo.profileBanner"
      :picture="profilInfo.profilePicture"
      :editable="admin"
    />
    <div class="profil">
      <div v-if="admin" class="more_content">
        <button
          type="button"
          class="more_content__toggle"
          aria-label="Options du profil"
          aria-haspopup="menu"
          :aria-expanded="isMenuVisible"
          @click.stop="isMenuVisible = !isMenuVisible"
        >
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <div v-if="isMenuVisible" class="dropdown-menu">
          <ul role="menu">
            <li role="none">
              <button type="button" role="menuitem" @click="router.push({ name: 'settings' })">
                <i class="bi bi-gear me-2"></i> Paramètres
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="profil_inner">
        <div class="empty_box"></div>
        <ProfileHeader :profile="profilInfo" :is-own-profile="isOwnProfile" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Bandeau d'un profil : bannière, photo, identité, compteurs et actions. */
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ProfileInfo } from '@/views/adherents/profile/types';
import ProfileMediaEditor from './banner/ProfileMediaEditor.vue';
import ProfileHeader from './banner/ProfileHeader.vue';

defineOptions({ name: 'BannerProfil' });

withDefaults(defineProps<{
  profilInfo: ProfileInfo & {
    profileBanner?: string | null;
    isIdentityVerified?: boolean;
  };
  /** Mon profil : bannière et photo modifiables, menu des paramètres. */
  admin?: boolean;
}>(), { admin: false });

const route = useRoute();
const router = useRouter();

const isMenuVisible = ref(false);
// Dérivé de la route à chaque rendu : plus de drapeau posé trop tard (après le premier chargement).
const isOwnProfile = computed(() => route.params.id === 'me');
</script>

<style lang="scss" scoped>
.content {
  min-height: 320px;
  position: relative;
  border-bottom: 0.5px solid var(--surface-border);
}
.profil {
  min-height: 140px;
  padding: 10px 0;
  position: relative;
}
.profil_inner {
  display: flex;
  align-items: flex-start;
}
.empty_box {
  width: 170px;
  flex-shrink: 0;
  min-height: 70px;
  margin: 0px;
  padding: 0px;
}
.more_content {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
}
.more_content__toggle {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 20px;
  right: 0;
  background: white;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: var(--z-dropdown);
  width: 150px;
  display: block;
}

.dropdown-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
}

.dropdown-menu button:hover {
  background-color: var(--bg-tertiary);
}

@media (max-width: 768px) {
  .empty_box {
    display: none;
  }
  .profil {
    position: relative;
    width: 100%;
    padding-top: 80px;
  }
}

@media only screen and (max-width: 1024px) {
  .empty_box {
    width: 30%;
  }
}
</style>
