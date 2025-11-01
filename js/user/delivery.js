import supabase from '../supabase-client.js';
import { alertSuccess, alertError } from '../alert.js';

const savedSection = document.getElementById('savedAddressesSection');
const savedSelect = document.getElementById('savedAddresses');
const useSavedBtn = document.getElementById('useSavedAddress');
const saveNewBtn = document.getElementById('saveAddress');
const newAddressSection = document.getElementById('newAddressSection');
const deliveryRadios = document.getElementsByName('deliveryType');
const pickupCheckoutBtn = document.getElementById('pickupCheckoutBtn');

//Carrega endereço já salvo no cadastro do usuário
async function loadSavedAddresses() {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) {
    await alertError('Faça login para continuar');
    return location.href = 'login.html';
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar endereços:', error);
    return;
  }

  if (data && data.length > 0) {
    savedSection.style.display = 'block';
    savedSelect.innerHTML = '';
    data.forEach(addr => {
      const option = document.createElement('option');
      option.value = addr.id;
      option.textContent = `${addr.street}, ${addr.number} - ${addr.city}/${addr.state} (${addr.cep})`;
      savedSelect.appendChild(option);
    });
  } else {
    savedSection.style.display = 'none';
  }
}

//Usar endereço salvo no cadastro do usuário
useSavedBtn?.addEventListener('click', async () => {
  const selectedId = savedSelect.value;
  if (!selectedId) return alertError('Selecione um endereço.');

  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) {
    await alertError('Sessão expirada. Faça login novamente.');
    return location.href = 'login.html';
  }

  await supabase.from('addresses').update({ is_default: true }).eq('id', selectedId).eq('user_id', user.id);
  await supabase.from('addresses').update({ is_default: false }).neq('id', selectedId).eq('user_id', user.id);

  localStorage.setItem('deliveryType', 'delivery');
  localStorage.setItem('addressId', selectedId);

  await alertSuccess('Endereço selecionado como padrão!');
  setTimeout(() => window.location.href = 'checkout.html', 800);
});

//Cadastrar novo endereço
saveNewBtn?.addEventListener('click', async () => {
  const cep = document.getElementById('cep').value.trim();
  const street = document.getElementById('street').value.trim();
  const number = document.getElementById('number').value.trim();
  const complement = document.getElementById('complement').value.trim();
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();

  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) {
    await alertError('Faça login para salvar endereço.');
    return location.href = 'login.html';
  }

  if (!street || !city || !state) {
    return alertError('Preencha pelo menos Rua, Cidade e Estado.');
  }

  const payload = {
    user_id: user.id,
    cep,
    street,
    number,
    complement,
    city,
    state,
    is_default: true,
  };

  const { data: inserted, error } = await supabase.from('addresses').insert([payload]).select().single();
  if (error) {
    console.error('Erro ao salvar endereço:', error);
    return alertError('Erro ao salvar endereço.');
  }

  localStorage.setItem('deliveryType', 'delivery');
  localStorage.setItem('addressId', inserted.id);

  await alertSuccess('Novo endereço cadastrado com sucesso!');
  setTimeout(() => window.location.href = 'checkout.html', 800);
});

//Alterna entre entrega e retirada
deliveryRadios.forEach(radio => {
  radio.addEventListener('change', async () => {
    if (radio.value === 'pickup' && radio.checked) {
      newAddressSection.style.display = 'none';
      savedSection.style.display = 'none';
      pickupCheckoutBtn.style.display = 'block';
      localStorage.setItem('deliveryType', 'pickup');
      localStorage.removeItem('addressId');
      await alertSuccess('Opção Retirada selecionada');
    } else if (radio.value === 'delivery' && radio.checked) {
      newAddressSection.style.display = 'block';
      pickupCheckoutBtn.style.display = 'none';
      await loadSavedAddresses();
      localStorage.setItem('deliveryType', 'delivery');
    }
  });
});

pickupCheckoutBtn?.addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

loadSavedAddresses();
