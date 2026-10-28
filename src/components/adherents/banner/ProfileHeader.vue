<template>
  <div class="profil_main">
    <div class="identity">
      <div class="nickname_block">
        <span class="nickname_text_field">{{ profile.username }}</span>
        <VerifiedBadge v-if="profile.isIdentityVerified" :size="16" />
      </div>
      <div class="identifier">@{{ profile.username }}</div>
    </div>
    <ProfileStats :following-count="followingCount" :followers-count="followersCount" />
    <div v-if="!isOwnProfile" class="actions">
      <button type="button" class="btn btn-outline" @click="isMessageOpen = true">Envoyer un message</button>
      <button
        type="button"
        :class="['btn', isFollowing ? 'btn-outline' : 'btn-primary']"
        :aria-pressed="isFollowing"
        @click="toggleFollow"
      >
        {{ isFollowing ? 'Suivi' : 'Suivre' }}
      </button>
    </div>
  </div>
  <send_message
    v-if="isMessageOpen"
    :id-user="userId"
    :pseudo-user="profile.username"
    @close-send-message="isMessageOpen = false"
  ></send_message>
</template>

<script setup lang="ts">
/** En-tête d'un profil : identité, compteurs, et actions « message » / « suivre » sur le profil d'un autre. */
import { computed, ref } from 'vue';
import { useFollow } from '@/composables/useFollow';
import VerifiedBadge from '@/components/VerifiedBadge.vue';
import { profileIdOf, type ProfileInfo } from '@/views/adherents/profile/types';
import send_message from '../send_message.vue';
import ProfileStats from './ProfileStats.vue';

const props = defineProps<{
  profile: ProfileInfo & { isIdentityVerified?: boolean };
  isOwnProfile: boolean;
}>();

const userId = computed(() => profileIdOf(props.profile));
const isMessageOpen = ref(false);

const { isFollowing, followersCount, followingCount, toggleFollow } = useFollow(userId, () => props.isOwnProfile);
</script>

<style lang="scss" scoped>
.profil_main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px;
  padding-right: 30px;
}
.identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.actions .btn {
  border-radius: 2px;
  width: auto;
  font-size: 12px;
}
.nickname_block {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nickname_text_field {
  font-weight: 700;
  font-family: "Sora", serif;
  color: var(--primary-color);
  font-size: large;
  margin-right: 2px;
}
.identifier {
  font-family: "Sora", serif;
  font-size: small;
  font-weight: 400;
  line-height: 12.6px;
  text-align: left;
  text-decoration-skip-ink: none;
  color: var(--primary-color);
}
button.btn.btn-outline {
  color: var(--blue);
  border-color: var(--blue);
}
button.btn.btn-outline:hover {
  background-color: var(--blue);
  color: white;
}

@media (max-width: 768px) {
  .profil_main {
    align-items: center;
    text-align: center;
    padding-right: 0;
  }
  .identity {
    align-items: center;
  }
  .actions {
    justify-content: center;
    width: 100%;
  }
  .identifier {
    text-align: center;
  }
}
</style>
