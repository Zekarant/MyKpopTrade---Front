import axios from 'axios'; // Ajout de l'import d'axios
import Cookies from 'js-cookie';
import router from './router'

function ensureToastContainer() {
  let container = document.getElementById('app-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
      maxWidth: '380px',
    });
    document.body.appendChild(container);
  }
  return container;
}

function pushToast(message, kind) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `alert alert-${kind === 'error' ? 'danger' : 'success'}`;
  toast.innerText = message;
  Object.assign(toast.style, {
    pointerEvents: 'auto',
    background: kind === 'error' ? '#fee2e2' : '#d1fae5',
    color: kind === 'error' ? '#991b1b' : '#065f46',
    border: kind === 'error' ? '1px solid #fca5a5' : '1px solid #6ee7b7',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
    fontSize: '14px',
    fontWeight: '500',
    transform: 'translateX(20px)',
    opacity: '0',
    transition: 'all 200ms ease',
  });
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

export const func = {
    showToastSuccess(message) {
      pushToast(String(message ?? ''), 'success');
    },
    showToastError(message) {
      pushToast(String(message ?? ''), 'error');
    },
    buildCombinedSlug(query, event) {
      const combined = [query, event].filter(Boolean).join('-');
      return combined;
    },

 }