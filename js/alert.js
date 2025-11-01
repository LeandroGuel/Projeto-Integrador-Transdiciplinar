// alerts.js
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

const swalBase = Swal.mixin({
  background: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),
  color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
  confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
  cancelButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  buttonsStyling: true,
  customClass: {
    popup: 'rounded-2xl shadow-lg',
    confirmButton: 'rounded-lg px-4 py-2 font-medium',
    cancelButton: 'rounded-lg px-4 py-2 font-medium',
  }
});

// Alerta de sucesso (agora retorna promise)
export async function alertSuccess(title, text = '') {
  return swalBase.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Ok',
    showCloseButton: false,
    iconColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  });
}

// Alerta de erro
export async function alertError(title, text = '') {
  return swalBase.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Ok',
    iconColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  });
}

// Alerta de aviso
export async function alertWarning(title, text = '') {
  return swalBase.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Entendido',
    iconColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  });
}

// Alerta de confirmação
export async function alertConfirm(title, text, onConfirm) {
  const result = await swalBase.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (result.isConfirmed && typeof onConfirm === 'function') {
    onConfirm();
  }
}

// Toast rápido
export function alertToast(message, type = 'success') {
  const iconColor =
    type === 'error'
      ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),
    color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
    iconColor
  });
}
