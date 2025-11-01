import supabase from '../supabase-client.js';
import { toBRL, formatDate, shortId } from '../helpers.js';


const id = new URLSearchParams(window.location.search).get('id');
const info = document.getElementById('orderInfo');
const itemsDiv = document.getElementById('orderItems');
const reviewBtn = document.getElementById('review');

async function load() {
  if (!id) { info.innerHTML = '<div class="card">Pedido inválido</div>'; return; }
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error || !order) { info.innerHTML = '<div class="card">Erro ao carregar pedido</div>'; return; }
  info.innerHTML = `<h3>Pedido #${shortId(order.id)}</h3><p>Status: ${order.status}</p><p>Pagamento: ${order.payment_method || '-'} • ${order.payment_status || '-'}</p><p>Total: ${toBRL(order.total)}</p><p class="small-muted">Data: ${formatDate(order.created_at)}</p>`;
  const { data: items } = await supabase.from('order_items').select('*, cupcakes(name,price,image_url)').eq('order_id', id);
  itemsDiv.innerHTML = '';
  (items || []).forEach(it => {
    const d = document.createElement('div');
    d.className = 'card cupcake-card';
    d.innerHTML = `<img src="${it.cupcakes?.image_url || 'https://via.placeholder.com/80'}"/><div class="cupcake-info"><h3>${it.cupcakes?.name || ''}</h3><p class="small-muted">Qtd: ${it.quantity} • Unit: ${toBRL(it.unit_price)}</p><div class="price">${toBRL(it.total_price)}</div></div>`;
    itemsDiv.appendChild(d);
  });
}

reviewBtn?.addEventListener('click', () => {
  if (!id) return alert('Pedido inválido');
  location.href = `review.html?orderId=${id}`;
});

load();
