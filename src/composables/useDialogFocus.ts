import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';

/** Boîtes ouvertes, la plus récente en dernier : seule elle réagit au clavier. */
const openDialogs: symbol[] = [];

function focusableIn(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'));
}

/**
 * Focus d'une boîte de dialogue affichée par `v-if` : à l'ouverture, il passe
 * sur `initialFocus` ou, à défaut, sur son premier élément focusable ; Tab et
 * Maj+Tab restent dans la boîte ; Escape appelle `onEscape` ; à la fermeture,
 * le focus revient à l'élément qui l'avait, pour qu'un utilisateur au clavier
 * ne reparte pas du haut de la page. Quand des boîtes s'empilent, seule la
 * dernière ouverte réagit.
 */
export function useDialogFocus(
  dialog: Readonly<Ref<HTMLElement | null>>,
  initialFocus?: Readonly<Ref<HTMLElement | null>>,
  onEscape?: () => void
): void {
  const id = Symbol('dialog');
  let opener: HTMLElement | null = null;

  function onKeydown(event: KeyboardEvent) {
    if (openDialogs[openDialogs.length - 1] !== id || !dialog.value) return;

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = focusableIn(dialog.value);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const outside = !dialog.value.contains(active);
    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }

  onMounted(async () => {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openDialogs.push(id);
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    const target = initialFocus?.value ?? dialog.value?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog.value;
    target?.focus();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown);
    openDialogs.splice(openDialogs.indexOf(id), 1);
    opener?.focus();
  });
}
