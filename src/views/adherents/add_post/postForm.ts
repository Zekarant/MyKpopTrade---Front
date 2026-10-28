import type { PostData, ProductDetail } from '@/types/post.types';

/** Annonce modifiée, transmise en JSON par la query `postData`. */
export type EditedPost = ProductDetail & { id?: string };

/** Prix libre, enregistré après l'annonce via POST /api/messaging/pwyw. */
export interface PwywSettings {
  enabled: boolean;
  /** `''` : champ vidé (`v-model.number` rend alors une chaîne). */
  min: number | '';
  max: number | '';
}

export const MAX_POST_IMAGES = 10;

export const TYPE_LABELS: Record<string, string> = {
  photocard: 'Photocard',
  album: 'Album',
  merch: 'Merch',
  other: 'Autre',
};

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  likeNew: 'Comme neuf',
  good: 'Bon état',
  fair: 'État moyen',
  poor: 'Mauvais état',
};

export function emptyPostForm(): PostData {
  return {
    title: '',
    description: '',
    price: 0,
    currency: 'EUR',
    condition: 'new',
    category: '',
    type: 'photocard',
    kpopGroup: '',
    kpopMember: '',
    albumName: '',
    group: null,
    member: null,
    album: null,
    version: null,
    era: null,
    pob: null,
    isOfficial: undefined,
    allowOffers: true,
    images: [],
    shippingOptions: {
      worldwide: false,
      nationalOnly: false,
      localPickup: false,
      nationalCost: null,
      worldwideCost: null,
    },
  };
}

/** Annonce à modifier, ou `null` en création (query absente ou illisible). */
export function parseEditedPost(raw: unknown): EditedPost | null {
  if (typeof raw !== 'string' || !raw || raw === 'undefined') return null;
  try {
    return JSON.parse(raw) as EditedPost;
  } catch (error) {
    console.error('Error parsing postData:', error);
    return null;
  }
}

/**
 * Formulaire prérempli depuis l'annonce modifiée. Les photos sont gérées à part
 * (useImageUpload) : `images` reste vide ici et n'est rempli qu'à l'envoi.
 */
export function formFromEditedPost(post: EditedPost): {
  form: PostData;
  pwyw: PwywSettings;
  groupLabel: string;
  albumLabel: string;
} {
  const form: PostData = { ...emptyPostForm(), ...post, images: [] };
  // Une annonce antérieure aux coûts par mode n'a que le champ unique `shippingCost`.
  const { shippingCost: legacyCost, ...shippingOptions } = form.shippingOptions;
  form.shippingOptions = {
    ...shippingOptions,
    nationalCost: shippingOptions.nationalCost ?? legacyCost ?? null,
    worldwideCost: shippingOptions.worldwideCost ?? legacyCost ?? null,
  };
  // Une annonce antérieure aux champs structurés n'a que les identifiants
  // résolus par l'API : les reprendre la rend filtrable dès son enregistrement.
  form.group = post.group ?? post.kpopGroupId ?? null;
  form.album = post.album ?? post.albumId ?? null;
  form.isOfficial = post.isOfficial ?? undefined;

  return {
    form,
    pwyw: {
      enabled: Boolean(post.isPayWhatYouWant),
      min: post.pwywMinPrice ?? '',
      max: post.pwywMaxPrice ?? '',
    },
    // Libellés résolus par l'API : sans eux, les champs groupe et album paraissent vides.
    groupLabel: post.kpopGroupName ?? '',
    albumLabel: post.albumNameStr ?? '',
  };
}
