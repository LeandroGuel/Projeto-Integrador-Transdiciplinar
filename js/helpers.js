export function toBRL(value) {
    return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function shortId(uuid) {
    return uuid ? String(uuid).slice(0, 8) : '';
}

export function formatDate(dt) {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('pt-BR');
}