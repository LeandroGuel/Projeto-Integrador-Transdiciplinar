import supabase from '../supabase-client.js';
import { alertSuccess, alertError, alertConfirm, alertToast } from '../alert.js';

const btnLogin = document.getElementById('btnLogin');
const btnCreate = document.getElementById('btnCreate');

btnLogin?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alertError('Informações ausentes', 'Por favor, insira seu e-mail e senha.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alertError('Credenciais inválidas', 'Verifique seu email e senha.');
      return;
    }

    const userId = data?.user?.id;

    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        alertError('Erro no login', 'Não foi possível recuperar o perfil do usuário.');
        return;
      }

      // RRedireciona com base na regra
      if (profile?.is_admin) {
        alertSuccess('Bem vindo, Administrador!', 'Redirecionando para o painel de administração...');
        setTimeout(() => (location.href = 'admin.html'), 1500);
      } else {
        alertSuccess('Login bem sucedido');
        setTimeout(() => (location.href = 'index.html'), 1500);
      }
    } else {
      alertError('Login failed', 'Could not identify user.');
    }
  } catch (err) {
    console.error(err);
    alertError('Unexpected error', 'Something went wrong. Please try again.');
  }
});

btnCreate?.addEventListener('click', () => {
  location.href = 'register.html';
});
