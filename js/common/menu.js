export async function loadMenu() {
  try {
    const res = await fetch('./components/menu.html');
    const html = await res.text();
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);

    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.bottom-menu a').forEach(link => {
      if (link.getAttribute('href') === current) {
        link.classList.add('active');
      }
    });

    // Atualiza o selo do carrinho ao carregar o menu
    updateCartBadge();

    // Atualiza o selo sempre que o localStorage mudar (inclusive em outras abas)
    window.addEventListener('storage', updateCartBadge);
  } catch (err) {
    console.error('Erro ao carregar menu:', err);
  }
}

// Função para atualizar o selo do carrinho
export function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}
