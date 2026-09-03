<template>
  <LegalLayout title="Politique de confidentialité" :updated-at="updatedAt">
    <p>
      La présente politique décrit comment
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>
      (ci-après « <strong>nous</strong> ») collecte, utilise et protège vos données personnelles dans
      le cadre de l'utilisation de MyKpopTrade, conformément au règlement (UE) 2016/679 (RGPD) et à
      la loi n° 78-17 du 6 janvier 1978 dite « Informatique et Libertés ».
    </p>

    <h2>1. Responsable de traitement</h2>
    <p>
      Le responsable de traitement est
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>,
      <span :class="{ placeholder: isLegalMissing('headquarters') }">{{ legal('headquarters') }}</span>.<br />
      Contact pour toute question relative aux données :
      <a :href="`mailto:${legal('dpoEmail')}`">{{ legal('dpoEmail') }}</a>.
    </p>
    <p>
      La désignation d'un délégué à la protection des données (DPO) n'est pas obligatoire à ce stade
      au sens de l'article 37 du RGPD ; l'adresse ci-dessus est néanmoins relevée et constitue le
      point d'entrée unique pour l'exercice de vos droits.
    </p>

    <h2>2. Données collectées</h2>
    <h3>2.1 Données que vous nous fournissez</h3>
    <ul>
      <li><strong>Compte</strong> : nom d'utilisateur, prénom et nom, email, mot de passe (haché avec bcrypt), photo de profil, bannière.</li>
      <li><strong>Profil public</strong> : biographie, localisation déclarée, liens vers vos réseaux sociaux, groupes suivis.</li>
      <li><strong>Contact</strong> : numéro de téléphone (pour la vérification et les alertes de transaction).</li>
      <li><strong>Facturation</strong> : nom légal et adresse postale, utilisés pour pré-remplir votre inscription PayPal en tant que vendeur.</li>
      <li><strong>Vérification d'identité (facultative)</strong> : document officiel, uniquement si vous demandez le statut de vendeur vérifié.</li>
      <li><strong>Contenus</strong> : annonces, photos de produits, messages, avis, signalements, pièces déposées dans un litige.</li>
    </ul>

    <h3>2.2 Données collectées automatiquement</h3>
    <ul>
      <li><strong>Connexion</strong> : adresse IP, user-agent, horodatage des accès et des actions sensibles.</li>
      <li><strong>Technique</strong> : cookies de session, identifiant de terminal, préférences d'affichage.</li>
      <li><strong>Usage</strong> : historique de recherche, favoris, sur consentement pour la mesure d'audience.</li>
    </ul>

    <h3>2.3 Données issues de tiers</h3>
    <p>
      Si vous vous connectez via <strong>Google</strong>, <strong>Discord</strong> ou
      <strong>Facebook</strong>, nous recevons de ce fournisseur votre identifiant, votre adresse
      email, votre nom d'affichage et votre photo de profil. Nous n'accédons à aucune autre donnée
      de votre compte, et nous ne publions jamais en votre nom.
    </p>

    <h3>2.4 Données de paiement</h3>
    <p>
      Les paiements sont traités par <strong>PayPal</strong>. Nous n'avons accès à aucune donnée
      bancaire ni carte : seuls l'identifiant de transaction, le montant, le statut et
      l'identifiant marchand du vendeur sont conservés.
    </p>

    <h2>3. Finalités et bases légales</h2>
    <div class="legal-table-wrapper">
      <table class="legal-table">
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Base légale</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Création et gestion du compte</td><td>Exécution du contrat (art. 6-1-b)</td></tr>
          <tr><td>Publication des annonces et mise en relation</td><td>Exécution du contrat</td></tr>
          <tr><td>Traitement des transactions et des remboursements</td><td>Exécution du contrat</td></tr>
          <tr><td>Messagerie entre utilisateurs</td><td>Exécution du contrat</td></tr>
          <tr><td>Instruction des litiges et des signalements</td><td>Intérêt légitime (art. 6-1-f)</td></tr>
          <tr><td>Prévention de la fraude et sécurité du service</td><td>Intérêt légitime</td></tr>
          <tr><td>Vérification d'identité des vendeurs</td><td>Consentement, puis intérêt légitime pour la conservation</td></tr>
          <tr><td>Notifications transactionnelles (email, push)</td><td>Exécution du contrat</td></tr>
          <tr><td>Obligations comptables et déclaratives (DAC7)</td><td>Obligation légale (art. 6-1-c)</td></tr>
          <tr><td>Newsletter et actualités</td><td>Consentement (art. 6-1-a)</td></tr>
          <tr><td>Mesure d'audience</td><td>Consentement</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Lorsque le traitement repose sur notre intérêt légitime, nous nous sommes assurés qu'il ne
      porte pas une atteinte disproportionnée à vos droits, et vous pouvez vous y opposer (cf. § 8).
    </p>

    <h2>4. Durées de conservation</h2>
    <div class="legal-table-wrapper">
      <table class="legal-table">
        <thead>
          <tr>
            <th>Donnée</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Compte et profil</td><td>Toute la durée d'utilisation du service</td></tr>
          <tr><td>Compte inactif</td><td>Anonymisation après 3 ans sans connexion</td></tr>
          <tr><td>Compte supprimé</td><td>Suppression effective après 30 jours (délai de rétractation)</td></tr>
          <tr><td>Pièces comptables et transactions</td><td>10 ans (art. L.123-22 du Code de commerce)</td></tr>
          <tr><td>Données de paiement</td><td>Anonymisation au-delà de 3 ans</td></tr>
          <tr><td>Messages de la messagerie</td><td>Chiffrés, conservés jusqu'à suppression de la conversation</td></tr>
          <tr><td>Documents de vérification d'identité</td><td>Supprimés dès la décision, ou au plus tard 3 mois après</td></tr>
          <tr><td>Éléments d'un litige</td><td>5 ans après la clôture (délai de prescription)</td></tr>
          <tr><td>Journaux techniques et de connexion</td><td>13 mois</td></tr>
          <tr><td>Preuve du consentement aux cookies</td><td>6 mois</td></tr>
        </tbody>
      </table>
    </div>

    <h2>5. Destinataires et sous-traitants</h2>
    <p>
      Vos données ne sont ni vendues ni louées. Elles sont accessibles à l'éditeur et aux
      sous-traitants suivants, liés par un contrat conforme à l'article 28 du RGPD :
    </p>
    <div class="legal-table-wrapper">
      <table class="legal-table">
        <thead>
          <tr>
            <th>Sous-traitant</th>
            <th>Finalité</th>
            <th>Localisation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="processor in dataProcessors" :key="processor.name">
            <td>{{ processor.name }}</td>
            <td>{{ processor.purpose }}</td>
            <td>{{ processor.location }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      Certaines données sont par ailleurs rendues visibles des autres utilisateurs par le
      fonctionnement même du service : votre nom d'utilisateur, votre photo de profil, votre
      biographie, votre localisation déclarée, vos annonces et les avis reçus constituent votre
      <strong>profil public</strong>. Vos prénom et nom, votre email, votre téléphone et votre
      adresse ne sont jamais affichés publiquement.
    </p>
    <p>
      Vos données peuvent enfin être transmises aux autorités administratives ou judiciaires
      compétentes sur réquisition légale.
    </p>

    <h2>6. Transferts hors Union européenne</h2>
    <p>
      Nos serveurs et notre base de données sont hébergés chez
      <span :class="{ placeholder: isLegalMissing('hostName') }">{{ legal('hostName') }}</span>.
      Certains sous-traitants listés ci-dessus peuvent traiter des données hors de l'Union
      européenne. Le cas échéant, ces transferts sont encadrés soit par une décision d'adéquation de
      la Commission européenne, soit par les clauses contractuelles types adoptées par cette
      dernière, complétées de mesures techniques (chiffrement en transit et au repos).
    </p>

    <h2>7. Décisions automatisées et profilage</h2>
    <p>
      Nous ne prenons <strong>aucune décision entièrement automatisée</strong> produisant des effets
      juridiques à votre égard au sens de l'article 22 du RGPD. Les décisions de modération, de
      suspension de compte et d'arbitrage de litige font l'objet d'un examen humain. Nous ne
      pratiquons pas de profilage publicitaire.
    </p>

    <h2>8. Vos droits</h2>
    <p>Conformément au RGPD, vous disposez des droits suivants :</p>
    <ul>
      <li><strong>Accès</strong> : obtenir une copie des données que nous détenons sur vous.</li>
      <li><strong>Rectification</strong> : corriger des données inexactes ou incomplètes.</li>
      <li><strong>Effacement</strong> : supprimer votre compte et vos données, sous réserve de nos obligations légales de conservation.</li>
      <li><strong>Limitation</strong> : restreindre un traitement dont vous contestez l'exactitude ou la licéité.</li>
      <li><strong>Portabilité</strong> : récupérer vos données dans un format structuré et lisible par machine.</li>
      <li><strong>Opposition</strong> : refuser un traitement fondé sur notre intérêt légitime, ainsi que la prospection.</li>
      <li><strong>Retrait du consentement</strong> : à tout moment, sans effet sur les traitements déjà réalisés.</li>
      <li><strong>Directives post-mortem</strong> : organiser le sort de vos données après votre décès (art. 85 de la loi Informatique et Libertés).</li>
    </ul>

    <h3>8.1 Droits exerçables directement, sans nous écrire</h3>
    <ul>
      <li>
        <strong>Accès et portabilité</strong> : bouton « Exporter mes données » dans
        <router-link to="/adherents/settings?section=donnees">vos paramètres</router-link>
        (export JSON immédiat).
      </li>
      <li>
        <strong>Rectification</strong> : onglet
        <router-link to="/adherents/settings?section=profil">« Profil »</router-link>
        de vos paramètres (pseudo, prénom, nom, bio, localisation, photo).
      </li>
      <li>
        <strong>Retrait du consentement marketing</strong> : case « Recevoir les actualités » dans
        <router-link to="/adherents/settings?section=donnees">vos paramètres</router-link>.
      </li>
      <li>
        <strong>Cookies de mesure d'audience</strong> : lien « Gérer mes cookies » dans le pied de page.
      </li>
      <li>
        <strong>Effacement</strong> : « Anonymiser mes données » ou « Supprimer mon compte », dans
        <router-link to="/adherents/settings?section=donnees">vos paramètres</router-link>.
      </li>
    </ul>

    <h3>8.2 Pour tout autre droit</h3>
    <p>
      Écrivez à <a :href="`mailto:${legal('dpoEmail')}`">{{ legal('dpoEmail') }}</a>. Nous répondons
      dans un délai d'un mois, prolongeable de deux mois pour les demandes complexes. Une preuve
      d'identité peut être demandée en cas de doute raisonnable sur l'identité du demandeur.
    </p>
    <p>
      Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
      auprès de la CNIL : 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —
      <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>.
    </p>

    <h2>9. Sécurité</h2>
    <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
    <ul>
      <li>chiffrement des échanges en transit (TLS) ;</li>
      <li>hachage des mots de passe avec bcrypt, jamais stockés en clair ;</li>
      <li>chiffrement au repos des messages, des documents d'identité et des identifiants de paiement ;</li>
      <li>double authentification (TOTP) disponible sur tous les comptes ;</li>
      <li>limitation du nombre de tentatives sur les points d'entrée sensibles ;</li>
      <li>journalisation des accès et des actions sensibles ;</li>
      <li>cloisonnement des accès administrateur et sauvegardes régulières.</li>
    </ul>
    <p>
      En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits, nous
      vous en informons et notifions la CNIL dans les 72 heures, conformément aux articles 33 et 34
      du RGPD.
    </p>

    <h2>10. Mineurs</h2>
    <p>
      Le service est réservé aux personnes majeures. Nous ne collectons pas sciemment de données
      concernant des mineurs. Si vous constatez qu'un compte a été créé par un mineur, signalez-le à
      <a :href="`mailto:${legal('dpoEmail')}`">{{ legal('dpoEmail') }}</a> : le compte sera clôturé
      et les données supprimées.
    </p>

    <h2>11. Cookies</h2>
    <p>
      Voir la <router-link to="/cookies">Politique cookies</router-link>. Aucun traceur non
      essentiel n'est déposé avant votre accord explicite.
    </p>

    <h2>12. Modifications</h2>
    <p>
      La présente politique peut être mise à jour. La date de dernière mise à jour figure en tête du
      document. En cas de modification substantielle des finalités, vous serez informé par email ou
      par une notification dans l'application, et votre consentement sera à nouveau recueilli
      lorsque celui-ci constitue la base légale du traitement.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, dataProcessors } from '@/config/legal';

export default defineComponent({
  name: 'PrivacyPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '3 septembre 2026' };
  },
  setup() {
    return { legal, isLegalMissing, dataProcessors };
  }
});
</script>
