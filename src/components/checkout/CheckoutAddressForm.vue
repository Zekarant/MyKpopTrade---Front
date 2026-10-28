<template>
  <div class="form-grid">
    <div v-for="field in FIELDS" :key="field.key" :class="{ full: field.full }">
      <label :for="`${idPrefix}-${field.key}`">
        {{ field.label }} <span v-if="field.optional" class="optional">(facultatif)</span>
      </label>
      <AddressAutocomplete
        v-if="field.key === 'streetLine1'"
        :input-id="`${idPrefix}-${field.key}`"
        :model-value="address.streetLine1"
        @update:model-value="set('streetLine1', $event)"
        @select="onAddressPicked"
      />
      <input
        v-else
        :id="`${idPrefix}-${field.key}`"
        :type="field.type ?? 'text'"
        :value="address[field.key]"
        :maxlength="field.maxlength"
        :placeholder="field.placeholder"
        @input="set(field.key, ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Adresse de livraison d'un achat, avec suggestions pour la rue. */
import { useId } from 'vue';
import type { ShippingAddressPayload } from '@/services/payment.service';
import type { AddressResult } from '@/services/address.service';
import AddressAutocomplete from './AddressAutocomplete.vue';

type AddressField = keyof ShippingAddressPayload;

const FIELDS: { key: AddressField; label: string; maxlength?: number; full?: boolean; optional?: boolean; type?: string; placeholder?: string }[] = [
  { key: 'recipientName', label: 'Nom du destinataire', maxlength: 100, full: true },
  { key: 'streetLine1', label: 'Adresse', full: true },
  { key: 'streetLine2', label: 'Complément', maxlength: 200, full: true, optional: true },
  { key: 'postalCode', label: 'Code postal', maxlength: 16 },
  { key: 'city', label: 'Ville', maxlength: 100 },
  { key: 'country', label: 'Pays', maxlength: 2, placeholder: 'FR' },
  { key: 'phone', label: 'Téléphone', maxlength: 32, optional: true, type: 'tel' }
];

const address = defineModel<ShippingAddressPayload>({ required: true });
const idPrefix = `checkout-address-${useId()}`;

// Un nouvel objet à chaque saisie : le parent reste seul propriétaire de l'adresse.
function set(key: AddressField, value: string) {
  address.value = { ...address.value, [key]: value };
}

function onAddressPicked(result: AddressResult) {
  address.value = {
    ...address.value,
    streetLine1: result.streetLine1,
    postalCode: result.postalCode,
    city: result.city,
    country: result.country
  };
}
</script>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm) var(--space-md);

  .full { grid-column: 1 / -1; }

  label {
    display: block;
    font-size: var(--font-size-xs);
    font-weight: 600;
    margin-bottom: 2px;
    color: var(--text-secondary);

    .optional {
      color: var(--text-muted);
      font-weight: 400;
    }
  }

  // :deep : le champ de rue est rendu par AddressAutocomplete.
  :deep(input) {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    box-sizing: border-box;

    &::placeholder { color: var(--text-muted); }

    &:focus {
      outline: none;
      border-color: var(--accent-pink);
      box-shadow: var(--focus-ring);
    }
  }
}

@media (max-width: 576px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
