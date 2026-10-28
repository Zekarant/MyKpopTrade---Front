<template>
  <fieldset class="form-section">
    <legend><i class="bi bi-music-note-beamed"></i> K-pop</legend>
    <p class="form-intro">
      Ces informations rendent votre annonce trouvable : la plupart des acheteurs
      cherchent par groupe et par membre.
    </p>
    <div>
      <label for="kpopGroup">Groupe <span class="req">*</span></label>
      <CatalogSearchSelect
        id="kpopGroup"
        v-model="groupLabel"
        :options="groups"
        :selected="Boolean(form.kpopGroup)"
        placeholder="Rechercher un groupe..."
        empty-text="Aucun groupe trouvé"
        @select="selectGroup"
      />
    </div>
    <div>
      <label for="kpopMember">
        Membre
        <span v-if="isMemberRequired" class="req">*</span>
        <span v-else class="opt">(optionnel)</span>
      </label>
      <!-- Liste du catalogue quand le groupe en a une : le membre devient filtrable. -->
      <select v-if="members.length" id="kpopMember" v-model="form.kpopMember">
        <option value="">{{ isMemberRequired ? 'Choisir un membre' : 'Article de groupe' }}</option>
        <option v-for="member in members" :key="member" :value="member">{{ member }}</option>
      </select>
      <input v-else id="kpopMember" v-model="form.kpopMember" type="text" placeholder="Ex: Jimin, Lisa, Felix..." />
      <small v-if="!isMemberRequired" class="form-hint">
        Laissez vide pour un article de groupe.
      </small>
    </div>
    <div>
      <label for="albumName">Album <span class="opt">(optionnel)</span></label>
      <CatalogSearchSelect
        id="albumName"
        v-model="albumLabel"
        :options="filteredAlbums"
        :selected="Boolean(form.albumName)"
        :placeholder="form.kpopGroup ? 'Rechercher dans les albums du groupe...' : 'Sélectionnez d\'abord un groupe'"
        :disabled="!form.kpopGroup"
        empty-text="Aucun album trouvé pour ce groupe"
        @select="selectAlbum"
      />
      <small v-if="!form.kpopGroup" class="form-hint">Choisissez un groupe pour voir ses albums</small>
    </div>
    <div class="form-row">
      <div class="form-col">
        <label for="version">Version <span class="opt">(optionnel)</span></label>
        <input id="version" v-model="form.version" type="text" maxlength="50" placeholder="Ex: Ver. A, Digipack..." />
      </div>
      <div class="form-col">
        <label for="era">Ère <span class="opt">(optionnel)</span></label>
        <input id="era" v-model="form.era" type="text" maxlength="100" placeholder="Ex: Butter, MAP OF THE SOUL..." />
      </div>
    </div>
    <div class="form-row">
      <div class="form-col">
        <label for="pob">POB <span class="opt">(optionnel)</span></label>
        <input id="pob" v-model="form.pob" type="text" maxlength="100" placeholder="Boutique du pre-order benefit" />
      </div>
      <div class="form-col">
        <label for="isOfficial">Authenticité</label>
        <select id="isOfficial" v-model="form.isOfficial">
          <option :value="undefined">Non précisé</option>
          <option :value="true">Officiel</option>
          <option :value="false">Non officiel (fanmade, unofficial)</option>
        </select>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
/** Étape « K-pop » de la vente : groupe, membre et album proposés depuis le catalogue. */
import { useKpopCatalog } from '@/composables/useKpopCatalog';
import type { PostData } from '@/types/post.types';
import CatalogSearchSelect from './CatalogSearchSelect.vue';

defineProps<{ isMemberRequired: boolean }>();

const form = defineModel<PostData>('form', { required: true });
const groupLabel = defineModel<string>('groupLabel', { required: true });
const albumLabel = defineModel<string>('albumLabel', { required: true });

const { groups, filteredAlbums, members, selectGroup, selectAlbum } = useKpopCatalog({ form, groupLabel, albumLabel });
</script>
