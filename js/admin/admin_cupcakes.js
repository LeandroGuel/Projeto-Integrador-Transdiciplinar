import supabase, { uploadImageToStorage } from '../supabase-client.js';
import { alertSuccess, alertError, alertConfirm, alertWarning } from '../alert.js';

const list = document.getElementById('list');
const saveBtn = document.getElementById('save');

async function load() {
  list.innerHTML = '<div class="card">Carregando cupcakes...</div>';

  const { data, error } = await supabase
    .from('cupcakes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    alertError('Erro ao carregar cupcakes', error.message);
    return;
  }

  list.innerHTML = '';
  (data || []).forEach(c => {
    const d = document.createElement('div');
    d.className = 'card cupcake-card';
    d.innerHTML = `
      <img src="${c.image_url || '../images/sem_imagem.png'}" alt="Cupcake image"/>
      <div class="cupcake-info">
        <h3>${c.name}</h3>
        <p class="small-muted">${c.flavor || ''}</p>
        <div class="price">R$ ${Number(c.price).toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn" data-id="${c.id}" data-action="edit">Editar</button>
        <button class="btn-ghost" data-id="${c.id}" data-action="del">Excluir</button>
      </div>`;
    list.appendChild(d);
  });
}

saveBtn?.addEventListener('click', async () => {
  const name = document.getElementById('name').value.trim();
  const flavor = document.getElementById('flavor').value.trim();
  const ingredients = document.getElementById('ingredients').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = parseFloat(document.getElementById('price').value || 0);
  const fileInput = document.getElementById('imageFile');

  if (!name || !price) {
    alertWarning('Campos ausentes', 'Nome e preço são obrigatórios.');
    return;
  }

  let imageUrl = null;

  if (fileInput && fileInput.files && fileInput.files[0]) {
    try {
      const path = `cupcakes/${crypto.randomUUID()}-${fileInput.files[0].name}`;
      imageUrl = await uploadImageToStorage(fileInput.files[0], path);
    } catch (err) {
      console.error(err);
      alertError('Erro ao carregar', err.message);
      return;
    }
  }

  const payload = { name, flavor, ingredients, description, price, image_url: imageUrl };

  const { error } = await supabase.from('cupcakes').insert([payload]);
  if (error) {
    alertError('Erro ao salvar o cupcake', error.message);
    return;
  }

  alertSuccess('Cupcake salvo!', 'Seu cupcake foi adicionado com sucesso.');

  document.getElementById('name').value = '';
  document.getElementById('flavor').value = '';
  document.getElementById('ingredients').value = '';
  document.getElementById('description').value = '';
  document.getElementById('price').value = '';
  if (fileInput) fileInput.value = '';

  load();
});

document.addEventListener('click', async (e) => {
  const action = e.target.dataset?.action;
  const id = e.target.dataset?.id;
  if (!action) return;

  if (action === 'del') {
    alertConfirm('Excluir cupcake?', 'Esta ação não pode ser desfeita.', async () => {
      const { error } = await supabase.from('cupcakes').delete().eq('id', id);
      if (error) return alertError('Falha na exclusão', error.message);
      alertSuccess('Cupcake excluído!', 'O cupcake foi removido.');
      load();
    });
  }

  if (action === 'edit') {
    const { data, error } = await supabase.from('cupcakes').select('*').eq('id', id).single();
    if (error || !data) {
      alertError('Não encontrado', 'Cupcake não encontrado.');
      return;
    }

    document.getElementById('name').value = data.name || '';
    document.getElementById('flavor').value = data.flavor || '';
    document.getElementById('ingredients').value = data.ingredients || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('price').value = data.price || '';

    alertWarning(
      'Modo de edição',
      'Campos preenchidos para edição. Após os ajustes, clique em Salvar para criar um novo registro.'
    );
  }
});

load();
