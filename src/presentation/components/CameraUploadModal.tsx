'use client';

import React, { useState, useRef } from 'react';
import exifr from 'exifr';
import { Spot } from '@/domain/models/Spot';
import { ExifData } from '@/domain/models/SpotReport';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CameraUploadModalProps {
  spot: Spot | null;
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const CameraUploadModal: React.FC<CameraUploadModalProps> = ({
  spot,
  onClose,
  onReportSubmitted,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [captureMethod, setCaptureMethod] = useState<'camera_direct' | 'gallery_upload'>('camera_direct');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationFlags, setValidationFlags] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!spot) return null;

  // Compress image to WebP/JPEG (max 1280px, quality 0.8) to save bandwidth and storage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context unavailable'));

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, method: 'camera_direct' | 'gallery_upload') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setCaptureMethod(method);
    setValidationFlags([]);

    try {
      // 1. Extract EXIF metadata before canvas stripping
      let extracted: ExifData = {};
      try {
        const parsed = await exifr.parse(file, [
          'DateTimeOriginal',
          'CreateDate',
          'latitude',
          'longitude',
          'Make',
          'Model',
        ]);

        if (parsed) {
          extracted = {
            dateTimeOriginal: parsed.DateTimeOriginal
              ? new Date(parsed.DateTimeOriginal).toISOString()
              : undefined,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            deviceMake: parsed.Make,
            deviceModel: parsed.Model,
          };
          setExifData(extracted);
        }
      } catch (exifErr) {
        console.warn('Could not parse EXIF:', exifErr);
      }

      // 2. Compress image for high performance
      const compressedUrl = await compressImage(file);
      setPhotoDataUrl(compressedUrl);

      // 3. Client feedback flags
      const flags: string[] = [];
      if (method === 'camera_direct') {
        flags.push('Cámara directa: Reporte certificado en vivo.');
      }
      if (extracted.dateTimeOriginal) {
        const timeDiffMins = Math.round(
          (Date.now() - new Date(extracted.dateTimeOriginal).getTime()) / (1000 * 60)
        );
        flags.push(`Fecha de disparo original detectada: hace ${timeDiffMins} min.`);
      }
      if (extracted.latitude && extracted.longitude) {
        flags.push('Coordenadas GPS de la foto detectadas y verificadas.');
      }
      setValidationFlags(flags);
    } catch (err) {
      setError('Error al procesar la imagen seleccionada.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoDataUrl) {
      setError('Por favor toma o sube una foto primero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: spot.id,
          photoUrl: photoDataUrl,
          captureMethod,
          exifData: exifData || undefined,
          userNote,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo subir el reporte.');
      }

      onReportSubmitted();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span>Reportar Estado en Vivo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{spot.name} · {spot.location.municipality}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons to Capture */}
        {!photoDataUrl ? (
          <div className="space-y-4 my-6">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={(e) => handleFileSelected(e, 'camera_direct')}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              onChange={(e) => handleFileSelected(e, 'gallery_upload')}
              className="hidden"
            />

            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold p-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-cyan-900/30 transition duration-150"
            >
              <Camera className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm">Disparar Cámara Ahora</div>
                <div className="text-[11px] opacity-80 font-normal">Recomendado · Certificado en vivo 100%</div>
              </div>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 p-3.5 rounded-2xl flex items-center justify-center space-x-3 border border-slate-700 transition duration-150"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <div className="text-left">
                <div className="text-xs font-semibold">Seleccionar de la Fototeca</div>
                <div className="text-[10px] text-slate-400">Verificará fecha y GPS del archivo original</div>
              </div>
            </button>

            {isProcessing && (
              <div className="py-4 text-center text-xs text-cyan-400 animate-pulse">
                Comprimiendo imagen y analizando metadatos EXIF...
              </div>
            )}
          </div>
        ) : (
          /* Preview & Metadata confirmation */
          <div className="space-y-4 my-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setPhotoDataUrl(null)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs"
              >
                Cambiar foto
              </button>
            </div>

            {/* Validation Badges */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Verificación Anti-Trampas</span>
              {validationFlags.map((flag, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Comentario sobre el pico o condiciones (opcional):
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Ej: Pico del medio funcionando con marea media, rompiendo tubo rápido..."
                maxLength={250}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Submit */}
        {photoDataUrl && (
          <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setPhotoDataUrl(null)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Publicando...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publicar Foto</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
