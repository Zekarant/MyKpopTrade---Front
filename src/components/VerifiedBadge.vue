<template>
    <span
        ref="anchor"
        class="verified-badge"
        role="img"
        :aria-label="label"
        @mouseenter="showTooltip"
        @mouseleave="hideTooltip"
    >
        <i class="bi bi-patch-check-fill" :style="{ fontSize: iconSize }"></i>
        <Teleport to="body">
            <Transition name="verified-badge-fade">
                <span
                    v-if="isVisible"
                    class="verified-badge__tooltip"
                    role="tooltip"
                    :style="tooltipStyle"
                >
                    {{ label }}
                </span>
            </Transition>
        </Teleport>
    </span>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';

    defineOptions({ name: 'VerifiedBadge' });

    const props = withDefaults(defineProps<{
        /** Texte affiché dans l'infobulle. */
        label?: string;
        /** Taille de l'icône en pixels. */
        size?: number | string;
    }>(), { label: 'Identité vérifiée', size: 14 });

    const anchor = useTemplateRef<HTMLElement>('anchor');
    const isVisible = ref(false);
    const tooltipStyle = ref<Record<string, string>>({});

    const iconSize = computed(() => typeof props.size === 'number' ? `${props.size}px` : props.size);

    function showTooltip() {
        if (!anchor.value) return;

        const rect = anchor.value.getBoundingClientRect();
        tooltipStyle.value = {
            top: `${rect.top - 8}px`,
            left: `${rect.left + rect.width / 2}px`,
        };
        isVisible.value = true;

        // L'infobulle est en position fixe : on la masque si la page défile
        // pour éviter qu'elle se décale de son badge.
        window.addEventListener('scroll', hideTooltip, { capture: true, passive: true });
    }

    function hideTooltip() {
        if (!isVisible.value) return;
        isVisible.value = false;
        window.removeEventListener('scroll', hideTooltip, { capture: true });
    }

    onBeforeUnmount(hideTooltip);
</script>

<style lang="scss" scoped>
    .verified-badge {
        display: inline-flex;
        align-items: center;
        color: var(--accent-pink);
        line-height: 1;
        cursor: help;
    }

    // Téléportée dans <body> pour ne pas être rognée par les conteneurs
    // en `overflow: hidden` (cartes d'annonces, modales...).
    .verified-badge__tooltip {
        position: fixed;
        z-index: 3000;
        transform: translate(-50%, -100%);
        padding: 6px 12px;
        max-width: min(240px, calc(100vw - 16px));
        background: var(--bg-elevated);
        color: var(--text-primary);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-md);
        font-size: var(--font-size-xs);
        font-weight: 500;
        line-height: 1.4;
        text-align: center;
        pointer-events: none;
    }

    .verified-badge-fade-enter-active,
    .verified-badge-fade-leave-active {
        transition: opacity var(--transition-fast);
    }

    .verified-badge-fade-enter-from,
    .verified-badge-fade-leave-to {
        opacity: 0;
    }
</style>
