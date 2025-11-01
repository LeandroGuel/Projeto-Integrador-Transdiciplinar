export const SUPABASE_URL = 'https://milkxrgatzcsqmqizwvv.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbGt4cmdhdHpjc3FtcWl6d3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzkzNDAsImV4cCI6MjA3NjkxNTM0MH0.-3-RkACn4zT0yLPEkzSC3qJKDaOm6-GayQ_u-RvW9as'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadImageToStorage(file, path) {
    if (!file) return null;
    const { data, error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false});
    if (error) {
        
        if (error.message && error.message.includes('duplicate')){
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
            return urlData.publicUrl;
        }
        throw error;
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    return urlData.publicUrl;
}

export function getPublicUrl(path) {
    if (!path) return null;
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

export default supabase;