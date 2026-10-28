import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

const FOCUSABLE = 'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])';
/** Champs dont le texte serait perdu ; `data-no-draft` écarte ceux qui n'en portent pas (recherche...). */
const DRAFT_FIELDS = [
  'textarea',
  'input:not([type])',
  ...['text', 'number', 'email', 'tel', 'url', 'search'].map((type) => `input[type="${type}"]`),
]
  .map((selector) => `${selector}:not([data-no-draft])`)
  .join(', ');
export const DISCARD_TEXT_QUESTION = 'Abandonner le texte saisi ?';

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
 *
 * Escape est vite pressé par mégarde : si l'utilisateur a tapé du texte dans
 * un champ de la boîte, on demande confirmation avant de le perdre.
 */
export function useDialogFocus(
  dialog: Readonly<Ref<HTMLElement | null>>,
  initialFocus?: Readonly<Ref<HTMLElement | null>>,
  onEscape?: () => void
): void {
  const id = Symbol('dialog');
  let opener: HTMLElement | null = null;
  // Champs modifiés au clavier : un pré-remplissage par le code (montant, adresse
  // du profil chargée après l'ouverture) n'émet pas d'`input` et n'est pas une saisie.
  const typedFields = new Set<HTMLInputElement | HTMLTextAreaElement>();

  function onInput(event: Event) {
    const field = event.target;
    if (field instanceof HTMLElement && field.matches(DRAFT_FIELDS) && dialog.value?.contains(field)) {
      typedFields.add(field as HTMLInputElement | HTMLTextAreaElement);
    }
  }

  function hasUnsentText(container: HTMLElement): boolean {
    return [...typedFields].some((field) => container.contains(field) && field.value.trim() !== '');
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
    document.addEventListener('input', onInput, true);
    await nextTick();
    const target = initialFocus?.value ?? dialog.value?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog.value;
    target?.focus();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('input', onInput, true);
    openDialogs.splice(openDialogs.indexOf(id), 1);
    opener?.focus();
  });
}
