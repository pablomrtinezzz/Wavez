'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, MapPin, RotateCcw, X } from 'lucide-react';
import { Spot } from '@/domain/models/Spot';
import { DeviceLocation } from '@/domain/models/SpotReport';
import { ExifSecurityValidator } from '@/domain/services/ExifSecurityValidator';
import { Spinner } from '@/presentation/components/ui/primitives';

interface ReportDialogProps {
  spot: Spot | null;
  onClose: () => void;
  onSubmitted: () => void;
}

/** Same geofence the server enforces. */
const MAX_DISTANCE_METERS = 2500;
const MAX_DIMENSION = 1280;

type Step =
  | { kind: 'intro' }
  | { kind: 'locating' }
  | { kind: 'camera' }
  | { kind: 'review'; photo: string }
  | { kind: 'blocked'; message: string };

function getPosition(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Tu navegador no permite compartir la ubicación.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Sin acceso a tu ubicación no podemos verificar que estás en el spot. Actívala en los ajustes del navegador.'
              : 'No pudimos obtener tu ubicación. Prueba de nuevo al aire libre.'
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Community photo capture. To keep reports honest the photo can only be taken
 * live with the in-page camera (no camera roll) and the device must be within
 * the spot's geofence; the server enforces the same rules.
 */
export function ReportDialog({ spot, onClose, onSubmitted }: ReportDialogProps) {
  if (!spot) return null;
  return <ReportDialogPanel key={spot.id} spot={spot} onClose={onClose} onSubmitted={onSubmitted} />;
}

function ReportDialogPanel({ spot, onClose, onSubmitted }: { spot: Spot; onClose: () => void; onSubmitted: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopCamera();
    };
  }, [onClose, stopCamera]);

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setStep({ kind: 'blocked', message: 'Tu navegador no permite usar la cámara desde la web.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep({ kind: 'camera' });
      // The <video> element mounts with the camera step
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => null);
        }
      });
    } catch {
      setStep({ kind: 'blocked', message: 'Necesitamos acceso a la cámara para hacer la foto. Actívalo en los ajustes del navegador.' });
    }
  };

  const start = async () => {
    setStep({ kind: 'locating' });
    try {
      const position = await getPosition();
      const check = ExifSecurityValidator.validate({
        captureMethod: 'camera_direct',
        deviceLocation: position,
        spotCoordinates: spot.location,
        maxDistanceMeters: MAX_DISTANCE_METERS,
      });
      const distance = check.distanceToSpotMeters ?? Infinity;
      if (distance > MAX_DISTANCE_METERS) {
        setStep({
          kind: 'blocked',
          message: `Estás a unos ${(distance / 1000).toFixed(1)} km de ${spot.name}. Solo se pueden subir fotos hechas desde el spot.`,
        });
        return;
      }
      setLocation(position);
      await openCamera();
    } catch (err) {
      setStep({ kind: 'blocked', message: (err as Error).message });
    }
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * ratio);
    canvas.height = Math.round(video.videoHeight * ratio);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    setStep({ kind: 'review', photo: canvas.toDataURL('image/jpeg', 0.8) });
  };

  const submit = async (photo: string) => {
    if (!location) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, photoUrl: photo, captureMethod: 'camera_direct', deviceLocation: location, userNote: note }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'No se pudo publicar la foto');
      onSubmitted();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button aria-label="Cerrar" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/40 animate-fade-in" />
      <div className="relative max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-2xl animate-fade-in sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Foto del pico</p>
            <h2 id="report-title" className="display mt-1 text-3xl">{spot.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-line/60 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {step.kind === 'intro' && (
          <div className="mt-6 space-y-5">
            <p className="text-sm leading-relaxed text-ink-2">
              Para que las fotos sean fiables, solo se pueden hacer <span className="text-ink">en el momento y desde el spot</span>.
            </p>
            <ul className="space-y-3 text-sm text-ink-2">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ocean" />
                Comprobaremos tu ubicación (debes estar a menos de {MAX_DISTANCE_METERS / 1000} km). No la guardamos más allá de la foto.
              </li>
              <li className="flex gap-3">
                <Camera className="mt-0.5 size-4 shrink-0 text-ocean" />
                Se abrirá la cámara aquí mismo; no se pueden subir fotos del carrete.
              </li>
            </ul>
            <button
              onClick={start}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-sand transition hover:bg-ocean"
            >
              <Camera className="size-4" /> Empezar
            </button>
          </div>
        )}

        {step.kind === 'locating' && (
          <p className="mt-10 mb-6 flex items-center gap-3 text-sm text-ink-2">
            <Spinner /> Comprobando tu ubicación…
          </p>
        )}

        {step.kind === 'camera' && (
          <div className="mt-6 space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink sm:aspect-[4/3]">
              <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
            </div>
            <button
              onClick={shoot}
              className="mx-auto flex size-16 items-center justify-center rounded-full border-4 border-ink/15 bg-ink transition hover:bg-ocean"
              aria-label="Hacer foto"
            >
              <span className="size-12 rounded-full border-2 border-sand" />
            </button>
          </div>
        )}

        {step.kind === 'review' && (
          <div className="mt-6 space-y-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a data URL */}
            <img src={step.photo} alt="Vista previa" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <p className="flex items-center gap-2 text-sm text-ink-2">
              <MapPin className="size-4 text-q-good" /> Ubicación verificada en {spot.name.split(' (')[0]}
            </p>
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
              <button
                onClick={openCamera}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line-strong px-4 py-3 text-sm text-ink hover:border-ink"
              >
                <RotateCcw className="size-4" /> Repetir
              </button>
              <button
                onClick={() => submit(step.photo)}
                disabled={submitting}
                className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-sand transition hover:bg-ocean disabled:opacity-50"
              >
                {submitting && <Spinner className="border-sand/40 border-t-sand" />}
                Publicar foto
              </button>
            </div>
          </div>
        )}

        {step.kind === 'blocked' && (
          <div className="mt-6 space-y-5">
            <p className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">{step.message}</p>
            <button onClick={start} className="w-full rounded-full border border-line-strong px-4 py-3 text-sm text-ink hover:border-ink">
              Intentar de nuevo
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
