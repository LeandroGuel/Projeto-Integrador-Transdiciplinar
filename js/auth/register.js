import supabase, { uploadImageToStorage } from '../supabase-client.js';
import { alertSuccess, alertError, alertWarning } from '../alert.js';

const avatarFile = document.getElementById('avatarFile');
const avatarPreview = document.getElementById('avatarPreview');
const btnChangeAvatar = document.getElementById('btnChangeAvatar');

const cepEl = document.getElementById('cep');
const streetEl = document.getElementById('street');
const numberEl = document.getElementById('number');
const complementEl = document.getElementById('complement');
const neighborhoodEl = document.getElementById('neighborhood');
const cityEl = document.getElementById('city');
const stateEl = document.getElementById('state');
const cepLoading = document.getElementById('cepLoading');

// ---------------- FOTO DE PERFIL ----------------
btnChangeAvatar?.addEventListener('click', () => avatarFile.click());

avatarFile?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => (avatarPreview.src = evt.target.result);
    reader.readAsDataURL(file);
  }
});

// ---------------- CONSULTA AUTOMÁTICA DE CEP ----------------
let cepTimeout = null;

cepEl?.addEventListener('input', () => {
  const cep = cepEl.value.replace(/\D/g, '');

  // Limpa campos se o CEP for apagado
  if (cep.length < 8) {
    streetEl.value = '';
    neighborhoodEl.value = '';
    cityEl.value = '';
    stateEl.value = '';
    cepLoading.style.display = 'none';
    return;
  }

  clearTimeout(cepTimeout);
  cepTimeout = setTimeout(async () => {
    if (cep.length !== 8) return;
    cepLoading.style.display = 'inline'; // Mostra spinner

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error('Erro na consulta ViaCEP');

      const data = await res.json();
      if (data.erro) {
        cepLoading.style.display = 'none';
        return alertError('CEP não encontrado.');
      }

      streetEl.value = data.logradouro || '';
      neighborhoodEl.value = data.bairro || '';
      cityEl.value = data.localidade || '';
      stateEl.value = data.uf || '';
      complementEl.value = data.complemento || '';
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      alertError('Erro ao consultar CEP.');
    } finally {
      cepLoading.style.display = 'none'; // Esconde spinner
    }
  }, 600);
});

// ---------------- CADASTRO ----------------
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
        street: streetEl.value || null,
        number: numberEl.value || null,
        complement: complementEl.value || null,
        neighborhood: neighborhoodEl.value || null,
        city: cityEl.value || null,
        state: stateEl.value || null,
        is_default: true,
      }]);
    }

    alertSuccess('Conta criada com sucesso!', 'Um e-mail foi enviado para o endereço informado. É necessário confirmá-lo antes de fazer login.');
    setTimeout(() => (location.href = 'login.html'), 2000);
  } catch (err) {
    console.error(err);
    alertError('Erro inesperado', 'Algo deu errado. Tente novamente.');
  }
});
