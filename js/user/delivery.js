import supabase from '../supabase-client.js';
import { alertSuccess, alertError } from '../alert.js';

const savedSection = document.getElementById('savedAddressesSection');
const savedSelect = document.getElementById('savedAddresses');
const useSavedBtn = document.getElementById('useSavedAddress');
const hideSavedBtn = document.getElementById('hideSavedAddresses');

const newAddressSection = document.getElementById('newAddressSection');
const saveNewBtn = document.getElementById('saveAddress');
const saveAndCheckoutBtn = document.getElementById('saveAndCheckout');
const hideNewBtn = document.getElementById('hideNewAddress');

const deliveryActions = document.getElementById('deliveryActions');
const btnUseSavedOption = document.getElementById('btnUseSavedOption');
const btnNewAddressOption = document.getElementById('btnNewAddressOption');

const deliveryRadios = Array.from(document.getElementsByName('deliveryType'));
const pickupCheckoutBtn = document.getElementById('pickupCheckoutBtn');

//Inicial - esconder seções
function hideAllAddressSections() {
  savedSection.style.display = 'none';
  newAddressSection.style.display = 'none';
  deliveryActions.style.display = 'none';
  pickupCheckoutBtn.style.display = 'none';
}

// Carrega endereços já salvos
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
    await alertError('Erro ao buscar endereços');
    return;
  }

  if (data && data.length > 0) {
    savedSection.style.display = 'block';
    savedSelect.innerHTML = '';
    data.forEach(addr => {
      const option = document.createElement('option');
      option.value = addr.id;
      option.textContent = `${addr.street || ''}${addr.number ? ', ' + addr.number : ''} - ${addr.city || ''}/${addr.state || ''} (${addr.cep || '-'})`;
      savedSelect.appendChild(option);
    });
  } else {
    savedSection.style.display = 'none';
    await alertError('Nenhum endereço salvo encontrado');
  }
}

// Usar endereço salvo
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
  setTimeout(() => (window.location.href = 'checkout.html'), 800);
});

// botão para fechar a lista de endereços
hideSavedBtn?.addEventListener('click', () => {
  savedSection.style.display = 'none';
});

// Cadastrar novo endereço
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

  // marca como endereço escolhido
  localStorage.setItem('deliveryType', 'delivery');
  localStorage.setItem('addressId', inserted.id);

  await alertSuccess('Novo endereço cadastrado com sucesso!');
  setTimeout(() => (window.location.href = 'checkout.html'), 800);
});

// salvar e ir para pagamento
saveAndCheckoutBtn?.addEventListener('click', async () => {
  saveNewBtn?.click();
});

// fechar a seção de novo endereço
hideNewBtn?.addEventListener('click', () => {
  newAddressSection.style.display = 'none';
});

// Alterna entre entrega e retirada
deliveryRadios.forEach(radio => {
  radio.addEventListener('change', async () => {
    if (radio.value === 'pickup' && radio.checked) {
      deliveryActions.style.display = 'none';
      savedSection.style.display = 'none';
      newAddressSection.style.display = 'none';
      pickupCheckoutBtn.style.display = 'block';
      localStorage.setItem('deliveryType', 'pickup');
      localStorage.removeItem('addressId');
    } else if (radio.value === 'delivery' && radio.checked) {
      deliveryActions.style.display = 'block';
      pickupCheckoutBtn.style.display = 'none';
      savedSection.style.display = 'none';
      newAddressSection.style.display = 'none';
      localStorage.setItem('deliveryType', 'delivery');
    }
  });
});

//Ações dos botões extras
btnUseSavedOption?.addEventListener('click', async () => {
  await loadSavedAddresses();
  savedSection.style.display = 'block';
  newAddressSection.style.display = 'none';
});

btnNewAddressOption?.addEventListener('click', () => {
  newAddressSection.style.display = 'block';
  savedSection.style.display = 'none';
  document.getElementById('cep')?.focus();
});

pickupCheckoutBtn?.addEventListener('click', () => {
  localStorage.setItem('deliveryType', 'pickup');
  localStorage.removeItem('addressId');
  window.location.href = 'checkout.html';
});

// Início - esconder seções e carregar se necessário
hideAllAddressSections();

const checked = deliveryRadios.find(r => r.checked);
if (checked) {
  checked.dispatchEvent(new Event('change'));
}
