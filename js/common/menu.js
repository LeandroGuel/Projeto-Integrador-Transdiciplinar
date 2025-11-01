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
  } catch (err) {
    console.error('Erro ao carregar menu:', err);
  }
}
