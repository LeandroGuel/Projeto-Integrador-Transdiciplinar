import supabase from '../supabase-client.js';
import { alertSuccess, alertError, alertWarning } from '../alert.js';

const infoEl = document.getElementById('info');
const resetForm = document.getElementById('resetForm');
const resendForm = document.getElementById('resendForm');
const btnReset = document.getElementById('btnReset');
const btnSend = document.getElementById('btnSend');

async function tryRestoreSessionFromUrl() {
  try {
    if (typeof supabase.auth.getSessionFromUrl === 'function') {
      const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true }).catch(e => ({ error: e }));
      if (!error) return true;
    }

    const frag = window.location.hash || '';
    if (!frag) return false;
    const search = frag.startsWith('#') ? frag.replace('#', '?') : frag;
    const params = new URLSearchParams(search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && typeof supabase.auth.setSession === 'function') {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) return true;
    }

    return false;
  } catch (err) {
    console.error('Erro ao tentar restaurar sessão da URL:', err);
    return false;
  }
}

async function init() {
  infoEl.innerText = 'Verificando link de redefinição...';

  const restored = await tryRestoreSessionFromUrl();

  if (restored) {
    infoEl.innerText = 'Por favor, informe a nova senha abaixo.';
    resetForm.style.display = 'block';
    resendForm.style.display = 'none';
  } else {
    infoEl.innerText = 'Link inválido ou expirado. Se preferir, solicite um novo link.';
    resetForm.style.display = 'none';
    resendForm.style.display = 'block';
  }
}

btnReset?.addEventListener('click', async () => {
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirm = document.getElementById('confirmPassword').value.trim();

  if (!newPassword || !confirm) return alertWarning('Campos obrigatórios', 'Preencha todos os campos.');
  if (newPassword.length < 6) return alertWarning('Senha fraca', 'Digite uma senha com no mínimo 6 caracteres.');
  if (newPassword !== confirm) return alertWarning('Senhas diferentes', 'As senhas digitadas não coincidem.');

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    await alertSuccess('Senha alterada', 'Sua senha foi redefinida com sucesso. Você já pode entrar.');
    localStorage.removeItem('cart');
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    await alertError('Erro ao redefinir', err?.message || 'Não foi possível atualizar a senha.');
  }
});

btnSend?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  if (!email) return alertWarning('E-mail obrigatório', 'Informe o e-mail cadastrado.');

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
    if (error) throw error;
    await alertSuccess('Link reenviado', 'Verifique seu e-mail para redefinir a senha.');
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    await alertError('Erro ao reenviar', err?.message || 'Não foi possível reenviar o link.');
  }
});

init();
