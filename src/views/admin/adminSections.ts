export interface AdminSection {
  id: string;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
  badgeKey?: 'total' | 'report' | 'dispute' | 'verification' | 'deletion';
}

export interface AdminNavGroup {
  title?: string;
  items: AdminSection[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    items: [
      {
        id: 'queue',
        label: 'À traiter',
        icon: 'bi bi-inbox',
        title: 'File d\'attente',
        subtitle: 'Tout ce qui attend une décision, du plus ancien au plus récent',
        badgeKey: 'total'
      },
      {
        id: 'overview',
        label: 'Vue d\'ensemble',
        icon: 'bi bi-speedometer2',
        title: 'Vue d\'ensemble',
        subtitle: 'Activité de la plateforme sur les 30 derniers jours'
      }
    ]
  },
  {
    title: 'Modération',
    items: [
      {
        id: 'reports',
        label: 'Signalements',
        icon: 'bi bi-flag',
        title: 'Signalements',
        subtitle: 'Contenus signalés par la communauté',
        badgeKey: 'report'
      },
      {
        id: 'disputes',
        label: 'Litiges',
        icon: 'bi bi-shield-exclamation',
        title: 'Litiges',
        subtitle: 'Arbitrage des transactions contestées',
        badgeKey: 'dispute'
      },
      {
        id: 'moderation',
        label: 'Posts',
        icon: 'bi bi-chat-left-text',
        title: 'Modération des posts',
        subtitle: 'Publications et réponses de la communauté'
      },
      {
        id: 'verifications',
        label: 'Vérifications',
        icon: 'bi bi-patch-check',
        title: 'Vérifications d\'identité',
        subtitle: 'Pièces d\'identité en attente d\'examen',
        badgeKey: 'verification'
      }
    ]
  },
  {
    title: 'Catalogue',
    items: [
      {
        id: 'products',
        label: 'Produits',
        icon: 'bi bi-box-seam',
        title: 'Produits',
        subtitle: 'Annonces publiées sur la marketplace'
      },
      {
        id: 'kpop',
        label: 'K-pop',
        icon: 'bi bi-music-note-beamed',
        title: 'Gestion K-pop',
        subtitle: 'Groupes et albums de référence'
      }
    ]
  },
  {
    title: 'Comptes',
    items: [
      {
        id: 'users',
        label: 'Utilisateurs',
        icon: 'bi bi-people',
        title: 'Utilisateurs',
        subtitle: 'Rôles, suspensions et statuts de compte'
      },
      {
        id: 'rgpd',
        label: 'RGPD',
        icon: 'bi bi-shield-lock',
        title: 'RGPD & données personnelles',
        subtitle: 'Exports, anonymisations et demandes de suppression',
        badgeKey: 'deletion'
      }
    ]
  },
  {
    title: 'Système',
    items: [
      {
        id: 'audit',
        label: 'Audit',
        icon: 'bi bi-journal-text',
        title: 'Journal d\'audit',
        subtitle: 'Historique des actions d\'administration'
      }
    ]
  }
];

export const ADMIN_SECTIONS: Record<string, AdminSection> = ADMIN_NAV.reduce(
  (acc, group) => {
    group.items.forEach((item) => {
      acc[item.id] = item;
    });
    return acc;
  },
  {} as Record<string, AdminSection>
);

export const DEFAULT_ADMIN_TAB = 'queue';
