import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, List, Bookmark, ChevronLeft, ChevronRight, BookOpen, Languages, Trash2, Edit2, Plus, Volume2, VolumeX } from 'lucide-react';
import { SURAH_MAPPING, PARA_MAPPING, TAJWEED_LEGEND } from '@/lib/quranMapping';
import { storage } from '@/lib/storage';

const QURAN_API = 'https://api.quran.com/api/v4';

async function fetchJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

let chaptersCache = null;

async function getChapters() {
  if (chaptersCache) return chaptersCache;
  const data = await fetchJSON(`${QURAN_API}/chapters?language=en`);
  chaptersCache = data.chapters;
  return chaptersCache;
}

const versesCache = new Map();
const preloadQueue = new Set();

async function getVersesByPage(page) {
  if (versesCache.has(page)) return versesCache.get(page);
  const data = await fetchJSON(`${QURAN_API}/verses/by_page/${page}?words=true&translations=131&language=en&limit=100`);
  versesCache.set(page, data.verses);
  return data.verses;
}

function preloadAdjacent(page) {
  [page - 1, page + 1].forEach(p => {
    if (p >= 1 && p <= 604 && !versesCache.has(p) && !preloadQueue.has(p)) {
      preloadQueue.add(p);
      getVersesByPage(p).catch(() => {}).finally(() => preloadQueue.delete(p));
    }
  });
}

const PageTurnSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
};

