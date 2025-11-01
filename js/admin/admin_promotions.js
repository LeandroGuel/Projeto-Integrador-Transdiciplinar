import supabase, { uploadImageToStorage } from '../supabase-client.js';
import { alertSuccess, alertError, alertConfirm } from '../alert.js';

const list = document.getElementById('list');
const saveBtn = document.getElementById('save');
const titleEl = document.getElementById('title');
const couponEl = document.getElementById('coupon_code');
const discountEl = document.getElementById('discount_percent');
const startEl = document.getElementById('start');
const endEl = document.getElementById('end');
const fileInput = document.getElementById('imageFile');
const preview = document.getElementById('previewPromo');

let editingId = null;

async function load() {
  list.innerHTML = '<div class="card">Carregando...</div>';
  const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
  list.innerHTML = '';
  (data || []).forEach(p => {
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between">
        <div>
          <h4>${p.title}</h4>
          <p class="small-muted">Cupom: ${p.coupon_code || '-'}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn" data-id="${p.id}" data-action="edit">Editar</button>
          <button class="btn-ghost" data-id="${p.id}" data-action="del">Excluir</button>
        </div>
      </div>`;
    list.appendChild(d);
  });
}

saveBtn?.addEventListener('click', async () => {
  const title = titleEl.value.trim();
  const coupon = couponEl.value.trim();
  const discount = parseInt(discountEl.value || 0, 10);
  const start = startEl.value;
  const end = endEl.value;

  if (!title) return await alertError('Título obrigatório');

  let imageUrl = null;
  if (fileInput.files?.[0]) {
    try {
      const path = `promotions/${crypto.randomUUID()}-${fileInput.files[0].name}`;
      imageUrl = await uploadImageToStorage(fileInput.files[0], path, 'images');
    } catch (err) {
      console.error(err);
      return await alertError('Erro ao fazer upload: ' + err.message);
    }
  }

  const payload = {
    title,
    coupon_code: coupon || null,
    discount_percent: isNaN(discount) ? null : discount,
    start_at: start ? new Date(start).toISOString() : null,
    end_at: end ? new Date(end).toISOString() : null,
    active: true
  };

  if (imageUrl) payload.image_url = imageUrl;

  try {
    if (editingId) {
      const { error } = await supabase.from('promotions').update(payload).eq('id', editingId);
      if (error) return await alertError('Erro ao atualizar: ' + error.message);
      await alertSuccess('Promoção atualizada');
      editingId = null;
    } else {
      const { error } = await supabase.from('promotions').insert([payload]);
      if (error) return await alertError('Erro ao criar: ' + error.message);
      await alertSuccess('Promoção criada');
    }

    titleEl.value = '';
    couponEl.value = '';
    discountEl.value = '';
    startEl.value = '';
    endEl.value = '';
    fileInput.value = '';
    preview.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    load();
  } catch (err) {
    console.error(err);
    await alertError('Erro desconhecido');
  }
});

document.addEventListener('click', async (e) => {
  const action = e.target.dataset?.action;
  const id = e.target.dataset?.id;
  if (!action) return;

  if (action === 'del') {
    alertConfirm('Excluir promoção?', 'Tem certeza que deseja excluir esta promoção?', async () => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) return await alertError('Erro ao excluir: ' + error.message);
      await alertSuccess('Promoção excluída');
      load();
    });
  }

  if (action === 'edit') {
    const { data, error } = await supabase.from('promotions').select('*').eq('id', id).single();
    if (error) return await alertError('Erro ao carregar promoção');
    titleEl.value = data.title || '';
    couponEl.value = data.coupon_code || '';
    discountEl.value = data.discount_percent || '';
    startEl.value = data.start_at ? new Date(data.start_at).toISOString().slice(0, 10) : '';
    endEl.value = data.end_at ? new Date(data.end_at).toISOString().slice(0, 10) : '';
    if (data.image_url) preview.src = data.image_url;
    editingId = data.id;
  }
});

fileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => (preview.src = evt.target.result);
    reader.readAsDataURL(file);
  }
});

load();
