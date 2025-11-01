import supabase from '../supabase-client.js';
import { toBRL } from '../helpers.js';

const input = document.getElementById('searchTerm');
const btn = document.getElementById('btnSearch');
const results = document.getElementById('results');

btn?.addEventListener('click', async () => {
  const term = input.value.trim();
  if (!term) return alert('Digite um termo para buscar');
  results.innerHTML = '<div class="card">Buscando...</div>';
  const { data, error } = await supabase.from('cupcakes').select('*').or(`name.ilike.%${term}%,flavor.ilike.%${term}%,ingredients.ilike.%${term}%`).eq('active', true);
  if (error) { results.innerHTML = '<div class="card">Erro na busca</div>'; return; }
  results.innerHTML = '';
  (data || []).forEach(c => {
    const d = document.createElement('div');
    d.className = 'card cupcake-card';
    d.innerHTML = `<img src="${c.image_url||'https://via.placeholder.com/80'}"/><div class="cupcake-info"><h3>${c.name}</h3><p class="small-muted">${c.flavor||''}</p><div class="price">${toBRL(c.price)}</div></div><div><button class="btn" onclick="location.href='cupcake.html?id=${c.id}'">Ver</button></div>`;
    results.appendChild(d);
  });
});
