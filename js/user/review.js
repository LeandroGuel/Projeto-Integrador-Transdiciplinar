import supabase from '../supabase-client.js';
import { alertSuccess, alertError } from '../alert.js';

const sendBtn = document.getElementById('sendReview');
const commentEl = document.getElementById('comment');
const stars = document.querySelectorAll('.star');
const orderId = new URLSearchParams(window.location.search).get('orderId');

let selectedRating = 0;

// Atualiza visualmente as estrelas
function updateStarDisplay(rating) {
  stars.forEach(star => {
    const value = parseInt(star.dataset.value);
    star.classList.toggle('active', value <= rating);
  });
}

// Interações com as estrelas
stars.forEach(star => {
  const value = parseInt(star.dataset.value);

  // Ao passar o mouse, mostra o efeito temporário
  star.addEventListener('mouseenter', () => {
    stars.forEach(s => {
      const val = parseInt(s.dataset.value);
      s.classList.toggle('hover', val <= value);
    });
  });

  // Ao sair do hover, remove o destaque temporário
  star.addEventListener('mouseleave', () => {
    stars.forEach(s => s.classList.remove('hover'));
  });

  // Ao clicar, confirma a avaliação
  star.addEventListener('click', () => {
    selectedRating = value;
    updateStarDisplay(selectedRating);
  });
});

// Envio da avaliação
sendBtn?.addEventListener('click', async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return await alertError('Faça login para enviar avaliação');

    if (!selectedRating || selectedRating < 1 || selectedRating > 5)
      return await alertError('Selecione uma quantidade de estrelas');

    const comment = commentEl.value.trim();
    if (!comment) return await alertError('Digite um comentário');

    const payload = {
      order_id: orderId || null,
      user_id: user.id,
      rating: selectedRating,
      comment
    };

    const { error } = await supabase.from('reviews').insert([payload]);
    if (error) return await alertError('Erro ao enviar avaliação: ' + error.message);

    await alertSuccess('Avaliação enviada com sucesso! Obrigado pelo feedback.');
    location.href = 'index.html';

  } catch (err) {
    console.error(err);
    await alertError('Ocorreu um erro ao enviar avaliação');
  }
});
