import supabase from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess, alertError } from '../alert.js';

const payBtn = document.getElementById('pay');
const paymentMethod = document.getElementById('paymentMethod');
const paymentResult = document.getElementById('paymentResult');

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function cartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário', error);
    return null;
  }
  return data.user;
}

async function createOrder(total, method, coupon = null, discount = 0, address_id = null) {
  const user = await getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const deliveryType = localStorage.getItem('deliveryType') || 'delivery';

  const payload = {
    user_id: user.id,
    address_id: deliveryType === 'delivery' ? address_id : null,
    total,
    payment_method: method,
    payment_status: 'pendente',
    coupon_code: coupon,
    discount_amount: discount,
    delivery_type: deliveryType
  };

  const { data, error } = await supabase.from('orders').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function addOrderItems(orderId, items) {
  if (!items || !items.length) return;
  const payload = items.map(i => ({
    order_id: orderId,
    cupcake_id: i.id,
    quantity: i.quantity,
    unit_price: i.price,
    total_price: i.price * i.quantity
  }));
  const { error } = await supabase.from('order_items').insert(payload);
  if (error) console.error('Erro ao inserir order_items', error);
}

async function simulatePayment(orderId, type) {
  try {
    await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: `simulate_${type}`, orderId })
    });

    const { error } = await supabase.from('orders').update({ payment_status: 'aprovado' }).eq('id', orderId);
    if (error) throw error;

    localStorage.removeItem('cart');
    await alertSuccess(`Pagamento ${type.toUpperCase()} simulado: aprovado`);
    setTimeout(() => (window.location.href = 'orders.html'), 800);
  } catch (err) {
    console.error('Erro ao simular pagamento', err);
    await alertError('Erro ao simular pagamento');
  }
}

payBtn?.addEventListener('click', async () => {
  const method = paymentMethod.value;
  const cart = getCart();
  if (!cart.length) return alertError('Carrinho vazio.');

  const total = cartTotal();
  paymentResult.innerHTML = '<div class="card">Criando pedido...</div>';

  try {
    const addressId = localStorage.getItem('addressId') || null;
    const order = await createOrder(total, method.toUpperCase(), null, 0, addressId);
    await addOrderItems(order.id, cart);

    if (method === 'pix') {
      const payload = `PONTO_CUPCAKES|${order.id}|${Number(order.total).toFixed(2)}`;
      const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(payload);
      paymentResult.innerHTML = `
        <div style="text-align:center">
          <img src="${qr}" alt="PIX QR"/>
          <p class="small-muted">Escaneie o QR ou clique em simular pagamento</p>
          <button id="simulatePix" class="btn" style="margin-top:8px">Simular pagamento recebido</button>
        </div>`;

      document.getElementById('simulatePix')?.addEventListener('click', () => simulatePayment(order.id, 'pix'));

    } else {
      paymentResult.innerHTML = `
        <div class="card" style="text-align:center">
          <p>Simulação de pagamento com cartão</p>
          <button id="simulateCard" class="btn">Simular pagamento</button>
        </div>`;

      document.getElementById('simulateCard')?.addEventListener('click', () => simulatePayment(order.id, 'card'));
    }

  } catch (err) {
    console.error('Erro ao processar pedido', err);
    await alertError('Erro ao processar pedido.');
    paymentResult.innerHTML = '<div class="card">Erro ao criar pedido</div>';
  }
});
