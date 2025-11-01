import supabase from '../supabase-client.js';

const ordersList = document.getElementById('ordersList');

async function load() {
  ordersList.innerHTML = '<div class="card">Carregando...</div>';

  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar pedidos:', error.message);
    ordersList.innerHTML = '<div class="card">Erro ao carregar pedidos</div>';
    return;
  }

  ordersList.innerHTML = '';

  (data || []).forEach(o => {
    const userName = o.profiles?.name || 'Usuário não identificado';
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between">
        <div>
          <h4>Pedido #${String(o.id).slice(0, 8)}</h4>
          <p class="small-muted">Usuário: ${userName}</p>
          <p>Status: ${o.status}</p>
        </div>
        <div style="text-align:right">
          <strong>R$ ${Number(o.total).toFixed(2)}</strong>
          <div style="margin-top:8px">
            <button class="btn" onclick="location.href='admin_order_detail.html?id=${o.id}'">Ver</button>
          </div>
        </div>
      </div>`;
    ordersList.appendChild(d);
  });
}

load();
