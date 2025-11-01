import supabase from '../supabase-client.js';
import { alertSuccess, alertError, alertWarning } from '../alert.js';

document.getElementById('btnSend')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    await alertWarning('Informe o e-mail.');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html'
  });

  if (error) {
    await alertError('Erro ao enviar e-mail', error.message);
    return;
  }

  await alertSuccess('E-mail enviado', 'Se o e-mail existir, um link para redefinir a senha foi enviado.');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 800);
});
