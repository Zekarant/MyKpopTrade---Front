<template>
  <LegalLayout title="Mentions légales" :updated-at="updatedAt">
    <h2>Éditeur du site</h2>
    <p>
      <strong>Dénomination sociale :</strong> <span class="placeholder">[NOM_SOCIÉTÉ]</span><br />
      <strong>Forme juridique :</strong> <span class="placeholder">[FORME_JURIDIQUE]</span><br />
      <strong>Capital social :</strong> <span class="placeholder">[CAPITAL]</span><br />
      <strong>Siège social :</strong> <span class="placeholder">[ADRESSE_SIÈGE]</span><br />
      <strong>RCS :</strong> <span class="placeholder">[VILLE_RCS]</span> <span class="placeholder">[SIREN]</span><br />
      <strong>N° TVA intracommunautaire :</strong> <span class="placeholder">[TVA]</span><br />
      <strong>Directeur de la publication :</strong> <span class="placeholder">[NOM_DIRECTEUR]</span><br />
      <strong>Contact :</strong> <span class="placeholder">[EMAIL_CONTACT]</span>
    </p>

    <h2>Hébergeur</h2>
    <p>
      <strong>Nom :</strong> <span class="placeholder">[NOM_HÉBERGEUR]</span><br />
      <strong>Adresse :</strong> <span class="placeholder">[ADRESSE_HÉBERGEUR]</span><br />
      <strong>Téléphone :</strong> <span class="placeholder">[TÉLÉPHONE_HÉBERGEUR]</span>
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      L'ensemble du site (structure, contenu rédactionnel, charte graphique, logos, photos,
      illustrations, code source) est protégé par le droit de la propriété intellectuelle. Toute
      reproduction, représentation, modification ou exploitation non autorisée est interdite et
      constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de
      la propriété intellectuelle.
    </p>

    <h2>Crédits</h2>
    <p>
      Conception et développement : <span class="placeholder">[ÉQUIPE_OU_PRESTATAIRE]</span>.<br />
      Icônes : Bootstrap Icons. Polices : Google Fonts (Plus Jakarta Sans).
    </p>

    <h2>Médiation à la consommation</h2>
    <p>
      Conformément à l'article L.616-1 du Code de la consommation, en cas de litige non résolu avec
      l'éditeur, vous pouvez recourir gratuitement au médiateur de la consommation suivant :
      <span class="placeholder">[NOM_MÉDIATEUR]</span> — <span class="placeholder">[ADRESSE_MÉDIATEUR]</span> —
      <span class="placeholder">[SITE_MÉDIATEUR]</span>.
    </p>

    <h2>Plateforme européenne de règlement des litiges</h2>
    <p>
      La Commission Européenne met à disposition une plateforme de règlement en ligne des litiges,
      accessible à l'adresse :
      <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';

export default defineComponent({
  name: 'LegalPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '5 mai 2026' };
  }
});
</script>
