import supabase from '../supabase-client.js';

const cupcakeCountEl = document.getElementById('cupcakeCount');
const promoCountEl = document.getElementById('promoCount');
const statusPendingEl = document.getElementById('statusPending');
const statusPreparingEl = document.getElementById('statusPreparing');
const statusDeliveringEl = document.getElementById('statusDelivering');
const statusDeliveredEl = document.getElementById('statusDelivered');

(async function checkAdmin() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return (window.location.href = '../login.html');
    }

    const user = userData.user;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao verificar perfil:', error.message);
      alert('Erro ao validar acesso. Faça login novamente.');
      return (window.location.href = '../login.html');
    }

    if (!profile?.is_admin) {
      alert('Acesso restrito a administradores.');
      return (window.location.href = '../index.html');
    }

    loadDashboard();
  } catch (err) {
    console.error('Erro inesperado ao verificar admin:', err);
    alert('Erro inesperado. Faça login novamente.');
    window.location.href = '../login.html';
  }
})();

async function loadDashboard() {
  try {
    // Cupcakes
    const { count: cupcakeCount, error: cupcakeError } = await supabase
      .from('cupcakes')
      .select('*', { count: 'exact', head: true });

    if (cupcakeError) console.error('Erro ao contar cupcakes:', cupcakeError);
    cupcakeCountEl.textContent = cupcakeCount ?? 0;

    // Promoções ativas
    const { count: promoCount, error: promoError } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (promoError) console.error('Erro ao contar promoções:', promoError);
    promoCountEl.textContent = promoCount ?? 0;

    // Pedidos
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('status');

    if (orderError) {
      console.error('Erro ao carregar pedidos:', orderError);
      return;
    }

    // Contadores por status
    const statusCount = {
      Pendente: 0,
      'Em preparação': 0,
      'Em rota de entrega': 0,
      Entregue: 0,
    };

    (orders || []).forEach(o => {
      if (statusCount[o.status] !== undefined) statusCount[o.status]++;
    });

    statusPendingEl.textContent = statusCount['Pendente'];
    statusPreparingEl.textContent = statusCount['Em preparação'];
    statusDeliveringEl.textContent = statusCount['Em rota de entrega'];
    statusDeliveredEl.textContent = statusCount['Entregue'];
  } catch (err) {
    console.error('Erro ao carregar resumo:', err);
  }
}
