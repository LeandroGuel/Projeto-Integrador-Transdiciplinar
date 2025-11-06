import { toBRL } from '../helpers.js';
import { alertWarning, alertError, alertSuccess, alertConfirm } from '../alert.js';
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

// ---------------- RENDERIZAÇÃO ----------------
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
      <img src="${imageUrl}" alt="${it.name}" />
      <div class="cupcake-info">
        <h3>${it.name}</h3>
        <p class="small-muted">Qtd: ${it.quantity}</p>
        <div class="price">${toBRL(it.price)}</div>
      </div>
      <div class="cart-actions">
        <div class="qty-controls">
          <button class="btn-qty" data-idx="${idx}" data-action="dec">-</button>
          <button class="btn-qty" data-idx="${idx}" data-action="inc">+</button>
        </div>
        <button class="btn-trash" data-idx="${idx}" data-action="del" title="Remover item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5-3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z"></path>
          </svg>
        </button>
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

// ---------------- CUPOM DE DESCONTO ----------------
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

// ---------------- AÇÕES DO CARRINHO ----------------
document.addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  const idx = Number(e.target.closest('[data-action]')?.dataset.idx);
  if (typeof action === 'undefined' || isNaN(idx)) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  if (action === 'inc') cart[idx].quantity++;
  if (action === 'dec') {
    cart[idx].quantity--;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  }

  if (action === 'del') {
    const item = cart[idx];
    await alertConfirm(
      'Remover item',
      `Deseja remover "${item.name}" do carrinho?`,
      async () => {
        cart.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        render();
        await alertSuccess('Item removido com sucesso!');
      }
    );
    return;
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  render();
});

// ---------------- CHECKOUT ----------------
checkoutBtn?.addEventListener('click', () => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart.length) return alertWarning('Carrinho vazio');

  const couponData = { code: appliedCoupon, discount: discountPercent };
  localStorage.setItem('couponData', JSON.stringify(couponData));

  location.href = 'delivery.html';
});

render();
