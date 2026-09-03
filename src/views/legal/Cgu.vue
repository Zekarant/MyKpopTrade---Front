<template>
  <LegalLayout title="Conditions Générales d'Utilisation" :updated-at="updatedAt">
    <h2>1. Objet et acceptation</h2>
    <p>
      Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation
      de la plateforme MyKpopTrade (la « Plateforme »), éditée par
      <span :class="{ placeholder: isLegalMissing('companyName') }">{{ legal('companyName') }}</span>
      <template v-if="legalApplies('legalForm')">,
        <span :class="{ placeholder: isLegalMissing('legalForm') }">{{ legal('legalForm') }}</span>
        au capital de <span :class="{ placeholder: isLegalMissing('capital') }">{{ legal('capital') }}</span>,
        immatriculée au RCS de <span :class="{ placeholder: isLegalMissing('rcsCity') }">{{ legal('rcsCity') }}</span>
        sous le numéro <span :class="{ placeholder: isLegalMissing('siren') }">{{ legal('siren') }}</span></template>,
      dont l'adresse est
      <span :class="{ placeholder: isLegalMissing('headquarters') }">{{ legal('headquarters') }}</span>
      (l'« Éditeur »). Les coordonnées complètes figurent dans les
      <router-link to="/legal">mentions légales</router-link>.
    </p>
    <p>
      La création d'un compte vaut acceptation sans réserve des présentes CGU. L'Utilisateur qui ne
      les accepte pas doit renoncer à utiliser la Plateforme.
    </p>

    <h2>2. Définitions</h2>
    <ul>
      <li><strong>Plateforme</strong> : le site web et les services accessibles à l'adresse mykpoptrade.com.</li>
      <li><strong>Utilisateur</strong> : toute personne physique majeure inscrite sur la Plateforme.</li>
      <li><strong>Vendeur</strong> : Utilisateur proposant des Produits à la vente.</li>
      <li><strong>Acheteur</strong> : Utilisateur réalisant un achat sur la Plateforme.</li>
      <li><strong>Produit</strong> : tout article (photocard, album, merchandising, etc.) proposé à la vente.</li>
      <li><strong>Annonce</strong> : la fiche décrivant un Produit mis en vente.</li>
    </ul>

    <h2>3. Rôle de l'Éditeur</h2>
    <p>
      L'Éditeur fournit un service technique de mise en relation. Il <strong>n'est pas partie</strong>
      aux contrats de vente conclus entre Utilisateurs : la vente est conclue directement entre
      l'Acheteur et le Vendeur, qui en supportent seuls les obligations.
    </p>
    <p>
      L'Éditeur n'a pas d'obligation générale de surveillance des contenus publiés. Il agit en
      qualité d'hébergeur au sens de l'article 6-I-2 de la LCEN et de l'article 6 du règlement (UE)
      2022/2065, et retire promptement tout contenu manifestement illicite qui lui est signalé.
    </p>

    <h2>4. Statut de la Plateforme — phase de bêta</h2>
    <p>
      La Plateforme est fournie en <strong>version bêta</strong>. Elle peut comporter des
      dysfonctionnements, être indisponible sans préavis, et ses fonctionnalités peuvent évoluer ou
      être retirées. Les modalités et limites de cette phase sont détaillées sur la page
      <router-link to="/beta">À propos de la bêta</router-link>.
    </p>

    <h2>5. Inscription et compte</h2>
    <h3>5.1 Conditions d'accès</h3>
    <p>
      L'inscription est réservée aux <strong>personnes physiques majeures</strong> (18 ans révolus)
      disposant de la capacité juridique de contracter. La Plateforme n'est pas destinée aux
      mineurs ; un compte créé par un mineur est clôturé dès que l'Éditeur en a connaissance.
    </p>

    <h3>5.2 Exactitude des informations</h3>
    <p>
      L'Utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.
      <strong>Un seul compte par personne</strong> est autorisé. La création de comptes multiples,
      notamment pour contourner une suspension ou influencer des évaluations, entraîne la clôture de
      l'ensemble des comptes concernés.
    </p>

    <h3>5.3 Sécurité des identifiants</h3>
    <p>
      L'Utilisateur est responsable de la confidentialité de ses identifiants et de toute activité
      réalisée depuis son compte. L'activation de la double authentification est recommandée depuis
      les paramètres du compte. Toute utilisation frauduleuse suspectée doit être signalée sans
      délai à <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>.
    </p>

    <h3>5.4 Vérification d'identité</h3>
    <p>
      L'Éditeur peut demander la vérification de l'adresse email, du numéro de téléphone ou d'un
      document d'identité, notamment pour lever une limitation de vente ou instruire un litige. Le
      refus de se soumettre à une vérification justifiée peut entraîner la suspension de la
      possibilité de vendre.
    </p>

    <h2>6. Règles de publication</h2>
    <h3>6.1 Obligations générales</h3>
    <p>L'Utilisateur s'engage à ne pas :</p>
    <ul>
      <li>publier de Produits illicites, contrefaits, volés ou dont il n'est pas propriétaire ;</li>
      <li>tromper sciemment un Acheteur sur la nature, l'authenticité ou l'état d'un Produit ;</li>
      <li>utiliser la Plateforme à des fins de blanchiment, de fraude, de harcèlement ou de démarchage ;</li>
      <li>contourner les paiements en proposant ou en acceptant une transaction hors Plateforme ;</li>
      <li>publier des contenus injurieux, diffamatoires, haineux, racistes, sexistes, à caractère sexuel ou contraires à l'ordre public ;</li>
      <li>collecter les données d'autres Utilisateurs, ou automatiser l'accès à la Plateforme (scraping, robots) sans autorisation écrite ;</li>
      <li>publier les coordonnées personnelles d'un tiers sans son accord.</li>
    </ul>

    <h3>6.2 Produits interdits à la vente</h3>
    <p>Sont notamment interdits sur la Plateforme :</p>
    <ul>
      <li>
        les <strong>contrefaçons</strong> et reproductions non officielles présentées comme
        authentiques, ainsi que les impressions maison de photocards vendues comme officielles ;
      </li>
      <li>
        les <strong>billets de concert et d'événement</strong> : leur revente habituelle sans
        autorisation de l'organisateur est sanctionnée par l'article 313-6-2 du Code pénal ;
      </li>
      <li>les fichiers numériques, comptes de service, codes d'accès et contenus dématérialisés obtenus illégalement ;</li>
      <li>les objets dont la vente est réglementée ou prohibée (produits dangereux, denrées alimentaires périssables, cosmétiques hors circuit autorisé) ;</li>
      <li>les Produits dont la description est volontairement incomplète pour dissimuler un défaut ;</li>
      <li>tout Produit sans lien avec l'objet de la Plateforme.</li>
    </ul>

    <h3>6.3 Licence sur les contenus publiés</h3>
    <p>
      L'Utilisateur conserve la propriété des contenus qu'il publie (photos, descriptions, avis). Il
      accorde à l'Éditeur une licence non exclusive, gratuite et pour la durée de publication,
      permettant leur affichage, leur redimensionnement et leur reproduction aux seules fins de
      fonctionnement et de promotion de la Plateforme. Cette licence prend fin au retrait du contenu,
      sous réserve des copies de sauvegarde et des obligations de conservation légales.
    </p>
    <p>
      L'Utilisateur garantit détenir les droits sur les contenus qu'il publie, notamment sur les
      photographies des Produits.
    </p>

    <h2>7. Transactions</h2>
    <h3>7.1 Mise en vente</h3>
    <p>
      Le Vendeur garantit être propriétaire du Produit, en avoir la libre disposition, et que celui-ci
      est conforme à la description fournie. Les prix sont fixés librement par le Vendeur et
      s'affichent <strong>toutes taxes comprises</strong>, frais de livraison indiqués séparément.
    </p>

    <h3>7.2 Paiement et frais</h3>
    <p>
      Les paiements sont traités par <strong>PayPal</strong>. L'Éditeur n'a accès à aucune donnée
      bancaire. Pour recevoir le produit de ses ventes, le Vendeur doit connecter un compte PayPal
      valide depuis ses paramètres.
    </p>
    <p>
      L'Éditeur peut prélever une <strong>commission de service</strong> sur chaque vente. Son
      montant ou son taux est affiché à l'Utilisateur <strong>avant la validation</strong> de la mise
      en vente et de l'achat. Aucune commission n'est due sur une vente annulée ou intégralement
      remboursée. Les frais éventuellement facturés par PayPal restent régis par les conditions de
      ce prestataire.
    </p>

    <h3>7.3 Expédition</h3>
    <p>
      Le Vendeur dispose de <strong>5 jours ouvrés</strong> à compter de la réception du paiement
      pour expédier le Produit et renseigner le numéro de suivi sur la Plateforme. À défaut,
      l'Acheteur peut demander l'annulation de la commande et le remboursement.
    </p>
    <p>
      Le Vendeur choisit un mode d'expédition adapté à la valeur du Produit. Le risque de perte ou
      d'avarie pendant le transport pèse sur le Vendeur jusqu'à la remise du Produit à l'Acheteur.
    </p>

    <h3>7.4 Réception</h3>
    <p>
      L'Acheteur dispose de <strong>14 jours</strong> à compter de l'expédition pour confirmer la
      réception ou ouvrir un litige. À défaut d'action de sa part dans ce délai, la livraison est
      automatiquement réputée conforme et les fonds sont libérés au profit du Vendeur.
    </p>

    <h3>7.5 Droit de rétractation</h3>
    <p>
      Le droit de rétractation prévu aux articles L.221-18 et suivants du Code de la consommation
      s'applique aux contrats conclus entre un professionnel et un consommateur. Il <strong>ne
      s'applique pas</strong> aux ventes conclues entre deux particuliers, qui constituent le cas
      général sur la Plateforme.
    </p>
    <p>
      Un Vendeur agissant à titre professionnel est en revanche tenu d'accorder à l'Acheteur
      consommateur un droit de rétractation de 14 jours, ainsi que les garanties légales de
      conformité et des vices cachés. Il lui appartient de se déclarer comme tel.
    </p>

    <h2>8. Litiges entre Utilisateurs</h2>
    <p>
      En cas de désaccord sur une transaction (Produit non reçu, non conforme, endommagé), les
      parties ouvrent un litige depuis leur espace personnel, dans un délai de 14 jours après
      l'expédition.
    </p>
    <p>
      L'Éditeur propose un arbitrage à titre de service, sur la base des éléments fournis par les
      parties (photos, échanges, preuve de dépôt et de suivi), dans un délai indicatif de
      <strong>7 jours ouvrés</strong>. Il peut décider du remboursement total ou partiel, ou de la
      libération des fonds. Cette décision est une mesure contractuelle de bonne administration du
      service ; elle ne prive aucune partie de son droit de saisir la juridiction compétente.
    </p>

    <h2>9. Avis et évaluations</h2>
    <p>
      Un avis ne peut être déposé qu'à la suite d'une transaction réellement effectuée sur la
      Plateforme. Les avis sont publiés par ordre chronologique et ne font l'objet d'aucune
      contrepartie. Conformément à l'article L.111-7-2 du Code de la consommation, l'Éditeur indique
      la date de publication de chaque avis et ne modifie pas leur contenu.
    </p>
    <p>
      Sont supprimés les avis manifestement injurieux, sans rapport avec la transaction, contenant
      des données personnelles, ou obtenus contre rémunération. Le Vendeur peut publier une réponse
      publique à un avis le concernant.
    </p>

    <h2>10. Classement et référencement des Annonces</h2>
    <p>
      Conformément à l'article L.111-7 du Code de la consommation, l'Éditeur précise que le
      classement par défaut des Annonces dans les résultats de recherche repose sur la pertinence
      par rapport aux termes recherchés et sur la date de publication. Les critères de tri
      alternatifs (prix, date) sont accessibles à l'Utilisateur. Aucun Vendeur ne peut obtenir une
      meilleure position contre rémunération, et aucun lien capitalistique n'influence le classement.
    </p>

    <h2>11. Modération, signalement et recours</h2>
    <p>
      Tout Utilisateur peut signaler un contenu illicite depuis l'interface ou par email à
      <a :href="`mailto:${legal('contactEmail')}`">{{ legal('contactEmail') }}</a>. La procédure
      complète figure dans les <router-link to="/legal">mentions légales</router-link>.
    </p>
    <p>
      L'Éditeur peut retirer un contenu, restreindre la visibilité d'une Annonce, suspendre ou
      clôturer un compte en cas de manquement aux présentes CGU ou de contenu illicite. Sauf
      interdiction légale, la décision est notifiée à l'Utilisateur concerné avec ses motifs. Elle
      peut être contestée pendant <strong>6 mois</strong> en répondant à cette notification ; la
      réclamation est réexaminée par une personne n'ayant pas pris la décision initiale.
    </p>
    <p>
      En cas de manquement grave (fraude, contrefaçon, mise en danger d'autrui), la suspension peut
      être immédiate et sans préavis.
    </p>

    <h2>12. Obligations fiscales et déclaratives</h2>
    <p>
      Chaque Vendeur est seul responsable de la déclaration de ses revenus et du respect de ses
      obligations fiscales et sociales. La vente occasionnelle de biens personnels d'occasion n'est
      en principe pas imposable ; une activité habituelle et lucrative l'est, et peut imposer une
      immatriculation.
    </p>
    <p>
      En application de l'article 242 bis du Code général des impôts et de la directive (UE)
      2021/514 (« DAC7 »), l'Éditeur informe chaque Vendeur, en janvier de chaque année, du montant
      brut des transactions qu'il a réalisées l'année précédente, et transmet ces informations à
      l'administration fiscale lorsque les seuils légaux sont atteints.
    </p>

    <h2>13. Responsabilité</h2>
    <p>
      L'Éditeur est tenu d'une obligation de moyens quant à la disponibilité et à la sécurité de la
      Plateforme. Il ne garantit pas l'absence d'interruption ni d'erreur, en particulier pendant la
      phase de bêta.
    </p>
    <p>
      L'Éditeur ne répond pas de l'exécution des ventes entre Utilisateurs, de la conformité ou de
      l'authenticité des Produits, ni des contenus publiés par les Utilisateurs. Sa responsabilité
      est limitée aux dommages directs et prévisibles résultant d'un manquement avéré à ses propres
      obligations. Aucune stipulation des présentes CGU n'exclut la responsabilité de l'Éditeur en
      cas de faute lourde, de dol ou d'atteinte à l'intégrité physique.
    </p>

    <h2>14. Suspension et résiliation</h2>
    <p>
      L'Utilisateur peut supprimer son compte à tout moment depuis ses paramètres. La suppression est
      effective après un délai de <strong>30 jours</strong>, pendant lequel elle reste annulable, et
      sous réserve de l'achèvement des transactions en cours.
    </p>
    <p>
      L'Éditeur peut résilier un compte en cas de manquement aux CGU, ou cesser d'exploiter la
      Plateforme moyennant un préavis de 30 jours annoncé sur le site. Certaines données sont
      conservées après clôture pour la durée imposée par la loi (cf.
      <router-link to="/privacy">Politique de confidentialité</router-link>).
    </p>

    <h2>15. Propriété intellectuelle de la Plateforme</h2>
    <p>
      Les marques, logos, contenus éditoriaux, bases de données et fonctionnalités de la Plateforme
      sont protégés et demeurent la propriété exclusive de l'Éditeur. Aucune disposition des
      présentes CGU ne confère de licence sur ces éléments.
    </p>

    <h2>16. Données personnelles</h2>
    <p>
      Le traitement des données personnelles est décrit dans la
      <router-link to="/privacy">Politique de confidentialité</router-link>, et l'usage des traceurs
      dans la <router-link to="/cookies">Politique cookies</router-link>.
    </p>

    <h2>17. Modification des CGU</h2>
    <p>
      L'Éditeur peut modifier les CGU. Les Utilisateurs sont informés au moins
      <strong>15 jours</strong> avant l'entrée en vigueur d'une modification substantielle. La
      poursuite de l'utilisation de la Plateforme après cette date vaut acceptation ; à défaut,
      l'Utilisateur peut supprimer son compte sans frais.
    </p>

    <h2>18. Force majeure</h2>
    <p>
      Aucune partie ne peut être tenue responsable d'un manquement résultant d'un événement de force
      majeure au sens de l'article 1218 du Code civil, notamment une panne généralisée des réseaux
      de communication ou une défaillance de l'hébergeur ou du prestataire de paiement.
    </p>

    <h2>19. Dispositions diverses</h2>
    <ul>
      <li>
        <strong>Nullité partielle</strong> : si une clause est déclarée nulle, les autres
        stipulations demeurent applicables.
      </li>
      <li>
        <strong>Non-renonciation</strong> : le fait de ne pas invoquer un manquement ne vaut pas
        renonciation à s'en prévaloir ultérieurement.
      </li>
      <li>
        <strong>Cession</strong> : l'Éditeur peut transférer les présentes CGU en cas de
        réorganisation ou de cession d'activité, sans dégradation des droits des Utilisateurs.
      </li>
      <li>
        <strong>Langue</strong> : la version française des CGU est la seule faisant foi.
      </li>
      <li>
        <strong>Preuve</strong> : les journaux techniques de l'Éditeur sont admis comme mode de
        preuve des actions réalisées sur la Plateforme, sauf preuve contraire.
      </li>
    </ul>

    <h2>20. Droit applicable et juridiction</h2>
    <p>
      Les présentes CGU sont soumises au droit français. Avant toute action judiciaire, les parties
      s'efforcent de trouver une solution amiable, le cas échéant par la médiation décrite dans les
      <router-link to="/legal">mentions légales</router-link>.
    </p>
    <p>
      À défaut d'accord, tout litige relève des tribunaux compétents de
      <span :class="{ placeholder: isLegalMissing('courtCity') }">{{ legal('courtCity') }}</span>,
      sous réserve des dispositions impératives permettant au consommateur de saisir la juridiction
      de son lieu de résidence.
    </p>
  </LegalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LegalLayout from './LegalLayout.vue';
import { legal, isLegalMissing, legalApplies } from '@/config/legal';

export default defineComponent({
  name: 'CguPage',
  components: { LegalLayout },
  data() {
    return { updatedAt: '3 septembre 2026' };
  },
  setup() {
    return { legal, isLegalMissing, legalApplies };
  }
});
</script>
