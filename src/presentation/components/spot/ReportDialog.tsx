'use client';

import React, { useEffect, useRef, useState } from 'react';
import exifr from 'exifr';
import { Camera, ImageUp, X, Check, AlertTriangle } from 'lucide-react';
import { Spot } from '@/domain/models/Spot';
import { ExifData } from '@/domain/models/SpotReport';
import { ExifSecurityValidator, ValidationResult } from '@/domain/services/ExifSecurityValidator';
import { Spinner } from '@/presentation/components/ui/primitives';

interface ReportDialogProps {
  spot: Spot | null;
  onClose: () => void;
  onSubmitted: () => void;
}

type CaptureMethod = 'camera_direct' | 'gallery_upload';

const MAX_DIMENSION = 1280;

/** Downscale on the device so uploads stay light on mobile data. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Tu navegador no permite procesar la imagen'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

/** Human summary of the same checks the server will run. */
function describeChecks(method: CaptureMethod, exif: ExifData, v: ValidationResult): { ok: boolean | null; text: string }[] {
  const checks: { ok: boolean | null; text: string }[] = [
    method === 'camera_direct'
      ? { ok: true, text: 'Hecha con la cámara ahora' }
      : { ok: null, text: 'Elegida de la galería' },
  ];
  if (!exif.dateTimeOriginal) {
    checks.push({ ok: method === 'camera_direct' ? true : null, text: method === 'camera_direct' ? 'Hora de captura: ahora' : 'Sin fecha de captura (WhatsApp y otras apps la borran)' });
  } else if (!v.isValid) {
    checks.push({ ok: false, text: v.rejectionReason ?? 'Fecha no válida' });
  } else {
    const minutes = Math.max(0, Math.round((Date.now() - Date.parse(exif.dateTimeOriginal)) / 60000));
    checks.push({ ok: true, text: `Tomada hace ${minutes} min` });
  }
  if (v.distanceToSpotMeters === undefined) {
    checks.push({ ok: null, text: 'Sin ubicación GPS en la foto' });
  } else {
    const km = (v.distanceToSpotMeters / 1000).toFixed(1);
    checks.push(
      v.flags.some((f) => f.startsWith('FUERA_DE_RANGO'))
        ? { ok: false, text: `Tomada a ${km} km del spot` }
        : { ok: true, text: `Tomada a ${v.distanceToSpotMeters < 1000 ? `${v.distanceToSpotMeters} m` : `${km} km`} del spot` }
    );
  }
  return checks;
}

export function ReportDialog({ spot, onClose, onSubmitted }: ReportDialogProps) {
  if (!spot) return null;
  return <ReportDialogPanel key={spot.id} spot={spot} onClose={onClose} onSubmitted={onSubmitted} />;
}

function ReportDialogPanel({ spot, onClose, onSubmitted }: { spot: Spot; onClose: () => void; onSubmitted: () => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [method, setMethod] = useState<CaptureMethod>('camera_direct');
  const [exif, setExif] = useState<ExifData>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'processing' | 'submitting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validation = photo
    ? ExifSecurityValidator.validate({ captureMethod: method, exifData: exif, spotCoordinates: spot.location })
    : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, m: CaptureMethod) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('processing');
    setError(null);
    setMethod(m);
    try {
      let extracted: ExifData = {};
      try {
        const parsed = await exifr.parse(file, ['DateTimeOriginal', 'latitude', 'longitude', 'Make', 'Model']);
        if (parsed) {
          extracted = {
            dateTimeOriginal: parsed.DateTimeOriginal ? new Date(parsed.DateTimeOriginal).toISOString() : undefined,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            deviceMake: parsed.Make,
            deviceModel: parsed.Model,
          };
        }
      } catch {
        // Photos without EXIF are still accepted, just not verified
      }
      setExif(extracted);
      setPhoto(await compressImage(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!photo) return;
    setBusy('submitting');
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, photoUrl: photo, captureMethod: method, exifData: exif, userNote: note }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'No se pudo publicar la foto');
      onSubmitted();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button aria-label="Cerrar" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/40 animate-fade-in" />
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Foto del pico</p>
            <h2 id="report-title" className="display mt-1 text-3xl">{spot.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-line/60 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e, 'camera_direct')} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'gallery_upload')} />

        {!photo ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm leading-relaxed text-ink-2">
              Las fotos hechas en el momento y en la playa se marcan como verificadas. Comprobamos la hora y la ubicación que guarda la
              propia foto.
            </p>
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-sand transition hover:bg-accent disabled:opacity-60"
            >
              {busy === 'processing' ? <Spinner className="border-sand/40 border-t-sand" /> : <Camera className="size-4" />}
              Hacer foto ahora
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm text-ink transition hover:border-ink disabled:opacity-60"
            >
              <ImageUp className="size-4" /> Elegir de la galería
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL */}
            <img src={photo} alt="Vista previa" className="aspect-[4/3] w-full rounded-lg object-cover" />

            {validation && (
              <div>
                <ul className="space-y-1.5 text-sm">
                  {describeChecks(method, exif, validation).map((c) => (
                    <li key={c.text} className="flex items-start gap-2">
                      {c.ok === true ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      ) : c.ok === false ? (
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                      ) : (
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3 mx-[5px]" aria-hidden />
                      )}
                      <span className={c.ok === false ? 'text-danger' : 'text-ink-2'}>{c.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink">
                  {!validation.isValid
                    ? 'Esta foto no se puede publicar.'
                    : validation.isRealtimeVerified
                    ? 'Se publicará como foto verificada.'
                    : 'Se publicará sin el sello de verificada.'}
                </p>
              </div>
            )}

            <label className="block">
              <span className="text-sm text-ink-2">¿Cómo está? (opcional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Series de un metro, marea subiendo, poca gente…"
                className="mt-1.5 w-full resize-none rounded-lg border border-line-strong bg-transparent p-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
              />
            </label>

            <div className="flex gap-3">
              <button onClick={() => setPhoto(null)} className="flex-1 rounded-full border border-line-strong px-4 py-3 text-sm text-ink hover:border-ink">
                Otra foto
              </button>
              <button
                onClick={submit}
                disabled={busy !== null || (validation !== null && !validation.isValid)}
                className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-sand transition hover:bg-accent disabled:opacity-50"
              >
                {busy === 'submitting' && <Spinner className="border-sand/40 border-t-sand" />}
                Publicar foto
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
