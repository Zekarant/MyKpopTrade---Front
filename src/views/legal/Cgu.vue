<template>
  <LegalLayout title="Conditions Générales d'Utilisation" :updated-at="updatedAt">
    <h2>1. Objet</h2>
    <p>
      Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation
      de la plateforme MyKpopTrade, exploitée par <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>,
      <span :class="{ placeholder: isLegalMissing('legalForm') }">{{ legal('legalForm') }}</span> au capital de <span :class="{ placeholder: isLegalMissing('capital') }">{{ legal('capital') }}</span>,
      immatriculée au RCS de <span :class="{ placeholder: isLegalMissing('rcsCity') }">{{ legal('rcsCity') }}</span> sous le numéro <span :class="{ placeholder: isLegalMissing('siren') }">{{ legal('siren') }}</span>,
      dont le siège social est situé <span :class="{ placeholder: isLegalMissing('headquarters') }">{{ legal('headquarters') }}</span>.
    </p>

    <h2>2. Définitions</h2>
    <ul>
      <li><strong>Plateforme</strong> : le site web et les services accessibles à l'adresse mykpoptrade.com.</li>
      <li><strong>Utilisateur</strong> : toute personne physique majeure inscrite sur la Plateforme.</li>
      <li><strong>Vendeur</strong> : Utilisateur proposant des produits à la vente.</li>
      <li><strong>Acheteur</strong> : Utilisateur réalisant un achat sur la Plateforme.</li>
      <li><strong>Produit</strong> : tout article (photocard, album, merchandising, etc.) proposé à la vente.</li>
    </ul>

    <h2>3. Inscription et compte</h2>
    <p>
      L'inscription est ouverte aux personnes physiques majeures. L'Utilisateur s'engage à fournir
      des informations exactes et à les maintenir à jour. Un seul compte par personne est autorisé.
      L'Utilisateur est responsable de la confidentialité de ses identifiants.
    </p>

    <h2>4. Utilisation de la Plateforme</h2>
    <p>L'Utilisateur s'engage à ne pas :</p>
    <ul>
      <li>publier de produits illicites, contrefaits ou volés ;</li>
      <li>tromper sciemment un acheteur sur la nature ou l'état d'un produit ;</li>
      <li>utiliser la Plateforme à des fins de blanchiment, de fraude ou de harcèlement ;</li>
      <li>contourner les paiements en proposant des transactions hors plateforme ;</li>
      <li>publier des contenus injurieux, diffamatoires, racistes, sexistes ou contraires à l'ordre public.</li>
    </ul>

    <h2>5. Transactions</h2>
    <h3>5.1 Mise en vente</h3>
    <p>
      Le Vendeur garantit être propriétaire du Produit et qu'il est conforme à la description fournie.
      Les prix sont libres mais doivent être affichés TTC.
    </p>

    <h3>5.2 Paiement</h3>
    <p>
      Les paiements sont traités par PayPal. <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> peut
      prélever une commission de service précisée au moment de la vente.
    </p>

    <h3>5.3 Expédition</h3>
    <p>
      Le Vendeur dispose de <strong>5 jours ouvrés</strong> pour expédier le Produit après paiement.
      Le suivi doit être renseigné sur la Plateforme.
    </p>

    <h3>5.4 Réception</h3>
    <p>
      L'Acheteur dispose de <strong>14 jours</strong> à compter de l'expédition pour confirmer la réception.
      À défaut, la livraison sera automatiquement validée.
    </p>

    <h2>6. Droit de rétractation</h2>
    <p>
      Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas
      aux ventes entre particuliers. Les conditions de retour sont précisées entre le Vendeur et l'Acheteur,
      sous l'arbitrage de <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> en cas de litige.
    </p>

    <h2>7. Litiges entre Utilisateurs</h2>
    <p>
      En cas de désaccord, les parties peuvent ouvrir un litige depuis leur espace personnel.
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> agit en qualité d'arbitre et tranche le litige
      sur la base des éléments fournis par les parties dans un délai indicatif de 7 jours ouvrés.
    </p>

    <h2>8. Responsabilité</h2>
    <p>
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> agit en qualité d'intermédiaire technique et n'est
      pas partie au contrat de vente entre Utilisateurs. Sa responsabilité est limitée aux dommages directs
      résultant d'un manquement avéré à ses obligations.
    </p>

    <h2>9. Suspension et résiliation</h2>
    <p>
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> peut suspendre ou supprimer un compte en cas de
      violation des CGU, sans préjudice de poursuites éventuelles. L'Utilisateur peut supprimer son compte
      à tout moment depuis ses paramètres.
    </p>

    <h2>10. Propriété intellectuelle</h2>
    <p>
      Les marques, logos, contenus éditoriaux et fonctionnalités de la Plateforme sont protégés.
      Les Utilisateurs conservent les droits sur les contenus qu'ils publient mais accordent à
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> une licence non exclusive d'utilisation à des
      fins de fonctionnement et de promotion de la Plateforme.
    </p>

    <h2>11. Données personnelles</h2>
    <p>
      Le traitement des données personnelles est décrit dans la
      <router-link to="/privacy">Politique de confidentialité</router-link>.
    </p>

    <h2>12. Modification des CGU</h2>
    <p>
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span> peut modifier les CGU à tout moment. Les Utilisateurs
      sont notifiés au moins 15 jours avant l'entrée en vigueur des modifications substantielles.
    </p>

    <h2>13. Droit applicable et juridiction</h2>
    <p>
      Les présentes CGU sont soumises au droit français. Tout litige relève des tribunaux compétents de
      <span :class="{ placeholder: isLegalMissing('courtCity') }">{{ legal('courtCity') }}</span>, sous réserve des dispositions impératives en
      matière de consommation.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, analyticsToolName } from '@/config/legal';

export default defineComponent({
  name: 'CguPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '5 mai 2026' };
  },
  // Identité légale résolue depuis src/config/legal.ts : un seul endroit à
  // renseigner pour les 4 pages légales.
  setup() {
    return { legal, isLegalMissing, analyticsToolName };
  }
});
</script>
