/** Durée d'affichage d'un toast avant disparition automatique, en ms. */
const TOAST_DURATION_MS = 4000

/** Palette par type de toast (fond, texte, bordure, icône Bootstrap). */
const TOAST_STYLES = {
  success: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', icon: 'bi-check-circle-fill' },
  error: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: 'bi-exclamation-triangle-fill' },
  info: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: 'bi-info-circle-fill' }
}

function ensureToastContainer() {
  let container = document.getElementById('app-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'app-toast-container'
    // Les lecteurs d'écran annoncent les toasts sans voler le focus.
    container.setAttribute('role', 'status')
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-atomic', 'false')
    Object.assign(container.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
      maxWidth: '380px'
    })
    document.body.appendChild(container)
  }
  return container
}

function pushToast(message, kind) {
  const text = String(message ?? '').trim()
  if (!text) return

  const style = TOAST_STYLES[kind] ?? TOAST_STYLES.info
  const container = ensureToastContainer()

  const toast = document.createElement('div')
  Object.assign(toast.style, {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: style.bg,
    color: style.color,
    border: `1px solid ${style.border}`,
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
    fontSize: '14px',
    fontWeight: '500',
    transform: 'translateX(20px)',
    opacity: '0',
    transition: 'all 200ms ease'
  })

  const icon = document.createElement('i')
  icon.className = `bi ${style.icon}`
  icon.setAttribute('aria-hidden', 'true')
  icon.style.flexShrink = '0'
  icon.style.lineHeight = '1.4'

  const label = document.createElement('span')
  // innerText et non innerHTML : un message d'erreur peut venir de l'API.
  label.innerText = text

  toast.append(icon, label)
  container.appendChild(toast)

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)'
    toast.style.opacity = '1'
  })

  const remove = () => {
    toast.style.transform = 'translateX(20px)'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 250)
  }

  const timer = setTimeout(remove, TOAST_DURATION_MS)
  // Un clic ferme le toast immédiatement.
  toast.addEventListener('click', () => {
    clearTimeout(timer)
    remove()
  })
}

export const func = {
  showToastSuccess(message) {
    pushToast(message, 'success')
  },
  showToastError(message) {
    pushToast(message, 'error')
  },
  showToastInfo(message) {
    pushToast(message, 'info')
  },
  buildCombinedSlug(query, event) {
    return [query, event].filter(Boolean).join('-')
  }
}
