import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, List, Bookmark, ChevronLeft, ChevronRight, BookOpen, Languages, Trash2, Edit2, Plus, Volume2, VolumeX } from 'lucide-react';
import { SURAH_MAPPING, PARA_MAPPING, TAJWEED_LEGEND } from '@/lib/quranMapping';
import { storage } from '@/lib/storage';

const QURAN_API = 'https://api.quran.com/api/v4';

async function fetchJSON(url, signal?) {
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
  } catch (e) { }
};

const TOTAL_PAGES = 604;

const TAJWEED_COLORS = {
  ghunnah: '#EF4444',
  qalqalah: '#3B82F6',
  ikhfa: '#10B981',
  idgham: '#F59E0B',
  iqlab: '#8B5CF6',
  silent: '#6B7280',
};

const QALQALAH_LETTERS = /[qṭbjd]$/i;
const DEEP_QALQALAH = /[qṭbjd]/i;
const GHUNNAH_PATTERN = /(?:[iu]nn[ae]|ann[aeiu]|unn[ui]|inn[ui]|ummm?[ae]?|imm[ae]?|amm[aeiu]?)/i;
const IDGHAM_PATTERN = /^(?:a[lsrwmnb]|bi[lsrwmnb]|fa[lsrwmnb]|li[lsrwmnb]|wa[lsrwmnb])/i;
const IQLAB_PATTERN = /[aui]nb[auieo]?/i;
const IKHFA_PATTERN = /[aui]n[tgdjzkqsf]|[aui]n[td]|[aui]n[ṣḍṭ]|[aui]n[zḏ]|[aui]n[ṯ]|[aui]n[ẓ]/i;

function analyzeTajweed(translitText) {
  if (!translitText) return null;
  const t = translitText.toLowerCase()
    .replace(/[ā]/g, 'a').replace(/[ī]/g, 'i').replace(/[ū]/g, 'u')
    .replace(/[ṣ]/g, 's').replace(/[ḍ]/g, 'd').replace(/[ṭ]/g, 't')
    .replace(/[ẓ]/g, 'z').replace(/[ḏ]/g, 'd').replace(/[ṯ]/g, 't')
    .replace(/[ḥ]/g, 'h').replace(/[ġ]/g, 'g').replace(/[‘]/g, "'");
  if (!t) return null;

  if (GHUNNAH_PATTERN.test(t)) return 'ghunnah';
  if (IQLAB_PATTERN.test(t)) return 'iqlab';
  if (IKHFA_PATTERN.test(t)) return 'ikhfa';
  if (DEEP_QALQALAH.test(t)) return 'qalqalah';
  if (IDGHAM_PATTERN.test(t)) return 'idgham';
  if (t.length >= 3 && t.startsWith('a') && t[1] === t[2]) return 'idgham';

  return null;
}

function mapLinesTo13(verses) {
  const allWords = [];
  for (const verse of verses) {
    for (const word of verse.words) {
      if (word.char_type_name === 'word') {
        allWords.push({ ...word, verseNumber: verse.verse_number });
      }
    }
  }
  if (!allWords.length) return [];

  const lineMap = new Map();
  for (const w of allWords) {
    const ln = w.line_number || 1;
    if (!lineMap.has(ln)) lineMap.set(ln, []);
    lineMap.get(ln).push(w);
  }
  const sortedGroups = [...lineMap.entries()].sort((a, b) => a[0] - b[0]).map(([_, ws]) => ws);
  while (sortedGroups.length > 13) {
    let minIdx = 0;
    let minCount = Infinity;
    for (let i = 0; i < sortedGroups.length - 1; i++) {
      const c = sortedGroups[i].length + sortedGroups[i + 1].length;
      if (c < minCount) { minCount = c; minIdx = i; }
    }
    sortedGroups[minIdx] = [...sortedGroups[minIdx], ...sortedGroups[minIdx + 1]];
    sortedGroups.splice(minIdx + 1, 1);
  }
  while (sortedGroups.length < 13) {
    let maxIdx = 0;
    let maxCount = 0;
    for (let i = 0; i < sortedGroups.length; i++) {
      if (sortedGroups[i].length > maxCount) { maxCount = sortedGroups[i].length; maxIdx = i; }
    }
    const mid = Math.ceil(sortedGroups[maxIdx].length / 2);
    sortedGroups.splice(maxIdx + 1, 0, sortedGroups[maxIdx].splice(mid));
  }
  return sortedGroups;
}

function WordSpan({ word }) {
  const tajweedClass = useMemo(() => analyzeTajweed(word.transliteration?.text), [word.transliteration?.text]);
  const color = tajweedClass ? TAJWEED_COLORS[tajweedClass] : null;
  return (
    <span
      className="inline-block mx-[1px] leading-[1.8] md:leading-[2] text-[26px] md:text-[30px] transition-colors relative"
      style={{
        fontFamily: "'Scheherazade New', 'Traditional Arabic', 'Arabic Typesetting', serif",
        color: color || '#e8e6e3',
      }}
      title={tajweedClass ? tajweedClass.charAt(0).toUpperCase() + tajweedClass.slice(1) : ''}
    >
      {word.code_v1 || word.text}
    </span>
  );
}

function VerseMarker({ number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border border-white/15 text-[10px] font-bold text-white/50 ml-1.5 -mt-0.5 shrink-0">
      {number}
    </span>
  );
}

function SkeletonLine() {
  const width = 55 + Math.random() * 40;
  return (
    <div className="flex justify-end gap-1.5 py-[2px]">
      <div className="h-[30px] rounded-md bg-white/5 animate-pulse" style={{ width: `${width}%` }} />
      <div className="w-6 h-6 rounded-full bg-white/5 animate-pulse shrink-0" />
    </div>
  );
}

