import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue';
import { validatePwywSettings } from '@/components/offerRules';
import type { PostData } from '@/types/post.types';

/** Découpage purement visuel du formulaire de vente : les données restent un objet unique. */
export const SELL_STEPS = [
  { id: 1, label: 'Photos' },
  { id: 2, label: 'Informations' },
  { id: 3, label: 'K-pop' },
  { id: 4, label: 'Livraison' },
  { id: 5, label: 'Vérification' },
] as const;

export interface BlockingIssue {
  step: number;
  message: string;
}

interface PostFormState {
  form: Ref<PostData>;
  imageCount: MaybeRefOrGetter<number>;
  pwyw: Ref<{ enabled: boolean; min: unknown; max: unknown }>;
}

/**
 * Points qui empêchent de publier, rattachés à leur étape : ils servent au
 * bouton « Continuer » comme au récapitulatif final.
 */
export function usePostFormValidation({ form, imageCount, pwyw }: PostFormState) {
  // Une photocard représente un membre : sans lui, l'annonce est introuvable par membre.
  const isMemberRequired = computed(() => form.value.type === 'photocard');

  function blockingIssuesForStep(step: number): BlockingIssue[] {
    const data = form.value;
    const issues: BlockingIssue[] = [];
    const add = (message: string) => issues.push({ step, message });

    if (step === 1 && toValue(imageCount) === 0) add('Ajoutez au moins une photo.');

    if (step === 2) {
      if (!data.title?.trim()) add('Donnez un titre à l\'annonce.');
      if (!data.description?.trim()) add('Décrivez l\'article.');
      if (!(Number(data.price) > 0)) add('Indiquez un prix supérieur à 0.');
      if (!data.category?.trim()) add('Renseignez une catégorie.');
    }

    if (step === 3) {
      if (!data.kpopGroup) add('Sélectionnez un groupe K-pop.');
      if (isMemberRequired.value && !data.kpopMember?.trim()) {
        add('Indiquez le membre concerné par la photocard.');
      }
    }

    if (step === 4) {
      const shipping = data.shippingOptions;
      if (!shipping.worldwide && !shipping.nationalOnly && !shipping.localPickup) {
        add('Choisissez au moins une option de livraison.');
      }
      const pwywIssue = pwyw.value.enabled ? validatePwywSettings(pwyw.value.min, pwyw.value.max) : null;
      if (pwywIssue) add(pwywIssue);
    }

    return issues;
  }

  const allBlockingIssues = computed(() => SELL_STEPS.flatMap((step) => blockingIssuesForStep(step.id)));

  return { isMemberRequired, blockingIssuesForStep, allBlockingIssues };
}
