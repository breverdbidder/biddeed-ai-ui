'use client';
// src/lib/d4d/use-property-intel.ts
// Hook: per-property photos + Claude thread, persisted to Supabase.
// Tables: d4d_field_photos, d4d_property_threads

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface FieldPhoto {
  id: string;
  property_id: string;
  photo_url: string;
  taken_at: string;
  taken_lat?: number;
  taken_lng?: number;
  ai_analysis?: string;
  notes?: string;
}

export interface ThreadMessage {
  id: string;
  property_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_ref?: string;
  created_at: string;
}

export function usePropertyIntel(propertyId: string | null, propertyAddress?: string) {
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [{ data: ph }, { data: th }] = await Promise.all([
        supabase
          .from('d4d_field_photos')
          .select('*')
          .eq('property_id', propertyId)
          .order('taken_at', { ascending: false }),
        supabase
          .from('d4d_property_threads')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: true }),
      ]);
      setPhotos((ph as FieldPhoto[]) ?? []);
      setThread((th as ThreadMessage[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhoto = useCallback(
    async (
      photoDataUrl: string,
      meta?: { lat?: number; lng?: number; notes?: string },
    ): Promise<FieldPhoto | null> => {
      if (!propertyId) return null;
      const { data, error } = await supabase
        .from('d4d_field_photos')
        .insert({
          property_id: propertyId,
          property_address: propertyAddress,
          photo_url: photoDataUrl,
          taken_at: new Date().toISOString(),
          taken_lat: meta?.lat,
          taken_lng: meta?.lng,
          notes: meta?.notes,
          source: 'd4d_field',
        })
        .select()
        .single();
      if (error) {
        console.error('addPhoto error', error);
        return null;
      }
      await refresh();
      return data as FieldPhoto;
    },
    [propertyId, propertyAddress, refresh],
  );

  const appendMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      imageRef?: string,
    ): Promise<ThreadMessage | null> => {
      if (!propertyId) return null;
      const { data, error } = await supabase
        .from('d4d_property_threads')
        .insert({
          property_id: propertyId,
          property_address: propertyAddress,
          role,
          content,
          image_ref: imageRef,
        })
        .select()
        .single();
      if (error) {
        console.error('appendMessage error', error);
        return null;
      }
      await refresh();
      return data as ThreadMessage;
    },
    [propertyId, propertyAddress, refresh],
  );

  const updateAiAnalysis = useCallback(
    async (photoId: string, analysis: string) => {
      const { error } = await supabase
        .from('d4d_field_photos')
        .update({ ai_analysis: analysis, ai_analyzed_at: new Date().toISOString() })
        .eq('id', photoId);
      if (error) console.error('updateAiAnalysis error', error);
      await refresh();
    },
    [refresh],
  );

  const clearThread = useCallback(async () => {
    if (!propertyId) return;
    await supabase.from('d4d_property_threads').delete().eq('property_id', propertyId);
    await refresh();
  }, [propertyId, refresh]);

  return {
    photos,
    thread,
    loading,
    addPhoto,
    appendMessage,
    updateAiAnalysis,
    clearThread,
    refresh,
  };
}
