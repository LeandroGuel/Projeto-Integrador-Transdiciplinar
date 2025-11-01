import supabase from '../supabase-client.js';

document.getElementById('btnSend')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  if (!email) return alert('Informe o e-mail');
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password.html' });
  if (error) return alert('Erro: ' + error.message);
  alert('Link reenviado, verifique o seu e-mail.');
  location.href = 'login.html';
});
