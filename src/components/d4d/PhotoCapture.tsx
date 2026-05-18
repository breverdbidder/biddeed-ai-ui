'use client';
// src/components/d4d/PhotoCapture.tsx
// Camera capture button for property cards. Resizes to 800px max, uploads to Supabase.

import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropertyIntel } from '@/lib/d4d/use-property-intel';

interface PhotoCaptureProps {
  propertyId: string;
  propertyAddress?: string;
  className?: string;
  onCaptured?: (photoId: string, dataUrl: string) => void;
}

export function PhotoCapture({
  propertyId,
  propertyAddress,
  className,
  onCaptured,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addPhoto } = usePropertyIntel(propertyId, propertyAddress);

  const handleFile = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Resize to 800px max for upload sanity
    const resized = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = dataUrl;
    });

    // Optional: capture geolocation at time of photo
    const meta: { lat?: number; lng?: number } = {};
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            meta.lat = pos.coords.latitude;
            meta.lng = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 3000 },
        );
      });
    }

    const photo = await addPhoto(resized, meta);
    if (photo && onCaptured) onCaptured(photo.id, resized);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.currentTarget.value = '';
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono shadow-md',
          'bg-sky-500/20 text-sky-400 border border-sky-500/30',
          'hover:bg-sky-500/30 active:scale-95 transition-all',
          className,
        )}
        title="Take field photo"
      >
        <Camera className="w-3 h-3" />
        PHOTO
      </button>
    </>
  );
}
