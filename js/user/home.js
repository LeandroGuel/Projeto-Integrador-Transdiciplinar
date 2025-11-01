import supabase, { getPublicUrl } from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess, alertConfirm } from '../alert.js';

const promoDiv = document.getElementById('promotions');
const cupcakesDiv = document.getElementById('cupcakes');
const searchInput = document.getElementById('searchTerm');
const searchBtn = document.getElementById('btnSearch');
const logoutBtn = document.getElementById('logoutBtn');

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

//Promoções
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

  if (!data || !data.length) {
    promoDiv.innerHTML = '';
    return;
  }

  data.forEach(p => {
    let imageUrl = p.image_url || null;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = getPublicUrl(imageUrl);
    }
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

//Cupcakes
async function loadCupcakes(term = '') {
  cupcakesDiv.innerHTML = '<div class="card list-empty">Carregando...</div>';

  let query = supabase
    .from('cupcakes')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (term) {
    query = query.or(`name.ilike.%${term}%,flavor.ilike.%${term}%,ingredients.ilike.%${term}%`);
  }

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

  (data || []).forEach(c => {
    let imageUrl = c.image_url || null;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = getPublicUrl(imageUrl);
    }
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
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn add-btn" data-id="${c.id}" data-name="${c.name}" data-price="${c.price}">Adicionar</button>
        <button class="btn-ghost" onclick="location.href='cupcake.html?id=${c.id}'">Detalhes</button>
      </div>
    `;
    cupcakesDiv.appendChild(d);
  });
}

//Busca
searchBtn?.addEventListener('click', () => {
  const term = searchInput.value.trim();
  loadCupcakes(term);
});

searchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loadCupcakes(searchInput.value.trim());
  }
});

//Carrinho
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;

  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price || 0);

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const found = cart.find(i => i.id === id);
  const imageEl = btn.closest('.card').querySelector('img');
  const image = imageEl ? imageEl.src : null;

  if (found) found.quantity += 1;
  else cart.push({ id, name, price, quantity: 1, image });

  localStorage.setItem('cart', JSON.stringify(cart));
  alertSuccess(`${name} adicionado ao carrinho`);
});

await checkAuth();
loadPromotions();
loadCupcakes();
