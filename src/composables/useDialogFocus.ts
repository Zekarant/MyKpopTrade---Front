import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';
const TEXT_FIELDS = 'textarea, input:not([type]), input[type="text"], input[type="number"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"]';
export const DISCARD_TEXT_QUESTION = 'Abandonner le texte saisi ?';

/** Boîtes ouvertes, la plus récente en dernier : seule elle réagit au clavier. */
const openDialogs: symbol[] = [];

function focusableIn(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'));
}

function textFieldsIn(dialog: HTMLElement): (HTMLInputElement | HTMLTextAreaElement)[] {
  return [...dialog.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(TEXT_FIELDS)];
}

/**
 * Focus d'une boîte de dialogue affichée par `v-if` : à l'ouverture, il passe
 * sur `initialFocus` ou, à défaut, sur son premier élément focusable ; Tab et
 * Maj+Tab restent dans la boîte ; Escape appelle `onEscape` ; à la fermeture,
 * le focus revient à l'élément qui l'avait, pour qu'un utilisateur au clavier
 * ne reparte pas du haut de la page. Quand des boîtes s'empilent, seule la
 * dernière ouverte réagit.
 *
 * Escape est vite pressé par mégarde : si un champ texte a été rempli depuis
 * l'ouverture, on demande confirmation avant de perdre la saisie.
 */
export function useDialogFocus(
  dialog: Readonly<Ref<HTMLElement | null>>,
  initialFocus?: Readonly<Ref<HTMLElement | null>>,
  onEscape?: () => void
): void {
  const id = Symbol('dialog');
  let opener: HTMLElement | null = null;
  // Valeurs des champs à l'ouverture : un montant pré-rempli n'est pas une saisie.
  const initialValues = new WeakMap<Element, string>();

  function hasUnsentText(container: HTMLElement): boolean {
    return textFieldsIn(container).some(
      (field) => field.value.trim() !== '' && field.value !== (initialValues.get(field) ?? '')
    );
  }

  function onKeydown(event: KeyboardEvent) {
    if (openDialogs[openDialogs.length - 1] !== id || !dialog.value) return;

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      if (hasUnsentText(dialog.value) && !confirm(DISCARD_TEXT_QUESTION)) return;
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
    if (dialog.value) {
      for (const field of textFieldsIn(dialog.value)) initialValues.set(field, field.value);
    }
    const target = initialFocus?.value ?? dialog.value?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog.value;
    target?.focus();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown);
    openDialogs.splice(openDialogs.indexOf(id), 1);
    opener?.focus();
  });
}
