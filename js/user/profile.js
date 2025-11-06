import supabase, { uploadImageToStorage, getPublicUrl } from '../supabase-client.js';
import { alertSuccess, alertError } from '../alert.js';

const nameEl = document.getElementById('name');
const phoneEl = document.getElementById('phone');
const avatarFile = document.getElementById('avatarFile');
const avatarPreview = document.getElementById('avatarPreview');
const btnChangeAvatar = document.getElementById('btnChangeAvatar');
const saveBtn = document.getElementById('saveProfile');

const cepEl = document.getElementById('cep');
const streetEl = document.getElementById('street');
const numberEl = document.getElementById('number');
const complementEl = document.getElementById('complement');
const cityEl = document.getElementById('city');
const stateEl = document.getElementById('state');
const cepLoading = document.getElementById('cepLoading');

let userId = null;
let currentAvatarUrl = null;
let currentAddressId = null;

// ---------------- ALTERAR FOTO ----------------
btnChangeAvatar?.addEventListener('click', () => avatarFile.click());

avatarFile?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => (avatarPreview.src = evt.target.result);
    reader.readAsDataURL(file);
  }
});

// ---------------- CONSULTAR CEP AUTOMÁTICO COM SPINNER ----------------
let cepTimeout = null;

cepEl?.addEventListener('input', () => {
  const cep = cepEl.value.replace(/\D/g, '');

  // Limpa campos se apagar o CEP
  if (cep.length < 8) {
    streetEl.value = '';
    cityEl.value = '';
    stateEl.value = '';
    complementEl.value = '';
    cepLoading.style.display = 'none';
    return;
  }

  clearTimeout(cepTimeout);
  cepTimeout = setTimeout(async () => {
    if (cep.length !== 8) return;

    cepLoading.style.display = 'inline'; // mostra o ícone de carregamento

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error('Erro ao consultar ViaCEP');

      const data = await res.json();
      if (data.erro) {
        cepLoading.style.display = 'none';
        return alertError('CEP não encontrado.');
      }

      streetEl.value = data.logradouro || '';
      cityEl.value = data.localidade || '';
      stateEl.value = data.uf || '';
      complementEl.value = data.complemento || '';
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      alertError('Erro ao consultar o CEP.');
    } finally {
      cepLoading.style.display = 'none'; // esconde o ícone
    }
  }, 600);
});

// ---------------- CARREGAR DADOS ----------------
async function load() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return (location.href = 'login.html');
  userId = user.id;

  // Carrega perfil
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile) {
    nameEl.value = profile.name || '';
    phoneEl.value = profile.phone || '';
    currentAvatarUrl = profile.avatar_url || null;
    if (currentAvatarUrl) {
      avatarPreview.src = currentAvatarUrl.startsWith('http')
        ? currentAvatarUrl
        : getPublicUrl(currentAvatarUrl);
    }
  }

  // Carrega endereço existente
  const { data: addresses, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar endereço:', error);
    return;
  }

  if (addresses && addresses.length > 0) {
    const address = addresses[0];
    currentAddressId = address.id;
    cepEl.value = address.cep || '';
    streetEl.value = address.street || '';
    numberEl.value = address.number || '';
    complementEl.value = address.complement || '';
    cityEl.value = address.city || '';
    stateEl.value = address.state || '';
  }
}

// ---------------- SALVAR PERFIL ----------------
saveBtn?.addEventListener('click', async () => {
  try {
    if (!userId) return await alertError('Usuário não autenticado.');

    //Upload da imagem (se houver nova)
    let avatarUrl = currentAvatarUrl;
    if (avatarFile.files?.[0]) {
      const file = avatarFile.files[0];
      const path = `avatars/${crypto.randomUUID()}-${file.name}`;
      try {
        avatarUrl = await uploadImageToStorage(file, path);
        avatarPreview.src = avatarUrl.startsWith('http') ? avatarUrl : getPublicUrl(avatarUrl);
      } catch (err) {
        console.error(err);
        return await alertError('Erro no upload da imagem.');
      }
    }

    //Atualiza o perfil
    await supabase.from('profiles').upsert([
      {
        id: userId,
        name: nameEl.value.trim(),
        phone: phoneEl.value.trim(),
        avatar_url: avatarUrl
      }
    ]);

    const addressPayload = {
      user_id: userId,
      cep: cepEl.value.trim(),
      street: streetEl.value.trim(),
      number: numberEl.value.trim(),
      complement: complementEl.value.trim(),
      city: cityEl.value.trim(),
      state: stateEl.value.trim(),
      is_default: true
    };

    //Atualiza ou cria o endereço
    if (currentAddressId) {
      await supabase.from('addresses').update(addressPayload).eq('id', currentAddressId);
    } else {
      const { data: inserted } = await supabase.from('addresses').insert([addressPayload]).select().single();
      currentAddressId = inserted?.id || null;
    }

    await alertSuccess('Perfil atualizado com sucesso!');
  } catch (err) {
    console.error(err);
    await alertError('Erro ao atualizar perfil.');
  }
});

load();
