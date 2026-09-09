import React from 'react';
import { AlertTriangle, ShieldAlert, Download, Lock } from 'lucide-react';

interface UnsavedWarningBannerProps {
  hasTrack: boolean;
  onOpenExport: () => void;
  downloaded: boolean;
}

export const UnsavedWarningBanner: React.FC<UnsavedWarningBannerProps> = ({
  hasTrack,
  onOpenExport,
  downloaded,
}) => {
  if (!hasTrack) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900/90 to-amber-950/70 border-y border-amber-500/30 px-4 py-2.5 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-200/90">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
            {downloaded ? <Lock className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />}
          </div>
          <div>
            <span className="font-semibold text-amber-300">
              {downloaded ? 'Local Processing Notice:' : 'DATA PRESERVATION NOTICE:'}
            </span>{' '}
            <span className="text-zinc-300">
              {downloaded
                ? 'Your file has been downloaded. The application has no backup or recovery feature.'
                : 'Save exports before leaving. This application is not a backup service and browser behavior may vary.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/10 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloaded ? 'Export Another Format' : 'Download Master Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
