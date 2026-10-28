import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Focus d'une boîte de dialogue affichée par `v-if` : à l'ouverture, il passe
 * sur `initialFocus` ou, à défaut, sur son premier élément focusable ; à la
 * fermeture, il revient à l'élément qui l'avait, pour qu'un utilisateur au
 * clavier ne reparte pas du haut de la page.
 */
export function useDialogFocus(
  dialog: Readonly<Ref<HTMLElement | null>>,
  initialFocus?: Readonly<Ref<HTMLElement | null>>
): void {
  let opener: HTMLElement | null = null;

  onMounted(async () => {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    const target = initialFocus?.value ?? dialog.value?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog.value;
    target?.focus();
  });

  onBeforeUnmount(() => {
    opener?.focus();
  });
}
