import supabase, { getPublicUrl } from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess, alertConfirm } from '../alert.js';
import { updateCartBadge } from '../common/menu.js';



const promoDiv = document.getElementById('promotions');
const cupcakesDiv = document.getElementById('cupcakes');
const searchInput = document.getElementById('searchTerm');
const searchBtn = document.getElementById('btnSearch');
const logoutBtn = document.getElementById('logoutBtn');

// ---------------- AUTENTICAÇÃO ----------------
async function checkAuth() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.href = 'login.html';
  }
}

logoutBtn?.addEventListener('click', async () => {
  await alertConfirm('Sair da conta', 'Deseja realmente encerrar sua sessão?', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
});

// ---------------- PROMOÇÕES ----------------
async function loadPromotions() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .lte('start_at', now)
    .gte('end_at', now);

  if (error) {
    console.error('Erro ao carregar promoções:', error.message);
    promoDiv.innerHTML = '<div class="card list-empty">Erro ao carregar promoções</div>';
    return;
  }

  promoDiv.innerHTML = '';

  if (!data || !data.length) return;

  data.forEach(p => {
    let imageUrl = p.image_url || null;
    if (imageUrl && !imageUrl.startsWith('http')) imageUrl = getPublicUrl(imageUrl);
    if (!imageUrl) imageUrl = '../images/placeholder.png';

    const banner = document.createElement('div');
    banner.className = 'promo-banner-large';
    banner.innerHTML = `
      <img src="${imageUrl}" alt="${p.title}">
      <div class="promo-banner-text">
        <h3>${p.title}</h3>
        ${p.coupon_code ? `<p>Use o cupom <strong>${p.coupon_code}</strong> e ganhe desconto!</p>` : ''}
      </div>
    `;
    promoDiv.appendChild(banner);
  });
}

// ---------------- CUPCAKES ----------------
function renderCupcake(c) {
  let imageUrl = c.image_url || null;
  if (imageUrl && !imageUrl.startsWith('http')) imageUrl = getPublicUrl(imageUrl);
  if (!imageUrl) imageUrl = '../images/placeholder.png';

  const d = document.createElement('div');
  d.className = 'card cupcake-card';
  d.innerHTML = `
    <img src="${imageUrl}" alt="${c.name}"/>
    <div class="cupcake-info">
      <h3>${c.name}</h3>
      <p class="small-muted">${c.flavor || ''}</p>
      <div class="price">${toBRL(c.price)}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn-ghost qty-btn" data-action="minus" data-id="${c.id}">−</button>
        <span class="qty" data-id="${c.id}" style="min-width:30px;text-align:center;">0</span>
        <button class="btn-ghost qty-btn" data-action="plus" data-id="${c.id}">+</button>
      </div>
      <button class="btn add-cart" 
              data-id="${c.id}" 
              data-name="${c.name}" 
              data-price="${c.price}" 
              data-image="${imageUrl}">
        Adicionar ao carrinho
      </button>
      <button class="btn-ghost small" onclick="location.href='cupcake.html?id=${c.id}'">Detalhes</button>
    </div>
  `;
  return d;
}

// ---------------- CARREGAR CUPCAKES ----------------
async function loadCupcakes(term = '') {
  cupcakesDiv.innerHTML = '<div class="card list-empty">Carregando...</div>';

  let query = supabase
    .from('cupcakes')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (term) query = query.or(`name.ilike.%${term}%,flavor.ilike.%${term}%,ingredients.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao carregar cupcakes:', error.message);
    cupcakesDiv.innerHTML = '<div class="card list-empty">Erro ao carregar cupcakes</div>';
    return;
  }

  cupcakesDiv.innerHTML = '';

  if (!data || !data.length) {
    cupcakesDiv.innerHTML = '<div class="card list-empty">Nenhum cupcake encontrado</div>';
    return;
  }

  data.forEach(c => cupcakesDiv.appendChild(renderCupcake(c)));
}

// ---------------- EVENTOS DE BUSCA ----------------
searchBtn?.addEventListener('click', () => loadCupcakes(searchInput.value.trim()));
searchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loadCupcakes(searchInput.value.trim());
  }
});

// ---------------- AJUSTE DE QUANTIDADE ----------------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const qtyEl = document.querySelector(`.qty[data-id="${id}"]`);
  let qty = parseInt(qtyEl.textContent) || 0;

  if (action === 'plus') qty++;
  if (action === 'minus' && qty > 0) qty--;

  qtyEl.textContent = qty;
});

// ---------------- ADICIONAR AO CARRINHO ----------------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-cart');
  if (!btn) return;

  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const image = btn.dataset.image;
  const qty = parseInt(document.querySelector(`.qty[data-id="${id}"]`)?.textContent) || 0;

  if (qty <= 0) return alertSuccess('Selecione uma quantidade antes de adicionar.');

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existing = cart.find(i => i.id === id);

  if (existing) existing.quantity += qty;
  else cart.push({ id, name, price, image, quantity: qty });

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  alertSuccess(`${name} (${qty}x) adicionado ao carrinho`);
  document.querySelector(`.qty[data-id="${id}"]`).textContent = '0';
});

// ---------------- INICIALIZAÇÃO ----------------
await checkAuth();
loadPromotions();
loadCupcakes();
