<template>
  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-image"></i> Photo de profil</h3>
    <div class="settings-card__body">
      <div class="avatar-row">
        <div class="avatar-row__preview">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Photo de profil" />
          <span v-else class="avatar-row__initial">{{ usernameInitial }}</span>
        </div>
        <div class="avatar-row__actions">
          <p class="avatar-row__hint">
            JPG ou PNG, 2 Mo maximum. Visible par tous les membres.
          </p>
          <div class="avatar-row__buttons">
            <button
              type="button"
              class="btn-settings btn-settings--sm"
              :disabled="avatarUploading"
              @click="avatarInput?.click()"
            >
              <i class="bi bi-upload"></i>
              {{ avatarUploading ? 'Envoi…' : 'Changer' }}
            </button>
            <button
              v-if="hasCustomAvatar"
              type="button"
              class="btn-settings btn-settings--sm btn-settings--ghost"
              :disabled="avatarUploading"
              @click="removeAvatar"
            >
              <i class="bi bi-trash"></i> Retirer
            </button>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style="display: none"
            @change="onAvatarChange"
          />
        </div>
      </div>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-person"></i> Identité</h3>
    <div class="settings-card__body">
      <div class="field">
        <label class="field__label" for="settings-username">
          Pseudo <span class="field__required">*</span>
        </label>
        <input
          id="settings-username"
          type="text"
          v-model.trim="form.username"
          class="settings-input"
          maxlength="30"
          autocomplete="username"
          placeholder="votre-pseudo"
        />
        <small v-if="usernameError" class="field__error">{{ usernameError }}</small>
        <small v-else class="field__hint">
          3 à 30 caractères : lettres, chiffres, tirets et underscores. C'est le nom
          sous lequel les autres membres vous voient.
        </small>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label" for="settings-firstname">Prénom</label>
          <input
            id="settings-firstname"
            type="text"
            v-model.trim="form.firstName"
            class="settings-input"
            maxlength="100"
            autocomplete="given-name"
          />
        </div>
        <div class="field">
          <label class="field__label" for="settings-lastname">Nom</label>
          <input
            id="settings-lastname"
            type="text"
            v-model.trim="form.lastName"
            class="settings-input"
            maxlength="100"
            autocomplete="family-name"
          />
        </div>
      </div>
      <small class="field__hint">
        <i class="bi bi-lock"></i>
        Prénom et nom restent privés : ils ne sont jamais affichés sur votre profil
        public.
      </small>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-card-text"></i> Présentation</h3>
    <div class="settings-card__body">
      <div class="field">
        <label class="field__label" for="settings-bio">Description</label>
        <textarea
          id="settings-bio"
          v-model="form.bio"
          class="settings-input settings-input--textarea"
          rows="4"
          maxlength="500"
          placeholder="Vos groupes préférés, ce que vous recherchez, vos conditions d'envoi…"
        ></textarea>
        <small class="field__hint field__hint--right">
          {{ (form.bio || '').length }}/500
        </small>
      </div>

      <div class="field">
        <label class="field__label" for="settings-location">Localisation</label>
        <input
          id="settings-location"
          type="text"
          v-model.trim="form.location"
          class="settings-input"
          maxlength="100"
          placeholder="Ville, pays"
        />
        <small class="field__hint">
          Affichée publiquement. Indiquez une ville, jamais une adresse précise.
        </small>
      </div>
    </div>
  </section>

  <section class="settings-card">
    <h3 class="settings-card__title"><i class="bi bi-share"></i> Réseaux sociaux</h3>
    <div class="settings-card__body">
      <div class="field">
        <label class="field__label" for="settings-instagram">
          <i class="bi bi-instagram"></i> Instagram
        </label>
        <input
          id="settings-instagram"
          type="text"
          v-model.trim="form.socialLinks.instagram"
          class="settings-input"
          maxlength="100"
          placeholder="@votre_compte"
        />
      </div>
      <div class="field">
        <label class="field__label" for="settings-twitter">
          <i class="bi bi-twitter-x"></i> X (Twitter)
        </label>
        <input
          id="settings-twitter"
          type="text"
          v-model.trim="form.socialLinks.twitter"
          class="settings-input"
          maxlength="100"
          placeholder="@votre_compte"
        />
      </div>
      <div class="field">
        <label class="field__label" for="settings-discord">
          <i class="bi bi-discord"></i> Discord
        </label>
        <input
          id="settings-discord"
          type="text"
          v-model.trim="form.socialLinks.discord"
          class="settings-input"
          maxlength="100"
          placeholder="votre_pseudo"
        />
      </div>
      <small class="field__hint">
        Ces liens sont publics. Ils aident les acheteurs à vous identifier, mais ne sont
        jamais obligatoires.
      </small>
    </div>
  </section>

  <Transition name="save-bar">
    <div v-if="profileChanged" class="save-bar">
      <span class="save-bar__text">
        <i class="bi bi-pencil"></i> Modifications non enregistrées
      </span>
      <div class="save-bar__actions">
        <button type="button" class="btn-settings btn-settings--ghost" @click="resetProfileForm" :disabled="savingProfile">
          Annuler
        </button>
        <button type="button" class="btn-settings btn-settings--primary" @click="saveProfileIdentity" :disabled="savingProfile">
          <i class="bi bi-check-lg"></i>
          {{ savingProfile ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { func } from '@/function';
import { API_URL } from '@/config/api';
import { api, apiMessage, isSessionLost } from './shared';
import type { SectionProps, SettingsProfile } from './shared';

const props = defineProps<SectionProps>();
const emit = defineEmits<{ patch: [changes: Partial<SettingsProfile>] }>();

/** Valeur par défaut côté API : ce n'est pas un choix de l'utilisateur. */
const DEFAULT_PROFILE_PICTURE = 'https://mykpoptrade.com/images/avatar-default.png';

/** Taille maximale d'un avatar, alignée sur la limite du middleware d'upload. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface ProfileForm {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  socialLinks: { instagram: string; twitter: string; discord: string };
}

function formFrom(profile: SettingsProfile): ProfileForm {
  const links = profile.socialLinks || {};
  return {
    username: profile.username || '',
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    bio: profile.bio || '',
    location: profile.location || '',
    socialLinks: {
      instagram: links.instagram || '',
      twitter: links.twitter || '',
      discord: links.discord || ''
    }
  };
}

const form = ref<ProfileForm>(formFrom(props.profile));
const savingProfile = ref(false);
const avatarUploading = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

function resetProfileForm() {
  form.value = formFrom(props.profile);
}

// Profil rechargé : le formulaire repart des valeurs enregistrées.
watch(() => props.profile, resetProfileForm);

const usernameInitial = computed(() =>
  (form.value.username || props.profile.username || '?').charAt(0).toUpperCase()
);

const hasCustomAvatar = computed(() => {
  const picture = props.profile.profilePicture;
  return Boolean(picture && picture !== DEFAULT_PROFILE_PICTURE);
});

/** Les photos de l'API sont relatives, celles des fournisseurs absolues. */
const avatarUrl = computed(() => {
  const picture = props.profile.profilePicture;
  if (!picture || picture === DEFAULT_PROFILE_PICTURE) return '';
  return picture.startsWith('http') ? picture : `${API_URL}${picture}`;
});

/** Aligné sur `validateUsername` côté API. */
const usernameError = computed(() => {
  const username = form.value.username;
  if (!username) return 'Le pseudo est obligatoire.';
  if (username.length < 3) return 'Le pseudo doit comporter au moins 3 caractères.';
  if (username.length > 30) return 'Le pseudo ne peut pas dépasser 30 caractères.';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Caractères autorisés : lettres, chiffres, tiret et underscore.';
  }
  return '';
});

const profileChanged = computed(() => {
  const saved = formFrom(props.profile);
  const current = form.value;
  return (
    current.username !== saved.username ||
    current.firstName !== saved.firstName ||
    current.lastName !== saved.lastName ||
    current.bio !== saved.bio ||
    current.location !== saved.location ||
    current.socialLinks.instagram !== saved.socialLinks.instagram ||
    current.socialLinks.twitter !== saved.socialLinks.twitter ||
    current.socialLinks.discord !== saved.socialLinks.discord
  );
});

/** Enregistre l'ensemble du profil public en un appel. */
async function saveProfileIdentity() {
  if (usernameError.value) {
    func.showToastError(usernameError.value);
    return;
  }

  savingProfile.value = true;
  try {
    const { data } = await api.put('/api/auth/profile', {
      ...form.value,
      socialLinks: { ...form.value.socialLinks }
    });

    // La réponse reflète les troncatures appliquées côté API.
    emit('patch', data.user || {});
    resetProfileForm();
    func.showToastSuccess(data.message || 'Profil mis à jour.');
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Erreur lors de l\'enregistrement.'));
  } finally {
    savingProfile.value = false;
  }
}

async function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // Sans cela, resélectionner le même fichier ne déclenche pas `change`.
  input.value = '';
  if (!file) return;

  if (file.size > MAX_AVATAR_BYTES) {
    func.showToastError('Image trop lourde : 2 Mo maximum.');
    return;
  }

  avatarUploading.value = true;
  const formData = new FormData();
  formData.append('profilePicture', file);
  try {
    await api.post('/api/profiles/me/picture', formData);
    await props.reloadProfile();
    func.showToastSuccess('Photo de profil mise à jour.');
  } catch (error) {
    if (!isSessionLost(error)) func.showToastError(apiMessage(error, 'Impossible d\'envoyer l\'image.'));
  } finally {
    avatarUploading.value = false;
  }
}

async function removeAvatar() {
  avatarUploading.value = true;
  try {
    await api.delete('/api/profiles/me/picture');
    await props.reloadProfile();
    func.showToastSuccess('Photo de profil retirée.');
  } catch (error) {
    func.showToastError(apiMessage(error, 'Impossible de retirer l\'image.'));
  } finally {
    avatarUploading.value = false;
  }
}
</script>
