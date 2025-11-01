import supabase from '../supabase-client.js';
import { formatDate, toBRL, shortId } from '../helpers.js';

const list = document.getElementById('ordersList');

async function load() {
  list.innerHTML = '<div class="card">Carregando...</div>';
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) { list.innerHTML = '<div class="card">Faça login para ver seus pedidos</div>'; return; }
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) { list.innerHTML = '<div class="card">Erro ao carregar</div>'; return; }
  list.innerHTML = '';
  (data || []).forEach(o => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<div style="display:flex;justify-content:space-between"><div><h3>Pedido #${shortId(o.id)}</h3><p class="small-muted">${formatDate(o.created_at)}</p><p>Status: ${o.status}</p></div><div style="text-align:right"><strong>${toBRL(o.total)}</strong></div></div>`;
    d.addEventListener('click', () => location.href = `order_detail.html?id=${o.id}`);
    list.appendChild(d);
  });
}

load();