export default function QuranWidget({ onClose }) {
  const [pageNumber, setPageNumber] = useState(() => {
    return parseInt(storage.get('quran_last_page')) || 1;
  });
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState(() => versesCache.get(parseInt(storage.get('quran_last_page')) || 1) || []);
  const [loading, setLoading] = useState(!versesCache.has(parseInt(storage.get('quran_last_page')) || 1));
  const [showUi, setShowUi] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTab, setMenuTab] = useState('surah');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    return storage.get('quran_bookmarks') || [];
  });
  const abortRef = useRef(null);

  useEffect(() => {
    storage.set('quran_last_page', pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    getChapters().then(setChapters).catch(() => {});
  }, []);

  useEffect(() => {
    if (versesCache.has(pageNumber)) {
      setVerses(versesCache.get(pageNumber));
      setLoading(false);
      preloadAdjacent(pageNumber);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    getVersesByPage(pageNumber)
      .then(data => {
        if (!controller.signal.aborted) {
          setVerses(data);
          setLoading(false);
          preloadAdjacent(pageNumber);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [pageNumber]);

  const goToPage = useCallback((page) => {
    if (page < 1 || page > 604) return;
    setPageNumber(page);
    if (soundEnabled) PageTurnSound();
    setShowMenu(false);
  }, [soundEnabled]);

  const handleAddBookmark = () => {
    const name = prompt("Enter a name for this bookmark:", `Page ${pageNumber}`);
    if (!name) return;
    const newBookmarks = [...bookmarks, { id: Date.now(), name, page: pageNumber }];
    setBookmarks(newBookmarks);
    storage.set('quran_bookmarks', newBookmarks);
  };

  const handleDeleteBookmark = (id) => {
    const newBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(newBookmarks);
    storage.set('quran_bookmarks', newBookmarks);
  };

  const handleRenameBookmark = (id) => {
    const bookmark = bookmarks.find(b => b.id === id);
    const newName = prompt("Enter new name:", bookmark.name);
    if (!newName) return;
    const newBookmarks = bookmarks.map(b => b.id === id ? { ...b, name: newName } : b);
    setBookmarks(newBookmarks);
    storage.set('quran_bookmarks', newBookmarks);
  };

  const currentSurahInfo = useMemo(() => {
    if (!chapters.length) return null;
    return chapters.find(ch => ch.pages[0] <= pageNumber && ch.pages[1] >= pageNumber);
  }, [chapters, pageNumber]);

  const totalPages = 604;

  return (
    <div className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col overflow-hidden select-none">

      {/* Top UI Overlay */}
      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none"
          >
            <div className="flex gap-3 pointer-events-auto">
              <button onClick={onClose} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-colors">
                <X size={22} />
              </button>
              <button onClick={() => setShowMenu(true)} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-colors">
                <List size={22} />
              </button>
            </div>
            <div className="flex gap-3 pointer-events-auto">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`p-2.5 rounded-full backdrop-blur transition-colors ${showTranslation ? 'bg-amber-500/30 text-amber-300' : 'bg-white/20 hover:bg-white/30'}`}
                title="Toggle Translation"
              >
                <Languages size={20} />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-colors"
              >
                {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
              <button
                onClick={handleAddBookmark}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-amber-400 transition-colors"
              >
                <Bookmark size={22} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Page Info */}
      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 inset-x-0 z-20 flex justify-center pointer-events-none"
          >
            <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full pointer-events-auto text-center border border-white/10 shadow-lg max-w-[85vw]">
              {currentSurahInfo && (
                <span className="text-sm font-bold text-white/90">
                  {currentSurahInfo.name_simple} ({currentSurahInfo.translated_name?.name})
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom UI */}
      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 inset-x-0 z-20 flex justify-center pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-full pointer-events-auto flex items-center gap-4 border border-white/10 shadow-xl">
              <button
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-medium text-sm min-w-[100px] text-center">
                Page {pageNumber} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= totalPages}
                className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto bg-gradient-to-b from-[#0a0a0f] via-[#111118] to-[#0d0d14] scroll-smooth" onClick={() => setShowUi(prev => !prev)}>
        <div className="max-w-2xl mx-auto px-4 py-24 min-h-full flex flex-col justify-center relative" ref={contentRef}>
          {loading && <div className="absolute inset-0 bg-[#0a0a0f]/40 backdrop-blur-[1px] z-10 flex items-start justify-center pt-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-white/40 font-medium">Loading...</span>
            </div>
          </div>}

          {verses.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-white/50 py-32">
              <BookOpen size={48} className="opacity-30" />
              <span className="text-sm font-medium">No verses found</span>
            </div>
          ) : verses.length > 0 ? (
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {verses.map((verse) => (
                <div key={verse.id} className="verse-block">
                  <div className="text-right" dir="rtl">
                    <div className="inline-flex flex-wrap gap-x-1 gap-y-0 justify-end items-baseline">
                      {verse.words.filter(w => w.char_type_name === 'word').map((word) => (
                        <span
                          key={word.id}
                          className="text-[28px] md:text-[32px] leading-[2.2] text-white/90 hover:text-white transition-colors"
                          style={{ fontFamily: "'Scheherazade New', 'Traditional Arabic', 'Arabic Typesetting', serif" }}
                        >
                          {word.code_v1 || word.text}
                        </span>
                      ))}
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 text-xs font-bold text-white/60 ml-2 -mt-1" dir="ltr">
                        {verse.verse_number}
                      </span>
                    </div>
                  </div>

                  {showTransliteration && (
                    <div className="mt-2 text-left" dir="ltr">
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-white/40 italic">
                        {verse.words.filter(w => w.char_type_name === 'word').map((word) => (
                          <span key={word.id}>{word.transliteration?.text || ''}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {showTranslation && (
                    <div className="mt-2 text-left border-t border-white/5 pt-2">
                      <p className="text-sm md:text-base text-white/60 leading-relaxed">
                        {verse.words.filter(w => w.char_type_name === 'word').map(w => w.translation?.text).filter(Boolean).join(' ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="absolute inset-0 bg-black/60 z-[105] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-background text-foreground z-[110] flex flex-col shadow-2xl border-r border-border"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-card">
                <h3 className="font-heading font-bold text-xl tracking-tight">Index</h3>
                <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-secondary bg-secondary/50 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex border-b border-border bg-card/50">
                {['surah', 'para', 'legend', 'bookmarks'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMenuTab(tab)}
                    className={`flex-1 py-3.5 text-sm font-semibold transition-colors capitalize ${menuTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'bookmarks' ? 'Bookmarks' : tab === 'legend' ? 'Tajweed' : tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuTab === 'surah' && SURAH_MAPPING.map(surah => (
                  <button
                    key={surah.id}
                    onClick={() => goToPage(surah.page)}
                    className={`w-full text-left p-4 hover:bg-secondary rounded-xl flex justify-between items-center transition-colors group ${currentSurahInfo?.id === surah.id ? 'bg-primary/5 border border-primary/20' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {surah.id}
                      </div>
                      <div>
                        <span className="font-bold text-[15px] group-hover:text-primary transition-colors">{surah.name}</span>
                        {currentSurahInfo?.id === surah.id && (
                          <span className="block text-[10px] text-primary font-semibold mt-0.5">Current</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium bg-secondary group-hover:bg-background px-2 py-1 rounded-md">Pg {surah.page}</span>
                  </button>
                ))}

                {menuTab === 'para' && PARA_MAPPING.map(para => (
                  <button
                    key={para.id}
                    onClick={() => goToPage(para.page)}
                    className="w-full text-left p-4 hover:bg-secondary rounded-xl flex justify-between items-center transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {para.id}
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Juz {para.id}</div>
                        <div className="font-bold text-[15px] group-hover:text-primary transition-colors">{para.name}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium bg-secondary group-hover:bg-background px-2 py-1 rounded-md">Pg {para.page}</span>
                  </button>
                ))}

                {menuTab === 'legend' && (
                  <div className="p-2 space-y-3 mt-2">
                    {TAJWEED_LEGEND.map(legend => (
                      <div key={legend.name} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border/50">
                        <div className="w-5 h-5 rounded-full shadow-inner ring-2 ring-background" style={{ backgroundColor: legend.color }} />
                        <div>
                          <div className="font-bold text-sm text-foreground">{legend.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{legend.rule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {menuTab === 'bookmarks' && (
                  <div className="p-2 space-y-2">
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground text-sm italic">
                        No bookmarks yet.
                      </div>
                    ) : (
                      bookmarks.map(b => (
                        <div key={b.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => goToPage(b.page)}
                            className="flex-1 text-left p-4 hover:bg-secondary rounded-xl flex justify-between items-center transition-colors bg-secondary/20"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-[15px]">{b.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">Page {b.page}</span>
                            </div>
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRenameBookmark(b.id)}
                              className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Rename"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBookmark(b.id)}
                              className="p-2.5 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-card/50">
                <button
                  onClick={handleAddBookmark}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Plus size={18} />
                  New Bookmark
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
