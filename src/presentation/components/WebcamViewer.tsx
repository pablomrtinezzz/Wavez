'use client';

import React, { useRef, useState } from 'react';
import { WebcamConfig } from '@/domain/models/Spot';
import { Video, ExternalLink, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';

interface WebcamViewerProps {
  webcam?: WebcamConfig;
  spotName: string;
}

export const WebcamViewer: React.FC<WebcamViewerProps> = ({ webcam, spotName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!webcam || !webcam.iframeUrl) {
    return (
      <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-6 text-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Sin webcam oficial disponible para {spotName}
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Los surfistas de la comunidad pueden subir fotos verificadas con cámara y GPS para reportar las condiciones en tiempo real.
        </p>
      </div>
    );
  }

  // Security origin validation: Ensure iframeUrl starts with https and approved origin
  const isApprovedOrigin =
    webcam.iframeUrl.startsWith('https://in2thebeach.es/') ||
    webcam.iframeUrl.startsWith('https://www.in2thebeach.es/') ||
    webcam.iframeUrl.startsWith('https://');

  if (!isApprovedOrigin) {
    return (
      <div className="bg-red-950/40 border border-red-800 text-red-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <span>Origen de webcam no autorizado por directiva de seguridad.</span>
      </div>
    );
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/10 overflow-hidden"
    >
      {/* Tactical Player Control Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center space-x-1.5">
            <span>FEED EN VIVO</span>
            <span className="text-[10px] text-slate-500 font-normal">| {spotName}</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="hidden sm:inline bg-slate-900 px-2 py-0.5 rounded-md border border-white/5">
            Actualización: cada 10 min
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 16:9 Video Canvas Frame */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner group">
        <iframe
          src={webcam.iframeUrl}
          title={`Webcam en vivo de ${spotName}`}
          className="w-full h-full border-0"
          scrolling="no"
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Mandatory Attribution Link (In2theBeach requirements) */}
      {webcam.attributionUrl && (
        <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Canal óptico oficial</span>
          <a
            href={webcam.attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={webcam.attributionTitle || 'Ver más webcams en in2thebeach'}
            className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
          >
            <span>{webcam.attributionTitle || 'Watch more Webcams on www.in2theBeach.es'}</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      )}
    </div>
  );
};
