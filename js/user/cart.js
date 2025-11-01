import { toBRL } from '../helpers.js';
import { alertWarning, alertError, alertSuccess } from '../alert.js';
import supabase, { getPublicUrl } from '../supabase-client.js';

const cartItems = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout');
const couponInput = document.getElementById('couponInput');
const applyCouponBtn = document.getElementById('applyCoupon');

let appliedCoupon = null;
let discountPercent = 0;

function render() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cartItems.innerHTML = '';

  if (!cart.length) {
    cartItems.innerHTML = '<div class="card list-empty">Carrinho vazio</div>';
    subtotalEl.innerText = 'Subtotal: ' + toBRL(0);
    discountEl.innerText = 'Desconto: ' + toBRL(0);
    totalEl.innerText = 'Total: ' + toBRL(0);
    return;
  }

  let subtotal = 0;

  cart.forEach((it, idx) => {
    subtotal += it.price * it.quantity;

    let imageUrl = it.image_url || it.image || null;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = getPublicUrl(imageUrl);
    }
    if (!imageUrl) imageUrl = '../images/placeholder.png';

    const d = document.createElement('div');
    d.className = 'card cupcake-card';
    d.innerHTML = `
      <img src="${imageUrl}" alt="Cupcake image" />
      <div class="cupcake-info">
        <h3>${it.name}</h3>
        <p class="small-muted">Qtd: ${it.quantity}</p>
        <div class="price">${toBRL(it.price)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn" data-idx="${idx}" data-action="inc">+</button>
        <button class="btn-ghost" data-idx="${idx}" data-action="dec">-</button>
      </div>
    `;
    cartItems.appendChild(d);
  });

  const discountValue = (subtotal * discountPercent) / 100;
  const total = subtotal - discountValue;

  subtotalEl.innerText = 'Subtotal: ' + toBRL(subtotal);
  discountEl.innerText = `Desconto (${discountPercent}%): ${toBRL(discountValue)}`;
  totalEl.innerText = 'Total: ' + toBRL(total);
}

//Aplicar cupom de desconto
applyCouponBtn?.addEventListener('click', async () => {
  const code = couponInput.value.trim().toUpperCase();
  if (!code) return alertWarning('Informe um código de cupom');

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('coupon_code', code)
    .lte('start_at', now)
    .gte('end_at', now)
    .eq('active', true)
    .single();

  if (error || !data) {
    appliedCoupon = null;
    discountPercent = 0;
    alertError('Cupom inválido ou expirado');
    render();
    return;
  }

  appliedCoupon = data.coupon_code;
  discountPercent = data.discount_percent || 0;
  alertSuccess(`Cupom "${appliedCoupon}" aplicado: ${discountPercent}% de desconto`);
  render();
});

//Alterar quantidades no carrinho
document.addEventListener('click', (e) => {
  const action = e.target.dataset?.action;
  const idx = Number(e.target.dataset?.idx);
  if (typeof action === 'undefined' || isNaN(idx)) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (action === 'inc') cart[idx].quantity++;
  if (action === 'dec') {
    cart[idx].quantity--;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  render();
});

//Redireciona para pagamento
checkoutBtn?.addEventListener('click', () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart.length) return alertWarning('Carrinho vazio');

  const couponData = { code: appliedCoupon, discount: discountPercent };
  localStorage.setItem('couponData', JSON.stringify(couponData));

  location.href = 'delivery.html';
});

render();
