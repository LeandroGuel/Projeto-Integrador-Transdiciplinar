import supabase from '../supabase-client.js';
import { toBRL } from '../helpers.js';
import { alertSuccess } from '../alert.js';

const detail = document.getElementById('cupcakeDetail');
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

async function load() {
  if (!id) {
    detail.innerHTML = '<div class="card">Cupcake não informado.</div>';
    return;
  }

  detail.innerHTML = '<div class="card">Carregando...</div>';
  const { data, error } = await supabase.from('cupcakes').select('*').eq('id', id).single();

  if (error || !data) {
    detail.innerHTML = '<div class="card">Erro ao carregar cupcake.</div>';
    return;
  }

  detail.innerHTML = `
    <img src="${data.image_url || 'https://via.placeholder.com/600x300'}" class="cupcake-detail-img"/>
    <h3>${data.name}</h3>
    <p class="small-muted">${data.flavor || ''}</p>
    <p>${data.description || ''}</p>
    <p><strong>Ingredientes:</strong> ${data.ingredients || '-'}</p>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
      <div class="price">${toBRL(data.price)}</div>
      <div><button id="addBtn" class="btn">Adicionar</button></div>
    </div>
  `;

  document.getElementById('addBtn').addEventListener('click', async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const found = cart.find(i => i.id === data.id);
    if (found) found.quantity += 1;
    else
      cart.push({
        id: data.id,
        name: data.name,
        price: parseFloat(data.price),
        quantity: 1,
        image: data.image_url || null,
      });

    localStorage.setItem('cart', JSON.stringify(cart));

    await alertSuccess(`${data.name} adicionado ao carrinho`);

    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 800);
  });
}

load();
