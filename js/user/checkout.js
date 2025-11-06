import supabase from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess, alertError } from '../alert.js';

const payBtn = document.getElementById('pay');
const paymentMethod = document.getElementById('paymentMethod');
const paymentResult = document.getElementById('paymentResult');
const orderTotalEl = document.getElementById('orderTotal');

// ---------------- CARRINHO ----------------
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function cartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

function getDiscountData() {
  const data = JSON.parse(localStorage.getItem('couponData') || '{}');
  const coupon = data.code || null;
  const discountPercent = parseFloat(data.discount || 0);
  return { coupon, discountPercent };
}

function cartTotal() {
  const subtotal = cartSubtotal();
  const { discountPercent } = getDiscountData();
  const discountValue = (subtotal * discountPercent) / 100;
  const total = Math.max(subtotal - discountValue, 0);
  return { total, discountValue };
}

// ---------------- RESUMO ----------------
async function updateOrderSummary() {
  const subtotal = cartSubtotal();
  const { coupon, discountPercent } = getDiscountData();
  const { total, discountValue } = cartTotal();

  const deliveryType = localStorage.getItem('deliveryType') || 'delivery';
  const addressId = localStorage.getItem('addressId') || null;
  let addressText = '';

  if (deliveryType === 'delivery' && addressId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('street, number, city, state, cep')
      .eq('id', addressId)
      .maybeSingle();

    if (!error && data) {
      addressText = `${data.street}, ${data.number} - ${data.city}/${data.state} (${data.cep})`;
    }
  }

  if (!orderTotalEl) return;

  let summaryHTML = `
    <p>Tipo de entrega: <strong>${deliveryType === 'pickup' ? 'Retirada' : 'Entrega'}</strong></p>
  `;

  if (addressText) {
    summaryHTML += `<p>Endereço: ${addressText}</p>`;
  }

  summaryHTML += `
    <p>Subtotal: ${toBRL(subtotal)}</p>
  `;

  if (discountPercent > 0 && coupon) {
    summaryHTML += `
      <p>Desconto (${coupon.toUpperCase()} - ${discountPercent}%): -${toBRL(discountValue)}</p>
    `;
  }

  summaryHTML += `
    <h3 style="margin-top:8px;">Total a pagar: ${toBRL(total)}</h3>
  `;

  orderTotalEl.innerHTML = summaryHTML;
}

// ---------------- USUÁRIO ----------------
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário', error);
    return null;
  }
  return data.user;
}

// ---------------- PEDIDO ----------------
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

// ---------------- SIMULAÇÃO DE PAGAMENTO ----------------
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
    localStorage.removeItem('couponData');

    await alertSuccess(`Pagamento ${type.toUpperCase()} simulado: aprovado`);
    setTimeout(() => (window.location.href = 'orders.html'), 800);
  } catch (err) {
    console.error('Erro ao simular pagamento', err);
    await alertError('Erro ao simular pagamento');
  }
}

// ---------------- PAGAR ----------------
payBtn?.addEventListener('click', async () => {
  const method = paymentMethod.value;
  const cart = getCart();
  if (!cart.length) return alertError('Carrinho vazio.');

  const { coupon, discountPercent } = getDiscountData();
  const { total, discountValue } = cartTotal();
  paymentResult.innerHTML = '<div class="card">Criando pedido...</div>';

  try {
    const addressId = localStorage.getItem('addressId') || null;
    const order = await createOrder(total, method.toUpperCase(), coupon, discountValue, addressId);
    await addOrderItems(order.id, cart);

    if (method === 'pix') {
      const payload = `PONTO_CUPCAKES|${order.id}|${Number(order.total).toFixed(2)}`;
      const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(payload);
      paymentResult.innerHTML = `
        <div style="text-align:center">
          <h3>Total: ${toBRL(order.total)}</h3>
          <img src="${qr}" alt="PIX QR"/>
          <p class="small-muted">Escaneie o QR ou clique em simular pagamento</p>
          <button id="simulatePix" class="btn" style="margin-top:8px">Simular pagamento recebido</button>
        </div>`;

      document.getElementById('simulatePix')?.addEventListener('click', () => simulatePayment(order.id, 'pix'));
    } else {
      paymentResult.innerHTML = `
        <div class="card" style="text-align:center">
          <h3>Total: ${toBRL(order.total)}</h3>
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

// ---------------- INICIALIZAÇÃO ----------------
updateOrderSummary();
