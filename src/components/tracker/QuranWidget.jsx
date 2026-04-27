import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import { Bookmark, List, X, Volume2, VolumeX, BookOpen, Trash2, Edit2, Plus } from 'lucide-react';
import { SURAH_MAPPING, PARA_MAPPING, TAJWEED_LEGEND } from '@/lib/quranMapping';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

const PageComponent = React.forwardRef(({ pageNumber, width, height, onPageClick }, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-[#fdfaf3] flex items-center justify-center shadow-lg border border-black/10" 
      style={{ width, height }}
      onClick={(e) => {
        // Only trigger UI toggle if we didn't click too close to the edges (to allow flipping)
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x > rect.width * 0.15 && x < rect.width * 0.85) {
          onPageClick();
        }
      }}
    >
      <Page 
        pageNumber={pageNumber} 
        width={width}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  );
});

export default function QuranWidget({ onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(() => {
    return parseInt(localStorage.getItem('quran_last_page')) || 1;
  });
  const [showUi, setShowUi] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTab, setMenuTab] = useState('surah'); // surah, para, legend, bookmarks
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
  });
  
  const bookRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    localStorage.setItem('quran_last_page', pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Calculate dimensions for ONE page (aspect ratio ~1:1.4)
      let pageHeight = h;
      let pageWidth = h * 0.7; 
      
      if (pageWidth > w) {
        pageWidth = w;
        pageHeight = w / 0.7;
      }
      
      setDimensions({ width: Math.floor(pageWidth), height: Math.floor(pageHeight) });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePageTurn = (e) => {
    setPageNumber(e.data + 1);
    if (soundEnabled) {
      PageTurnSound();
    }
  };

  const jumpToPage = (page) => {
    if (bookRef.current) {
      bookRef.current.pageFlip().turnToPage(page - 1);
    }
    setShowMenu(false);
  };

  const handleAddBookmark = () => {
    const name = prompt("Enter a name for this bookmark:", `Page ${pageNumber}`);
    if (!name) return;
    const newBookmarks = [...bookmarks, { id: Date.now(), name, page: pageNumber }];
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
  };

  const handleDeleteBookmark = (id) => {
    if (confirm("Delete this bookmark?")) {
      const newBookmarks = bookmarks.filter(b => b.id !== id);
      setBookmarks(newBookmarks);
      localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
    }
  };

  const handleRenameBookmark = (id) => {
    const bookmark = bookmarks.find(b => b.id === id);
    const newName = prompt("Enter new name:", bookmark.name);
    if (!newName) return;
    const newBookmarks = bookmarks.map(b => b.id === id ? { ...b, name: newName } : b);
    setBookmarks(newBookmarks);
    localStorage.setItem('quran_bookmarks', JSON.stringify(newBookmarks));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden select-none">
      
      {/* UI Overlay */}
      <AnimatePresence>
        {showUi && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none"
          >
            <div className="flex gap-4 pointer-events-auto">
              <button onClick={onClose} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-colors">
                <X size={22} />
              </button>
              <button onClick={() => setShowMenu(true)} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-colors">
                <List size={22} />
              </button>
            </div>
            
            <div className="flex gap-4 pointer-events-auto">
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
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 inset-x-0 z-20 flex justify-center pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur px-5 py-2.5 rounded-full pointer-events-auto font-medium text-sm border border-white/10 shadow-xl">
              Page {pageNumber} {numPages && <span className="opacity-60">/ {numPages}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reader */}
      <div className="flex-1 w-full h-full flex items-center justify-center bg-[#111] z-0 overflow-hidden">
        {dimensions.width > 0 && (
          <div style={{ width: dimensions.width, height: dimensions.height }} className="relative shadow-2xl">
            <Document
              file="/quran.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center text-white/50 animate-pulse gap-3">
                  <BookOpen size={40} className="opacity-50" />
                  <span>Loading Quran...</span>
                </div>
              }
              className="w-full h-full"
            >
              <HTMLFlipBook 
                width={dimensions.width}
                height={dimensions.height}
                size="stretch"
                minWidth={dimensions.width}
                maxWidth={dimensions.width}
                minHeight={dimensions.height}
                maxHeight={dimensions.height}
                maxShadowOpacity={0.4}
                showCover={false}
                mobileScrollSupport={true}
                ref={bookRef}
                onFlip={handlePageTurn}
                startPage={pageNumber - 1}
                className="w-full h-full"
                drawShadow={true}
                flippingTime={800}
                usePortrait={true}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
              >
                {Array.from(new Array(numPages || 604), (el, index) => (
                  <PageComponent 
                    key={`page_${index + 1}`} 
                    pageNumber={index + 1} 
                    width={dimensions.width}
                    height={dimensions.height}
                    onPageClick={() => setShowUi(prev => !prev)}
                  />
                ))}
              </HTMLFlipBook>
            </Document>
          </div>
        )}
      </div>

      {/* Menus Overlay */}
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
                <button 
                  onClick={() => setMenuTab('surah')}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${menuTab === 'surah' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Surah
                </button>
                <button 
                  onClick={() => setMenuTab('para')}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${menuTab === 'para' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Juz
                </button>
                <button 
                  onClick={() => setMenuTab('legend')}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${menuTab === 'legend' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Tajweed
                </button>
                <button 
                  onClick={() => setMenuTab('bookmarks')}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${menuTab === 'bookmarks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Bookmarks
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuTab === 'surah' && SURAH_MAPPING.map(surah => (
                  <button 
                    key={surah.id} 
                    onClick={() => jumpToPage(surah.page)}
                    className="w-full text-left p-4 hover:bg-secondary rounded-xl flex justify-between items-center transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {surah.id}
                      </div>
                      <span className="font-bold text-[15px] group-hover:text-primary transition-colors">{surah.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium bg-secondary group-hover:bg-background px-2 py-1 rounded-md">Pg {surah.page}</span>
                  </button>
                ))}

                {menuTab === 'para' && PARA_MAPPING.map(para => (
                  <button 
                    key={para.id} 
                    onClick={() => jumpToPage(para.page)}
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
                            onClick={() => jumpToPage(b.page)}
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
