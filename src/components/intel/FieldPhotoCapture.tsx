'use client';
// src/components/intel/FieldPhotoCapture.tsx
// Camera capture button + Supabase Storage upload + auto Claude vision analysis.

import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  uploadFieldPhoto,
  listFieldPhotos,
  saveAiAnalysis,
  deleteFieldPhoto,
  getCurrentLocation,
  type FieldPhoto,
} from '@/lib/field/photos';
import { askClaude, buildImageContent } from '@/lib/claude/client';
import { buildPropertyPrompt } from '@/lib/claude/prompts';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface FieldPhotoCaptureProps {
  auction: AuctionWithIntel;
  fieldNote?: string | null;
}

export function FieldPhotoCapture({ auction, fieldNote }: FieldPhotoCaptureProps) {
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listFieldPhotos(auction.id);
        if (!cancelled) setPhotos(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auction.id]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const loc = await getCurrentLocation();
      const photo = await uploadFieldPhoto(auction.id, file, loc || undefined);
      setPhotos((p) => [photo, ...p]);
      // Auto-analyze the new photo
      analyzePhoto(photo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const analyzePhoto = async (photo: FieldPhoto) => {
    if (!photo.thumbnail_b64) return;
    setAnalyzing(photo.id);
    setError(null);
    try {
      const imageContent = buildImageContent(photo.thumbnail_b64);
      const reply = await askClaude(
        [
          {
            role: 'user',
            content: [
              imageContent,
              {
                type: 'text',
                text: `Field photo at ${auction.property_address}. Analyze:\n1. Occupancy signals (cars, toys, postings, mail accumulation)\n2. Property condition (roof, walls, foundation, paint)\n3. Value-add opportunities or red flags\n4. Neighborhood context if visible\n5. ARV adjustment recommendation\n\nMax 200 words. Markdown headers + bullets. Be specific and quantified.`,
              },
            ],
          },
        ],
        buildPropertyPrompt(auction, fieldNote),
      );
      await saveAiAnalysis(photo.id, reply.text, reply.model || 'claude-sonnet-4');
      setPhotos((p) =>
        p.map((x) => (x.id === photo.id ? { ...x, ai_analysis: reply.text, ai_analyzed_at: new Date().toISOString() } : x)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const removePhoto = async (photo: FieldPhoto) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await deleteFieldPhoto(photo.id, photo.storage_path);
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-3 p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Field Photos · {photos.length}
        </div>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Capture field photos. Each one is auto-analyzed by Claude vision for occupancy signals, condition, and red flags.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Capture Field Photo
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-[11px] text-red-300">⚠️ {error}</div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">No photos yet. Capture some to get AI analysis.</div>
      ) : (
        <div className="space-y-3">
          {photos.map((p) => (
            <div key={p.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <div className="relative aspect-video bg-slate-900">
                {p.thumbnail_b64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_b64} alt="field" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 text-[9px] mono bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {new Date(p.captured_at).toLocaleString()}
                </div>
              </div>
              <div className="p-2.5">
                {p.ai_analysis ? (
                  <div>
                    <div className="text-[9px] mono text-amber-400 uppercase mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Claude analysis
                    </div>
                    <div className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap">{p.ai_analysis}</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => analyzePhoto(p)}
                    disabled={analyzing === p.id}
                    className={cn(
                      'w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-1',
                      analyzing === p.id ? 'bg-slate-700 text-slate-400' : 'bg-sky-500 hover:bg-sky-400 text-slate-900',
                    )}
                  >
                    {analyzing === p.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Analyze with Claude
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
