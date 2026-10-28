import { ref } from 'vue';

/**
 * Zone de dépôt de fichiers doublée d'un champ `<input type="file">` caché :
 * glisser-déposer, sélection classique et état de survol pour le style.
 */
export function useFileDropZone(onFiles: (files: FileList | null | undefined) => void) {
  const isDragging = ref(false);
  const fileInput = ref<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInput.value?.click();
  const onDragOver = () => { isDragging.value = true; };
  const onDragLeave = () => { isDragging.value = false; };

  function onDrop(event: DragEvent) {
    isDragging.value = false;
    onFiles(event.dataTransfer?.files);
  }

  function onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    onFiles(input.files);
    // Sans remise à zéro, choisir à nouveau le même fichier ne déclencherait pas `change`.
    input.value = '';
  }

  return { isDragging, fileInput, openFilePicker, onDragOver, onDragLeave, onDrop, onInputChange };
}
