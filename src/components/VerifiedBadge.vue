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

<script lang="ts">
    export default {
        name: "VerifiedBadge",
        props: {
            /** Texte affiché dans l'infobulle. */
            label: {
                type: String,
                required: false,
                default: "Identité vérifiée",
            },
            /** Taille de l'icône en pixels. */
            size: {
                type: [Number, String],
                required: false,
                default: 14,
            },
        },
        data() {
            return {
                isVisible: false,
                tooltipStyle: {} as Record<string, string>,
            };
        },
        computed: {
            iconSize(): string {
                return typeof this.size === "number" ? `${this.size}px` : this.size;
            },
        },
        beforeUnmount() {
            this.hideTooltip();
        },
        methods: {
            showTooltip() {
                const anchor = this.$refs.anchor as HTMLElement | undefined;
                if (!anchor) return;

                const rect = anchor.getBoundingClientRect();
                this.tooltipStyle = {
                    top: `${rect.top - 8}px`,
                    left: `${rect.left + rect.width / 2}px`,
                };
                this.isVisible = true;

                // L'infobulle est en position fixe : on la masque si la page défile
                // pour éviter qu'elle se décale de son badge.
                window.addEventListener("scroll", this.hideTooltip, { capture: true, passive: true });
            },
            hideTooltip() {
                if (!this.isVisible) return;
                this.isVisible = false;
                window.removeEventListener("scroll", this.hideTooltip, { capture: true });
            },
        },
    };
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
