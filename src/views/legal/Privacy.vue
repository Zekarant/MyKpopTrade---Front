<template>
  <LegalLayout title="Politique de confidentialité" :updated-at="updatedAt">
    <p>
      La présente politique décrit comment <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>
      (ci-après « <strong>nous</strong> ») collecte, utilise et protège vos données personnelles dans
      le cadre de l'utilisation de MyKpopTrade, conformément au Règlement Général sur la Protection des
      Données (RGPD) et à la loi Informatique et Libertés.
    </p>

    <h2>1. Responsable de traitement</h2>
    <p>
      Le responsable de traitement est <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>,
      <span :class="{ placeholder: isLegalMissing('headquarters') }">{{ legal('headquarters') }}</span>.<br />
      Délégué à la protection des données (DPO) : <span :class="{ placeholder: isLegalMissing('dpoEmail') }">{{ legal('dpoEmail') }}</span>.
    </p>

    <h2>2. Données collectées</h2>
    <h3>2.1 Données fournies par l'utilisateur</h3>
    <ul>
      <li>Identité : nom d'utilisateur, email, mot de passe (haché), photo de profil.</li>
      <li>Contact : numéro de téléphone (en cas de vérification), adresse de livraison.</li>
      <li>Vérification d'identité (KYC) : document officiel (uniquement pour les vendeurs vérifiés).</li>
      <li>Contenu publié : annonces, messages, avis.</li>
    </ul>

    <h3>2.2 Données collectées automatiquement</h3>
    <ul>
      <li>Données de connexion : adresse IP, user-agent, horodatage.</li>
      <li>Données techniques : préférences, cookies, identifiants de session.</li>
    </ul>

    <h3>2.3 Données de paiement</h3>
    <p>
      Les paiements sont traités par PayPal. Nous n'avons pas accès à vos données bancaires.
      Seuls l'identifiant de transaction et le statut sont stockés.
    </p>

    <h2>3. Finalités et bases légales</h2>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 1.5rem;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; border-bottom:1px solid var(--surface-border);">Finalité</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid var(--surface-border);">Base légale</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:8px;">Création et gestion du compte</td><td style="padding:8px;">Exécution du contrat</td></tr>
        <tr><td style="padding:8px;">Traitement des transactions</td><td style="padding:8px;">Exécution du contrat</td></tr>
        <tr><td style="padding:8px;">Lutte contre la fraude</td><td style="padding:8px;">Intérêt légitime</td></tr>
        <tr><td style="padding:8px;">Vérification d'identité</td><td style="padding:8px;">Obligation légale (LCB-FT)</td></tr>
        <tr><td style="padding:8px;">Notifications transactionnelles</td><td style="padding:8px;">Exécution du contrat</td></tr>
        <tr><td style="padding:8px;">Newsletter, marketing</td><td style="padding:8px;">Consentement</td></tr>
        <tr><td style="padding:8px;">Cookies non essentiels</td><td style="padding:8px;">Consentement</td></tr>
      </tbody>
    </table>

    <h2>4. Durée de conservation</h2>
    <ul>
      <li>Compte actif : pendant toute la durée d'utilisation du service.</li>
      <li>Données de transaction : <strong>10 ans</strong> à compter de la transaction (obligation comptable).</li>
      <li>Données techniques (logs) : <strong>13 mois</strong>.</li>
      <li>Comptes inactifs depuis 3 ans : anonymisation automatique.</li>
    </ul>

    <h2>5. Destinataires</h2>
    <p>Vos données peuvent être transmises à :</p>
    <ul>
      <li>nos sous-traitants techniques (hébergement, email, push) sous contrat conforme RGPD ;</li>
      <li>PayPal pour le traitement des paiements ;</li>
      <li>les autorités compétentes en cas de réquisition légale.</li>
    </ul>

    <h2>6. Transferts hors UE</h2>
    <p>
      Certains sous-traitants peuvent être situés hors Union Européenne. Le cas échéant, les transferts
      sont encadrés par des clauses contractuelles types validées par la Commission Européenne.
    </p>

    <h2>7. Vos droits</h2>
    <p>Conformément au RGPD, vous disposez des droits suivants :</p>
    <ul>
      <li><strong>Accès</strong> : obtenir une copie de vos données (export depuis l'espace personnel).</li>
      <li><strong>Rectification</strong> : corriger des données inexactes.</li>
      <li><strong>Effacement</strong> : supprimer votre compte et vos données.</li>
      <li><strong>Limitation</strong> : restreindre certains traitements.</li>
      <li><strong>Portabilité</strong> : récupérer vos données dans un format structuré.</li>
      <li><strong>Opposition</strong> : refuser certains traitements (notamment marketing).</li>
      <li><strong>Retrait du consentement</strong> : à tout moment, sans effet rétroactif.</li>
    </ul>
    <p>
      Plusieurs de ces droits s'exercent directement, sans nous écrire :
    </p>
    <ul>
      <li>
        <strong>Accès et portabilité</strong> : bouton « Exporter mes données » dans
        <router-link to="/adherents/settings">vos paramètres</router-link>.
      </li>
      <li>
        <strong>Retrait du consentement marketing</strong> : case « Recevoir les actualités » dans
        <router-link to="/adherents/settings">vos paramètres</router-link>.
      </li>
      <li>
        <strong>Cookies de mesure d'audience</strong> : lien « Gérer mes cookies » dans le pied de page.
      </li>
      <li>
        <strong>Effacement</strong> : « Anonymiser mes données » ou la demande de suppression de
        compte, dans <router-link to="/adherents/settings">vos paramètres</router-link>.
      </li>
    </ul>
    <p>
      Pour tout autre droit, ou en cas de difficulté :
      <span :class="{ placeholder: isLegalMissing('dpoEmail') }">{{ legal('dpoEmail') }}</span>.
      Vous pouvez également saisir la CNIL (cnil.fr).
    </p>

    <h2>8. Sécurité</h2>
    <p>
      Nous mettons en œuvre des mesures techniques et organisationnelles : chiffrement TLS, hachage
      des mots de passe (bcrypt), chiffrement des identifiants de paiement, sauvegardes régulières,
      contrôle d'accès strict.
    </p>

    <h2>9. Cookies</h2>
    <p>Voir la <router-link to="/cookies">Politique cookies</router-link>.</p>

    <h2>10. Modifications</h2>
    <p>
      La présente politique peut être mise à jour. La date de dernière mise à jour figure en tête
      du document. Les utilisateurs seront notifiés en cas de modification substantielle.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, analyticsToolName } from '@/config/legal';

export default defineComponent({
  name: 'PrivacyPage',
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
