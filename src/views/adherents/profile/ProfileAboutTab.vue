<template>
  <!-- À propos : lecture seule, l'édition est dans les paramètres. -->
  <div class="about-section">
    <div class="about-card">
      <div v-if="isOwnProfile" class="about-card__edit-bar">
        <span class="about-card__edit-hint">
          <i class="bi bi-eye"></i> Voici ce que voient les autres membres.
        </span>
        <router-link
          to="/adherents/settings?section=profil"
          class="about-card__edit-btn"
        >
          <i class="bi bi-pencil"></i> Modifier mon profil
        </router-link>
      </div>

      <!-- Bio -->
      <div class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-person-lines-fill"></i> Description</h3>
        <p v-if="profile.bio" class="about-card__bio">{{ profile.bio }}</p>
        <p v-else class="about-card__bio about-card__bio--empty">
          Aucune description renseignée.
        </p>
      </div>

      <!-- Infos -->
      <div class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-info-circle"></i> Informations</h3>
        <div class="about-card__grid">
          <div class="about-card__row">
            <span class="about-card__label">Nom d'utilisateur</span>
            <span class="about-card__value">{{ profile.username }}</span>
          </div>
          <div class="about-card__row" v-if="profile.location">
            <span class="about-card__label">Lieu de résidence</span>
            <span class="about-card__value">{{ profile.location }}</span>
          </div>
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <div class="about-card__block" v-if="hasSocialLinks || isOwnProfile">
        <h3 class="about-card__title"><i class="bi bi-share"></i> Réseaux sociaux</h3>
        <div v-if="hasSocialLinks" class="about-card__grid">
          <div class="about-card__row" v-if="links.instagram">
            <span class="about-card__label"><i class="bi bi-instagram"></i> Instagram</span>
            <span class="about-card__value">{{ links.instagram }}</span>
          </div>
          <div class="about-card__row" v-if="links.twitter">
            <span class="about-card__label"><i class="bi bi-twitter-x"></i> X (Twitter)</span>
            <span class="about-card__value">{{ links.twitter }}</span>
          </div>
          <div class="about-card__row" v-if="links.discord">
            <span class="about-card__label"><i class="bi bi-discord"></i> Discord</span>
            <span class="about-card__value">{{ links.discord }}</span>
          </div>
        </div>
        <p v-else class="about-card__bio about-card__bio--empty">
          Aucun réseau social renseigné.
        </p>
      </div>

      <!-- Date + Certif -->
      <div class="about-card__footer">
        <span v-if="profile.createdAt" class="about-card__date">
          <i class="bi bi-calendar3"></i> Membre depuis le {{ memberSince }}
        </span>
        <div v-if="profile.isSellerVerified" class="about-card__badge">
          <img src="@/assets/images/certif.svg" alt="Certifié" width="20" />
          <span>Compte certifié</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProfileInfo } from './types'

const props = defineProps<{ profile: ProfileInfo; isOwnProfile: boolean }>()

const links = computed(() => props.profile.socialLinks || {})

const hasSocialLinks = computed(() =>
  Boolean(links.value.instagram || links.value.twitter || links.value.discord)
)

const memberSince = computed(() =>
  props.profile.createdAt
    ? new Date(props.profile.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''
)
</script>
