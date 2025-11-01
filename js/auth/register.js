import supabase, { uploadImageToStorage } from '../supabase-client.js';
import { alertSuccess, alertError, alertWarning } from '../alert.js';

const avatarFile = document.getElementById('avatarFile');
const avatarPreview = document.getElementById('avatarPreview');
const btnChangeAvatar = document.getElementById('btnChangeAvatar');

btnChangeAvatar?.addEventListener('click', () => avatarFile.click());

avatarFile?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => (avatarPreview.src = evt.target.result);
    reader.readAsDataURL(file);
  }
});

document.getElementById('btnRegister')?.addEventListener('click', async () => {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (!name || !email || !password) {
    alertWarning('Campos obrigatórios', 'Preencha nome, e-mail e senha.');
    return;
  }

  if (password !== confirm) {
    alertWarning('Senhas diferentes', 'As senhas digitadas não coincidem.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alertError('Erro no cadastro', error.message);

    const userId = data.user?.id;
    if (!userId) return alertError('Erro', 'Não foi possível criar o usuário.');

    let avatarUrl = null;
    if (avatarFile.files?.[0]) {
      const file = avatarFile.files[0];
      const path = `avatars/${crypto.randomUUID()}-${file.name}`;
      try {
        avatarUrl = await uploadImageToStorage(file, path);
      } catch {
        alertWarning('Avatar não enviado', 'Conta criada sem a foto.');
      }
    }

    await supabase.from('profiles').insert([{ id: userId, name, phone, avatar_url: avatarUrl }]);

    const cep = document.getElementById('cep')?.value?.trim();
    if (cep) {
      await supabase.from('addresses').insert([{
        user_id: userId,
        cep,
        street: document.getElementById('street')?.value || null,
        number: document.getElementById('number')?.value || null,
        complement: document.getElementById('complement')?.value || null,
        neighborhood: document.getElementById('neighborhood')?.value || null,
        city: document.getElementById('city')?.value || null,
        state: document.getElementById('state')?.value || null,
        is_default: true,
      }]);
    }

    alertSuccess('Conta criada com sucesso!', 'Você já pode fazer login.');
    setTimeout(() => (location.href = 'login.html'), 2000);
  } catch (err) {
    console.error(err);
    alertError('Erro inesperado', 'Algo deu errado. Tente novamente.');
  }
});
