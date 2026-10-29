import { ref } from 'vue';
import authentificationService from '@/services/authentification.service';

/**
 * Formulaire d'inscription, partagé par l'accueil (HomeView) et /register.
 *
 * Les deux vues dupliquaient la validation et avaient divergé : /register ne
 * vérifiait plus la confirmation du mot de passe et plantait sur une erreur
 * réseau, et aucune des deux n'appliquait les règles réelles de l'API (pseudo
 * de 5 caractères minimum au lieu de 3, aucune règle sur le mot de passe).
 * Les règles ci-dessous sont le miroir de `validateUsername`, `validateEmail`
 * et `validatePassword` côté API : un refus local évite un aller-retour et dit
 * précisément quelle règle manque.
 */

/** Seuls caractères spéciaux reconnus par `validatePassword` côté API : « - » ou « _ » ne comptent pas. */
export const PASSWORD_SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
/** RFC 5321, borne appliquée par l'API avant la regex. */
const EMAIL_MAX_LENGTH = 254;

/** Champ fautif, pour que la vue puisse le mettre en évidence. */
export type RegisterField =
  | 'username'
  | 'email'
  | 'password'
  | 'passwordConfirm'
  | 'acceptBeta'
  | 'acceptPolicy';

export interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  acceptBeta: boolean;
  acceptPolicy: boolean;
}

export interface RegisterValidationError {
  field: RegisterField;
  message: string;
}

/**
 * Première règle du pseudo non respectée (miroir de `validateUsername` côté
 * API : 3 à 30 caractères, lettres, chiffres, « _ » ou « - »), sinon chaîne vide.
 * Partagée par l'inscription, la fin d'inscription et les paramètres du profil.
 */
export function usernameRuleError(value: string): string {
  if (!value) return 'Le pseudo est obligatoire.';
  if (value.length < 3) return 'Le pseudo doit comporter au moins 3 caractères.';
  if (value.length > 30) return 'Le pseudo ne peut pas dépasser 30 caractères.';
  if (!USERNAME_PATTERN.test(value)) return 'Caractères autorisés pour le pseudo : lettres, chiffres, « _ » et « - ».';
  return '';
}

/** Première règle du mot de passe non respectée, sinon chaîne vide. */
export function passwordRuleError(value: string): string {
  if (value.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (!/[A-Z]/.test(value)) return 'Il manque une majuscule au mot de passe.';
  if (!/[a-z]/.test(value)) return 'Il manque une minuscule au mot de passe.';
  if (!/[0-9]/.test(value)) return 'Il manque un chiffre au mot de passe.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return `Il manque au mot de passe un caractère spécial parmi ${PASSWORD_SPECIAL_CHARS}`;
  }
  return '';
}

/** Première erreur du formulaire, dans l'ordre d'affichage des champs, sinon `null`. */
export function validateRegistration(values: RegisterFormValues): RegisterValidationError | null {
  const usernameError = usernameRuleError(values.username.trim());
  if (usernameError) {
    return { field: 'username', message: usernameError };
  }
  const email = values.email.trim();
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { field: 'email', message: "L'adresse email est invalide." };
  }
  const passwordError = passwordRuleError(values.password);
  if (passwordError) {
    return { field: 'password', message: passwordError };
  }
  if (values.password !== values.passwordConfirm) {
    return { field: 'passwordConfirm', message: 'Les deux mots de passe ne correspondent pas.' };
  }
  if (!values.acceptBeta) {
    return { field: 'acceptBeta', message: 'Vous devez reconnaître que le service est en version bêta.' };
  }
  if (!values.acceptPolicy) {
    return { field: 'acceptPolicy', message: 'Vous devez accepter les CGU et la politique de confidentialité.' };
  }
  return null;
}

export function useRegisterForm() {
  const username = ref('');
  const email = ref('');
  const password = ref('');
  const passwordConfirm = ref('');
  const acceptBeta = ref(false);
  const acceptPolicy = ref(false);
  // Décoché par défaut : un consentement pré-coché n'est pas un consentement.
  const acceptMarketing = ref(false);

  const errorMessage = ref('');
  const errorField = ref<RegisterField | null>(null);
  const successMessage = ref('');
  const loading = ref(false);

  /** Valide puis envoie l'inscription. Rend `true` si le compte a été créé. */
  async function submit(): Promise<boolean> {
    if (loading.value) return false;

    errorMessage.value = '';
    errorField.value = null;
    successMessage.value = '';

    const invalid = validateRegistration({
      username: username.value,
      email: email.value,
      password: password.value,
      passwordConfirm: passwordConfirm.value,
      acceptBeta: acceptBeta.value,
      acceptPolicy: acceptPolicy.value
    });
    if (invalid) {
      errorField.value = invalid.field;
      errorMessage.value = invalid.message;
      return false;
    }

    loading.value = true;
    try {
      successMessage.value = await authentificationService.register({
        username: username.value.trim(),
        email: email.value.trim(),
        password: password.value,
        confirmPassword: passwordConfirm.value,
        // La case CGU couvre la politique de confidentialité et le traitement
        // des données nécessaire au service : l'API exige les deux à `true`.
        privacyPolicy: true,
        dataProcessing: true,
        marketing: acceptMarketing.value
      });
      return true;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    username,
    email,
    password,
    passwordConfirm,
    acceptBeta,
    acceptPolicy,
    acceptMarketing,
    errorMessage,
    errorField,
    successMessage,
    loading,
    submit
  };
}
