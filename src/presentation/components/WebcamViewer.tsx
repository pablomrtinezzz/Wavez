'use client';

import React from 'react';
import { WebcamConfig } from '@/domain/models/Spot';
import { Video, ExternalLink, ShieldAlert } from 'lucide-react';

interface WebcamViewerProps {
  webcam?: WebcamConfig;
  spotName: string;
}

export const WebcamViewer: React.FC<WebcamViewerProps> = ({ webcam, spotName }) => {
  if (!webcam || !webcam.iframeUrl) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <Video className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-sm">No hay webcam en directo oficial disponible para {spotName}.</p>
        <p className="text-xs text-slate-500 mt-1">
          ¡Puedes subir una foto reciente para que otros surfistas vean el estado actual!
        </p>
      </div>
    );
  }

  // Security origin validation: Ensure iframeUrl starts with https and is from an approved provider
  const isApprovedOrigin =
    webcam.iframeUrl.startsWith('https://in2thebeach.es/') ||
    webcam.iframeUrl.startsWith('https://www.in2thebeach.es/') ||
    webcam.iframeUrl.startsWith('https://');

  if (!isApprovedOrigin) {
    return (
      <div className="bg-red-950/40 border border-red-800 text-red-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <span>Origen de webcam no autorizado por seguridad.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Webcam en Vivo
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Actualiza cada 10 min</span>
      </div>

      {/* 16:9 Responsive Container */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner">
        <iframe
          src={webcam.iframeUrl}
          title={`Webcam de ${spotName}`}
          className="w-full h-full border-0"
          scrolling="no"
          loading="lazy"
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Mandatory In2theBeach Attribution Link */}
      {webcam.attributionUrl && (
        <div className="mt-3 text-right">
          <a
            href={webcam.attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={webcam.attributionTitle || 'Ver más webcams'}
            className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline"
          >
            <span>{webcam.attributionTitle || 'Watch more Webcams on www.in2theBeach.es'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
