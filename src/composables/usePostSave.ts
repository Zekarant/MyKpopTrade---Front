import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import postService, { type PostSaveResult } from '@/services/post.service';
import messagingService from '@/services/messaging.service';
import { func } from '@/function';
import { optionalAmount } from '@/components/offerRules';
import type { PostData } from '@/types/post.types';
import type { EditedPost, PwywSettings } from '@/views/adherents/add_post/postForm';

interface PostSaveOptions {
  form: Ref<PostData>;
  /** Photos dans leur ordre final : fichiers à envoyer et chemins conservés. */
  imageSources: () => (File | string)[];
  markImageUploaded: (file: File, path: string) => void;
  pwyw: Ref<PwywSettings>;
  /** Annonce modifiée, `null` en création. */
  editedPost: EditedPost | null;
}

const errorText = (error: unknown, fallback: string): string =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  || (error as { message?: string })?.message
  || fallback;

const apiFailureText = (result: Extract<PostSaveResult, { ok: false }>, fallback: string): string =>
  result.error?.message || result.error?.error?.message || fallback;

/**
 * Enregistrement d'une annonce en plusieurs appels (annonce, photos, prix
 * libre). En modification, un échec laisse l'utilisateur sur le formulaire :
 * chaque étape peut être relancée sans doublon.
 */
export function usePostSave({ form, imageSources, markImageUploaded, pwyw, editedPost }: PostSaveOptions) {
  const router = useRouter();
  const errorMessage = ref('');
  const saveLoading = ref(false);
  let pwywInitiallyEnabled = Boolean(editedPost?.isPayWhatYouWant);

  /** Active, met à jour ou retire le prix libre selon le formulaire. */
  async function savePayWhatYouWant(productId: string) {
    if (pwyw.value.enabled) {
      await messagingService.initiatePayWhatYouWant({
        productId,
        minimumPrice: optionalAmount(pwyw.value.min) ?? 0,
        maximumPrice: optionalAmount(pwyw.value.max),
      });
    } else if (pwywInitiallyEnabled) {
      await messagingService.disablePayWhatYouWant(productId);
    }
    pwywInitiallyEnabled = pwyw.value.enabled;
  }

  const goToMyProfile = () => router.push({ name: 'profile', params: { id: 'me' } });

  async function update(post: PostData, edited: EditedPost) {
    const result = await postService.updatePost(edited._id || edited.id, post);
    if (!result.ok) {
      errorMessage.value = apiFailureText(result, 'Erreur lors de la modification de l\'annonce');
      return;
    }
    try {
      await postService.syncProductImages(result.productId, post.images, markImageUploaded);
    } catch (e) {
      errorMessage.value = `Annonce enregistrée, mais les photos n'ont pas pu être mises à jour : ${errorText(e, 'réessayez.')}`;
      return;
    }
    try {
      await savePayWhatYouWant(result.productId);
    } catch (e) {
      errorMessage.value = `Annonce enregistrée, mais le prix libre n'a pas pu être mis à jour : ${errorText(e, 'réessayez.')}`;
      return;
    }
    goToMyProfile();
  }

  async function create(post: PostData) {
    const result = await postService.createPost(post);
    if (!result.ok) {
      errorMessage.value = apiFailureText(result, 'Erreur lors de la création du produit');
      return;
    }
    // L'annonce existe déjà : on ne reste pas sur le formulaire, qui la recréerait.
    try {
      await savePayWhatYouWant(result.productId);
    } catch (e) {
      func.showToastError(`Annonce publiée, mais le prix libre n'a pas pu être activé : ${errorText(e, 'modifiez l\'annonce pour réessayer.')}`);
    }
    goToMyProfile();
  }

  async function save() {
    errorMessage.value = '';
    saveLoading.value = true;
    const post: PostData = { ...form.value, images: imageSources() };
    try {
      await (editedPost ? update(post, editedPost) : create(post));
    } catch (e) {
      errorMessage.value = errorText(e, 'Erreur lors de l\'enregistrement de l\'annonce');
    } finally {
      saveLoading.value = false;
    }
  }

  return { save, saveLoading, errorMessage };
}
