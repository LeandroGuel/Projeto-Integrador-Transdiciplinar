import supabase from '../supabase-client.js';
import { alertSuccess, alertError } from '../alert.js';

const sendBtn = document.getElementById('sendReview');
const ratingEl = document.getElementById('rating');
const commentEl = document.getElementById('comment');
const orderId = new URLSearchParams(window.location.search).get('orderId');

sendBtn?.addEventListener('click', async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return await alertError('Faça login para enviar avaliação');

    const rating = parseInt(ratingEl.value, 10);
    if (!rating || rating < 1 || rating > 5) return await alertError('Selecione uma nota válida');

    const comment = commentEl.value.trim();
    if (!comment) return await alertError('Digite um comentário');

    const payload = { order_id: orderId || null, user_id: user.id, rating, comment };
    const { error } = await supabase.from('reviews').insert([payload]);
    if (error) return await alertError('Erro ao enviar avaliação: ' + error.message);

    await alertSuccess('Avaliação enviada. Obrigado!');
    location.href = 'index.html';

  } catch (err) {
    console.error(err);
    await alertError('Ocorreu um erro ao enviar avaliação');
  }
});
