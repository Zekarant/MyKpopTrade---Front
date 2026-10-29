<template>
  <div class="stats">
    <span class="subscription"><span class="bold">{{ followingCount }}</span> Abonnements</span>
    <span class="subscription"><span class="bold">{{ followersCount }}</span> Abonnés</span>
  </div>
</template>

<script setup lang="ts">
/** Compteurs d'abonnements et d'abonnés d'un profil. */
defineProps<{
  followingCount: number;
  followersCount: number;
}>();
</script>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.subscription {
  font-family: "Sora", serif;
  color: var(--text-primary);
  font-size: small;
  text-align: left;
}
.subscription .bold {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .stats {
    justify-content: center;
  }
  .subscription {
    text-align: center;
  }
}
</style>
