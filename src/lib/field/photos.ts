// src/lib/field/photos.ts
// Supabase Storage upload + Postgres metadata for field photos.

import { supabase } from '@/lib/supabase/client';

export interface FieldPhoto {
  id: string;
  property_uuid: string;
  storage_path: string | null;
  thumbnail_b64: string | null;
  captured_at: string;
  captured_lat: number | null;
  captured_lng: number | null;
  ai_analysis: string | null;
  ai_analyzed_at: string | null;
  width: number | null;
  height: number | null;
}

// Resize image to max 1024px on longest side, return base64 data URL + dimensions
export async function compressImage(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, width: w, height: h, sizeBytes });
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFieldPhoto(
  propertyUuid: string,
  file: File,
  location?: { lat: number; lng: number },
): Promise<FieldPhoto> {
  const compressed = await compressImage(file);

  // Convert dataUrl back to Blob for Storage upload
  const blob = await (await fetch(compressed.dataUrl)).blob();
  const fileName = `${propertyUuid}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('field-photos')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });

  // If storage upload fails, fall back to thumbnail-only persistence
  const storagePath = uploadError ? null : fileName;

  const { data, error } = await supabase
    .from('field_photos')
    .insert({
      property_uuid: propertyUuid,
      storage_path: storagePath,
      thumbnail_b64: compressed.dataUrl,
      width: compressed.width,
      height: compressed.height,
      size_bytes: compressed.sizeBytes,
      captured_lat: location?.lat ?? null,
      captured_lng: location?.lng ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FieldPhoto;
}

export async function listFieldPhotos(propertyUuid: string): Promise<FieldPhoto[]> {
  const { data, error } = await supabase
    .from('field_photos')
    .select('*')
    .eq('property_uuid', propertyUuid)
    .order('captured_at', { ascending: false });
  if (error) throw error;
  return (data || []) as FieldPhoto[];
}

export async function saveAiAnalysis(photoId: string, analysis: string, model: string): Promise<void> {
  await supabase
    .from('field_photos')
    .update({
      ai_analysis: analysis,
      ai_analyzed_at: new Date().toISOString(),
      ai_model: model,
    })
    .eq('id', photoId);
}

export async function deleteFieldPhoto(photoId: string, storagePath: string | null): Promise<void> {
  if (storagePath) {
    await supabase.storage.from('field-photos').remove([storagePath]);
  }
  await supabase.from('field_photos').delete().eq('id', photoId);
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, enableHighAccuracy: true },
    );
  });
}
