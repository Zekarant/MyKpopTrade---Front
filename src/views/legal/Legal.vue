<template>
  <LegalLayout title="Mentions légales" :updated-at="updatedAt">
    <p>
      Les présentes mentions sont publiées en application de l'article 6-III de la loi n° 2004-575
      du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).
    </p>

    <h2>1. Éditeur du site</h2>
    <p>
      <strong>Éditeur :</strong> <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span><br />
      <template v-if="legalApplies('legalForm')">
        <strong>Forme juridique :</strong> <span :class="{ placeholder: isLegalMissing('legalForm') }">{{ legal('legalForm') }}</span><br />
      </template>
      <template v-if="legalApplies('capital')">
        <strong>Capital social :</strong> <span :class="{ placeholder: isLegalMissing('capital') }">{{ legal('capital') }}</span><br />
      </template>
      <strong>Adresse :</strong> <span :class="{ placeholder: isLegalMissing('headquarters') }">{{ legal('headquarters') }}</span><br />
      <template v-if="legalApplies('rcsCity')">
        <strong>RCS :</strong> <span :class="{ placeholder: isLegalMissing('rcsCity') }">{{ legal('rcsCity') }}</span> <span :class="{ placeholder: isLegalMissing('siren') }">{{ legal('siren') }}</span><br />
      </template>
      <template v-if="legalApplies('vatNumber')">
        <strong>N° TVA intracommunautaire :</strong> <span :class="{ placeholder: isLegalMissing('vatNumber') }">{{ legal('vatNumber') }}</span><br />
      </template>
      <strong>Directeur de la publication :</strong> <span :class="{ placeholder: isLegalMissing('publicationDirector') }">{{ legal('publicationDirector') }}</span><br />
      <strong>Contact :</strong>
      <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>
    </p>

    <p v-if="publisherType === 'individual'" class="legal-notice">
      <i class="bi bi-info-circle"></i>
      MyKpopTrade est actuellement édité par une personne physique, dans le cadre d'une
      <router-link to="/beta">phase de bêta</router-link>. L'activité n'est pas encore immatriculée :
      le site ne dispose donc ni de numéro SIREN, ni d'immatriculation au RCS, ni de numéro de TVA
      intracommunautaire. Ces informations seront publiées ici dès l'immatriculation.
    </p>

    <h2>2. Hébergeur</h2>
    <p>
      <strong>Nom :</strong> <span :class="{ placeholder: isLegalMissing('hostName') }">{{ legal('hostName') }}</span><br />
      <strong>Adresse :</strong> <span :class="{ placeholder: isLegalMissing('hostAddress') }">{{ legal('hostAddress') }}</span><br />
      <strong>Téléphone :</strong> <span :class="{ placeholder: isLegalMissing('hostPhone') }">{{ legal('hostPhone') }}</span>
    </p>

    <h2>3. Nature du service et statut d'hébergeur de contenus</h2>
    <p>
      MyKpopTrade est une place de marché mettant en relation des particuliers souhaitant acheter,
      vendre ou échanger des objets liés à la culture K-pop (photocards, albums, merchandising).
      L'éditeur n'est ni vendeur, ni acheteur, ni partie aux contrats de vente conclus entre
      utilisateurs.
    </p>
    <p>
      Les annonces, messages, avis et publications sont fournis par les utilisateurs. Conformément à
      l'article 6-I-2 de la LCEN et à l'article 6 du règlement (UE) 2022/2065, l'éditeur agit en
      qualité d'hébergeur pour ces contenus : sa responsabilité ne peut être engagée que s'il avait
      effectivement connaissance de leur caractère illicite et n'a pas agi promptement pour les
      retirer.
    </p>

    <h2>4. Signalement d'un contenu illicite</h2>
    <p>
      Tout contenu que vous estimez illicite (contrefaçon, escroquerie, harcèlement, contenu
      haineux, article interdit à la vente) peut être signalé :
    </p>
    <ul>
      <li>
        depuis l'interface, via le bouton <strong>« Signaler »</strong> présent sur chaque annonce,
        avis et profil ;
      </li>
      <li>
        ou par email à
        <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>.
      </li>
    </ul>
    <p>
      Pour être traité, un signalement doit préciser l'URL du contenu, le motif du signalement et,
      si vous invoquez une atteinte à vos droits, les éléments qui les justifient. Vous êtes informé
      de la décision prise et de ses motifs. Une décision de retrait ou de suspension peut être
      contestée en répondant à l'email de notification.
    </p>
    <p>
      <strong>Point de contact unique</strong> (art. 11 et 12 du DSA), pour les utilisateurs comme
      pour les autorités : <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>.
      Langue de communication : le français.
    </p>

    <h2>5. Propriété intellectuelle</h2>
    <p>
      La structure du site, sa charte graphique, ses textes rédactionnels, son logo et son code
      source sont protégés par le droit de la propriété intellectuelle. Toute reproduction,
      représentation, modification ou exploitation non autorisée est interdite et constituerait une
      contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété
      intellectuelle.
    </p>
    <p>
      Les noms de groupes, d'artistes, les visuels d'albums et les marques mentionnés sur la
      Plateforme appartiennent à leurs titulaires respectifs. Ils sont cités par les utilisateurs à
      seule fin d'identifier les objets mis en vente. MyKpopTrade n'est affilié à aucun label,
      agence ou artiste.
    </p>

    <h2>6. Crédits</h2>
    <p>
      Conception et développement : <span :class="{ placeholder: isLegalMissing('designer') }">{{ legal('designer') }}</span>.<br />
      Icônes : Bootstrap Icons (licence MIT). Police : Sora (SIL Open Font License).
    </p>

    <h2>7. Réclamations et médiation à la consommation</h2>
    <p>
      Toute réclamation doit d'abord être adressée à
      <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>. Nous nous
      engageons à répondre dans un délai de 14 jours.
    </p>
    <p>
      Conformément à l'article L.616-1 du Code de la consommation, en cas de litige non résolu avec
      l'éditeur, vous pouvez recourir gratuitement au médiateur de la consommation suivant :
      <span :class="{ placeholder: isLegalMissing('mediatorName') }">{{ legal('mediatorName') }}</span> —
      <span :class="{ placeholder: isLegalMissing('mediatorAddress') }">{{ legal('mediatorAddress') }}</span> —
      <span :class="{ placeholder: isLegalMissing('mediatorWebsite') }">{{ legal('mediatorWebsite') }}</span>.
    </p>
    <p>
      Les litiges survenant <strong>entre utilisateurs</strong> à l'occasion d'une vente relèvent de
      la procédure décrite à l'article 8 des
      <router-link to="/cgu">Conditions Générales d'Utilisation</router-link>.
    </p>

    <h2>8. Plateforme européenne de règlement des litiges</h2>
    <p>
      La Commission européenne met à disposition une plateforme de règlement en ligne des litiges,
      accessible à l'adresse :
      <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.
    </p>

    <h2>9. Données personnelles et cookies</h2>
    <p>
      Le traitement des données personnelles est décrit dans la
      <router-link to="/privacy">Politique de confidentialité</router-link>, et l'usage des traceurs
      dans la <router-link to="/cookies">Politique cookies</router-link>. Pour toute question
      relative à vos données :
      <a :href="`mailto:${legal('dpoEmail')}`">{{ legal('dpoEmail') }}</a>.
    </p>

    <h2>10. Droit applicable</h2>
    <p>
      Les présentes mentions sont soumises au droit français. En cas de litige, et à défaut de
      résolution amiable, les tribunaux compétents de
      <span :class="{ placeholder: isLegalMissing('courtCity') }">{{ legal('courtCity') }}</span>
      sont saisis, sous réserve des dispositions impératives protégeant le consommateur.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, legalApplies, publisherType } from '@/config/legal';

export default defineComponent({
  name: 'LegalPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '3 septembre 2026' };
  },
  setup() {
    return { legal, isLegalMissing, legalApplies, publisherType };
  }
});
</script>
