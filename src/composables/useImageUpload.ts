import { computed, ref } from 'vue';
import { mediaUrl } from '@/utils/format';

/** Photo d'un formulaire : fichier à envoyer ou chemin déjà en ligne, avec son aperçu. */
export interface UploadedImage {
  /** Clé stable pour `v-for` : l'index se décale à chaque suppression. */
  id: number;
  source: File | string;
  /** Data URL d'un fichier (vide le temps de sa lecture) ou URL du média en ligne. */
  preview: string;
}

export interface ImageUploadOptions {
  maxFiles: number;
  /** Message affiché quand le lot dépasse la place restante. */
  tooManyMessage: (currentCount: number) => string;
  /** Garde ce qui tient dans la place restante plutôt que de refuser tout le lot. */
  keepWhatFits?: boolean;
  /** Motif de refus d'un fichier (type, poids), ou `null` s'il est accepté : un refus annule le lot. */
  rejectReason?: (file: File) => string | null;
}

// Compteur de module : deux formulaires ouverts successivement ne réutilisent jamais une clé.
let nextImageId = 0;

/**
 * Photos d'un formulaire (annonce, avis) : ajout dans une limite, aperçus et
 * suppression. Chaque photo porte son fichier et son aperçu ensemble : l'ordre
 * de lecture des fichiers, asynchrone, ne peut plus désaligner les deux listes.
 */
export function useImageUpload(options: ImageUploadOptions) {
  const images = ref<UploadedImage[]>([]);
  const error = ref('');

  const canAddMore = computed(() => images.value.length < options.maxFiles);

  function acceptedFiles(files: File[]): File[] {
    const room = options.maxFiles - images.value.length;
    if (files.length > room && !(options.keepWhatFits && room > 0)) {
      error.value = options.tooManyMessage(images.value.length);
      return [];
    }
    const batch = files.slice(0, room);
    for (const file of batch) {
      const reason = options.rejectReason?.(file);
      if (reason) {
        error.value = reason;
        return [];
      }
    }
    return batch;
  }

  function readPreview(file: File, id: number) {
    const reader = new FileReader();
    reader.onload = () => {
      // Photo retirée pendant la lecture : plus rien à mettre à jour.
      const image = images.value.find((item) => item.id === id);
      if (image && typeof reader.result === 'string') image.preview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function addFiles(fileList: FileList | File[] | null | undefined) {
    error.value = '';
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    for (const file of acceptedFiles(files)) {
      const image: UploadedImage = { id: nextImageId++, source: file, preview: '' };
      images.value.push(image);
      readPreview(file, image.id);
    }
  }

  /** Photos déjà en ligne d'une annonce modifiée. */
  function addExistingImages(paths: string[]) {
    for (const path of paths) {
      images.value.push({ id: nextImageId++, source: path, preview: mediaUrl(path) });
    }
  }

  function removeImage(id: number) {
    images.value = images.value.filter((image) => image.id !== id);
  }

  /** Un fichier envoyé devient son chemin : relancer l'enregistrement ne le renverra pas. */
  function markUploaded(file: File, path: string) {
    const image = images.value.find((item) => item.source === file);
    if (image) image.source = path;
  }

  return { images, error, canAddMore, addFiles, addExistingImages, removeImage, markUploaded };
}
