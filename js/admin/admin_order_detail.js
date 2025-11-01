import supabase from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess, alertError } from '../alert.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const orderInfo = document.getElementById('orderInfo');
const itemsList = document.getElementById('itemsList');
const statusButtons = document.getElementById('statusButtons');

async function load() {
  if (!id) {
    orderInfo.innerHTML = '<div class="card">Pedido não informado</div>';
    return;
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, profiles(name)')
      .eq('id', id)
      .single();

    if (error || !order) {
      orderInfo.innerHTML = '<div class="card">Pedido não encontrado</div>';
      return;
    }

    const userName = order.profiles?.name || 'Usuário não identificado';
    const deliveryType = order.delivery_type === 'pickup' ? 'Retirada' : 'Entrega';

    let addressHtml = '';
    if (deliveryType === 'Entrega' && order.address_id) {
      const { data: address, error: addrError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', order.address_id)
        .single();

      if (addrError) {
        console.error('Erro ao buscar endereço:', addrError);
        addressHtml = '<p class="small-muted">Erro ao carregar endereço de entrega</p>';
      } else if (address) {
        addressHtml = `<p class="small-muted">Endereço de entrega: ${address.street}, ${address.number}${address.complement ? ' - ' + address.complement : ''}, ${address.city}/${address.state} (${address.cep})</p>`;
      }
    }

    orderInfo.innerHTML = `
      <h3>Pedido #${String(order.id).slice(0, 8)}</h3>
      <p>Usuário: ${userName}</p>
      <p>Tipo: ${deliveryType}</p>
      ${addressHtml}
      <p>Pagamento: ${order.payment_method || '-'} • ${order.payment_status || '-'}</p>
      <p>Total: ${toBRL(order.total)}</p>
      <p>Status: <strong>${order.status}</strong></p>
    `;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, cupcakes(name, price)')
      .eq('order_id', id);

    if (itemsError) console.error(itemsError);

    itemsList.innerHTML = '';
    (items || []).forEach(it => {
      const d = document.createElement('div');
      d.className = 'card cupcake-card';
      d.innerHTML = `
        <div class="cupcake-info">
          <h3>${it.cupcakes?.name}</h3>
          <p class="small-muted">Qtd: ${it.quantity} • Unit: ${toBRL(it.unit_price)}</p>
          <div class="price">${toBRL(it.total_price)}</div>
        </div>`;
      itemsList.appendChild(d);
    });

    renderStatusButtons(order.status, deliveryType);

  } catch (err) {
    console.error(err);
    await alertError('Erro ao carregar pedido');
  }
}

function renderStatusButtons(status, deliveryType) {
  statusButtons.innerHTML = '';

  const createButton = (text, newStatus) => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = text;
    btn.addEventListener('click', async () => await updateStatus(newStatus));
    statusButtons.appendChild(btn);
  };

  switch (status) {
    case 'Pendente':
      createButton('Iniciar preparação', 'Em preparação');
      break;

    case 'Em preparação':
      if (deliveryType === 'Entrega') {
        createButton('Iniciar entrega', 'Em rota de entrega');
      } else {
        createButton('Pronto para retirada', 'Pronto para retirada');
      }
      break;

    case 'Em rota de entrega':
    case 'Pronto para retirada':
      createButton('Confirmar entrega', 'Entregue');
      break;

    case 'Entregue':
      statusButtons.innerHTML = '<p>Pedido finalizado.</p>';
      break;

    default:
      statusButtons.innerHTML = `<p>Status desconhecido: ${status}</p>`;
  }
}

async function updateStatus(newStatus) {
  try {
    const { error } = await supabase.from('orders').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) return await alertError('Erro ao atualizar status: ' + error.message);

    await alertSuccess('Status atualizado');
    load();
  } catch (err) {
    console.error(err);
    await alertError('Erro ao atualizar status');
  }
}

load();
