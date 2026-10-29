<template>
  <div class="background" v-bind="pickerAttrs('banner', 'Changer la bannière')">
    <img v-if="media.banner" :src="mediaUrl(media.banner)" alt="Bannière du profil" />
    <div v-else class="background"></div>
    <button
      v-if="editable && media.banner"
      type="button"
      class="media-delete media-delete--banner"
      aria-label="Supprimer la bannière"
      @click.stop="pendingDeletion = 'banner'"
    >
      <i class="bi bi-trash"></i>
    </button>
    <input v-if="editable" ref="bannerInput" type="file" accept="image/*" hidden @change="onFileChosen('banner', $event)" />
  </div>

  <div class="picture" v-bind="pickerAttrs('picture', 'Changer la photo de profil')">
    <img v-if="hasPicture" :src="mediaUrl(media.picture)" alt="Photo de profil" />
    <div v-else class="empty-profile">
      <i class="bi bi-camera"></i>
    </div>
    <button
      v-if="editable && hasPicture"
      type="button"
      class="media-delete media-delete--picture"
      aria-label="Supprimer la photo de profil"
      @click.stop="pendingDeletion = 'picture'"
    >
      <i class="bi bi-trash"></i>
    </button>
    <input v-if="editable" ref="pictureInput" type="file" accept="image/*" hidden @change="onFileChosen('picture', $event)" />
  </div>

  <ConfirmDeleteDialog v-if="pendingDeletion" @cancel="pendingDeletion = null" @confirm="confirmDeletion" />
</template>

<script setup lang="ts">
/** Bannière et photo d'un profil ; sur mon profil, cliquables pour les changer ou les supprimer. */
import { computed, ref } from 'vue';
import { useProfileMedia, type ProfileMediaKind } from '@/composables/useProfileMedia';
import { mediaUrl } from '@/utils/format';
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue';

/** Avatar attribué par défaut à l'inscription : affiché comme « pas de photo ». */
const DEFAULT_PROFILE_PICTURE = 'https://mykpoptrade.com/images/avatar-default.png';

const props = defineProps<{
  banner?: string | null;
  picture?: string | null;
  /** Mon profil : les images peuvent être changées. */
  editable: boolean;
}>();

const { media, upload, remove } = useProfileMedia(() => ({ banner: props.banner, picture: props.picture }));

const bannerInput = ref<HTMLInputElement | null>(null);
const pictureInput = ref<HTMLInputElement | null>(null);
const pendingDeletion = ref<ProfileMediaKind | null>(null);

const hasPicture = computed(() => Boolean(media.value.picture) && media.value.picture !== DEFAULT_PROFILE_PICTURE);

function openPicker(kind: ProfileMediaKind) {
  (kind === 'banner' ? bannerInput : pictureInput).value?.click();
}

/** Zone cliquable au clavier comme à la souris, seulement sur mon profil. */
function pickerAttrs(kind: ProfileMediaKind, label: string) {
  if (!props.editable) return {};
  return {
    role: 'button',
    tabindex: 0,
    'aria-label': label,
    onClick: () => openPicker(kind),
    onKeydown: (event: KeyboardEvent) => {
      // Touche reçue de la zone elle-même : Entrée sur le bouton de suppression ne doit pas ouvrir le sélecteur.
      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openPicker(kind);
    },
  };
}

function onFileChosen(kind: ProfileMediaKind, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) upload(kind, file);
}

async function confirmDeletion() {
  if (pendingDeletion.value && (await remove(pendingDeletion.value))) {
    pendingDeletion.value = null;
  }
}
</script>

<style lang="scss" scoped>
.background {
  background: var(--text-primary);
  width: 100%;
  max-width: 100%;
  height: 160px;
  position: relative;
}
.background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.picture {
  height: 130px;
  width: 130px;
  background: var(--text-primary);
  border-radius: 4px;
  border: 4px solid white;
  position: absolute;
  top: 95px;
  left: 30px;
  z-index: 2;
}
.picture img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.empty-profile {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.empty-profile i {
  font-size: 3rem;
  color: white;
}

// Icône corbeille dans l'angle de l'image (ex-styles en ligne de l'icône).
.media-delete {
  position: absolute;
  bottom: 0;
  padding: 0;
  border: none;
  color: white;
  background: #0000005c;
  border-radius: 4px;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;

  &--banner { right: 5px; }
  &--picture { right: 0; }
}

// De la plus large à la plus étroite : la plus étroite l'emporte.
@media only screen and (max-width: 1024px) {
  .picture {
    left: 14%;
  }
}

@media (max-width: 768px) {
  .picture {
    top: calc(15vh - 60px);
    left: calc(calc(100% - 130px) / 2);
  }
  .background {
    height: 15vh;
  }
}
</style>