function PageLines({ lines, verses, showTranslation, showTransliteration }) {
  const verseMap = useMemo(() => {
    const m = new Map();
    for (const v of verses) m.set(v.verse_number, v);
    return m;
  }, [verses]);

  return (
    <div className="space-y-0 w-full">
      {lines.map((lineWords, lineIdx) => {
        if (!lineWords.length) return <div key={`line-${lineIdx}`} className="h-[30px] md:h-[34px]" />;

        const verseMarkers = [];
        const renderedWords = [];
        let currentVerseNum = null;
        let wordBuffer = [];

        for (const w of lineWords) {
          if (w.verseNumber !== currentVerseNum && currentVerseNum !== null) {
            renderedWords.push({ type: 'group', words: wordBuffer, verseNum: currentVerseNum });
            wordBuffer = [];
          }
          currentVerseNum = w.verseNumber;
          wordBuffer.push(w);

          const isLastWordOfVerse = !lineWords.some(w2 => w2.verseNumber === currentVerseNum && w2.position > w.position);
          const isLastInLine = w === lineWords[lineWords.length - 1];
          if (isLastWordOfVerse || isLastInLine) {
            if (wordBuffer.length) {
              renderedWords.push({ type: 'group', words: wordBuffer, verseNum: currentVerseNum, showMarker: isLastWordOfVerse });
              wordBuffer = [];
            }
          }
        }
        if (wordBuffer.length) {
          renderedWords.push({ type: 'group', words: wordBuffer, verseNum: currentVerseNum, showMarker: true });
        }

        return (
          <div
            key={`line-${lineIdx}`}
            className="flex items-baseline justify-end gap-0 py-[0.5px] sm:py-0"
            style={{ minHeight: '32px' }}
          >
            <div className="flex items-baseline justify-end flex-wrap gap-0" dir="rtl">
              {renderedWords.map((group, gi) => (
                <span key={gi} className="inline-flex items-baseline gap-0" dir="rtl">
                  {group.words.map(w => <WordSpan key={w.id} word={w} />)}
                  {group.showMarker && (
                    <VerseMarker number={group.verseNum} />
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function QuranWidget({ onClose }) {
  const [pageNumber, setPageNumber] = useState(() => parseInt(storage.get('quran_last_page')) || 1);
  const [chapters, setChapters] = useState([]);
  const [verses, setVerses] = useState([]);
  const [ready, setReady] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTab, setMenuTab] = useState('surah');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => storage.get('quran_bookmarks') || []);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  const loadPage = useCallback((page) => {
    if (versesCache.has(page)) {
      setVerses(versesCache.get(page));
      setReady(true);
      preloadAdjacent(page);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    getVersesByPage(page).then(data => {
      if (!controller.signal.aborted) {
        setVerses(data);
        setReady(true);
        preloadAdjacent(page);
      }
    }).catch(() => { });
    return () => controller.abort();
  }, []);

  useEffect(() => { storage.set('quran_last_page', pageNumber); }, [pageNumber]);
  useEffect(() => { getChapters().then(setChapters).catch(() => {}); }, []);

  useEffect(() => {
    setReady(false);
    const cleanup = loadPage(pageNumber);
    return () => cleanup?.();
  }, [pageNumber, loadPage]);

  const lines = useMemo(() => verses.length ? mapLinesTo13(verses) : [], [verses]);

  const goToPage = useCallback((page) => {
    if (page < 1 || page > TOTAL_PAGES) return;
    setPageNumber(page);
    if (soundEnabled) PageTurnSound();
    setShowMenu(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] text-white flex flex-col overflow-hidden select-none">
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
                Page {pageNumber} / {TOTAL_PAGES}
              </span>
              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= TOTAL_PAGES}
                className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto bg-gradient-to-b from-[#0a0a0f] via-[#111118] to-[#0d0d14] scroll-smooth"
        onClick={() => setShowUi(prev => !prev)}
      >
        <div className="max-w-xl mx-auto px-3 sm:px-4 py-28 min-h-full flex flex-col justify-center">
          {!ready ? (
            <div className="w-full space-y-0">
              {Array.from({ length: 13 }, (_, i) => (
                <SkeletonLine key={i} />
              ))}
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 text-white/50 py-32">
              <BookOpen size={48} className="opacity-30" />
              <span className="text-sm font-medium">No verses found</span>
            </div>
          ) : (
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="space-y-4">
                <PageLines
                  lines={lines}
                  verses={verses}
                  showTranslation={showTranslation}
                  showTransliteration={showTransliteration}
                />
                {(showTranslation || showTransliteration) && (
                  <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
                    {verses.map(verse => (
                      <div key={verse.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white/40 bg-white/5 rounded-full px-2 py-0.5">
                            {verse.verse_key}
                          </span>
                        </div>
                        {showTransliteration && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-white/30 italic leading-relaxed" dir="ltr">
                            {verse.words.filter(w => w.char_type_name === 'word').map((word) => (
                              <span key={word.id}>{word.transliteration?.text || ''}</span>
                            ))}
                          </div>
                        )}
                        {showTranslation && (
                          <p className="text-sm md:text-base text-white/50 leading-relaxed" dir="ltr">
                            {verse.words.filter(w => w.char_type_name === 'word').map(w => w.translation?.text).filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

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
                        <div className="w-5 h-5 rounded-full shadow-inner ring-2 ring-background shrink-0" style={{ backgroundColor: legend.color }} />
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

      <style>{`
        @keyframes tajweed-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .verse-block {
          transition: background-color 0.2s;
        }
      `}</style>
    </div>
  );
}
