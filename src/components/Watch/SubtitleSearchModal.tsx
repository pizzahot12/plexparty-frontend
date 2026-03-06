import React, { useState } from 'react';
import { Search, Download, X, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface SubtitleSearchModalProps {
  mediaId: string;
  onClose: () => void;
  onDownloadComplete: () => void;
}

interface SearchResult {
  Id: string;
  Name: string;
  Format: string;
  Language: string;
}

export const SubtitleSearchModal: React.FC<SubtitleSearchModalProps> = ({ mediaId, onClose, onDownloadComplete }) => {
  const [language, setLanguage] = useState('spa');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.searchSubtitles(mediaId, language);
      setResults(data);
    } catch (err) {
      setError((err as Error).message || 'Error buscando subtítulos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (subtitleId: string) => {
    setDownloadingId(subtitleId);
    setError(null);
    try {
      await apiService.downloadSubtitle(mediaId, subtitleId);
      onDownloadComplete();
    } catch (err) {
      setError((err as Error).message || 'Error descargando subtítulo');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white truncate pr-4">Buscar Subtítulos (Jellyfin)</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black/40 border border-white/10 text-white text-sm rounded-lg flex-1 p-2.5 focus:border-[#ff6b35] focus:outline-none transition-colors"
            >
              <option value="spa">Español</option>
              <option value="eng">Inglés</option>
              <option value="fre">Francés</option>
              <option value="ger">Alemán</option>
              <option value="ita">Italiano</option>
              <option value="por">Portugués</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#ff6b35] hover:bg-[#ff8555] text-white p-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {results.length === 0 && !loading && (
              <p className="text-white/40 text-center py-8 text-sm">
                No hay resultados para mostrar.
              </p>
            )}
            
            {results.map((sub) => (
              <div key={sub.Id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center justify-between gap-3 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90 truncate" title={sub.Name}>
                    {sub.Name}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {sub.Language} · {sub.Format}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(sub.Id)}
                  disabled={!!downloadingId}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                  title="Descargar"
                >
                  {downloadingId === sub.Id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
