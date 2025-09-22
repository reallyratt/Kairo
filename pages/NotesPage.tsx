import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TNote, TTag, TFolder } from '../types';
import Header from '../components/Header';
import CustomSelect from '../components/CustomSelect';
import { COLORS } from '../constants';
import Modal from '../components/Modal';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

// --- Helper Functions ---
const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Return a preview by taking the first 100 characters.
  return (doc.body.textContent || "").substring(0, 100);
};

const useUnsavedChangesWarning = (hasChanges: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);
};

// --- Note Editor Sub-components ---

const EditBar: React.FC<{ 
    onCommand: (cmd: string, val?: string) => void,
    onMediaAction: (action: 'link' | 'image' | 'audio' | 'draw') => void,
    isRecording: boolean
}> = ({ onCommand, onMediaAction, isRecording }) => {
  const handleMouseDown = (e: React.MouseEvent) => e.preventDefault();
  const [activePicker, setActivePicker] = useState<'none' | 'color' | 'size'>('none');
  const fontSizes = [{ name: 'Small', value: '2'}, { name: 'Medium', value: '4'}, { name: 'Large', value: '6'}];
  
  const togglePicker = (picker: 'color' | 'size') => setActivePicker(prev => prev === picker ? 'none' : picker);

  return (
    <div className="sticky top-0 z-20 mb-4" style={{backgroundColor: 'var(--bg-primary)'}}>
        <style>{`
          @keyframes picker-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-picker-in { animation: picker-in 0.2s ease-out forwards; }
        `}</style>
      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg border" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('bold')} className="btn btn-secondary btn-icon" title="Bold"><i className="fa-solid fa-bold"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('italic')} className="btn btn-secondary btn-icon" title="Italic"><i className="fa-solid fa-italic"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('underline')} className="btn btn-secondary btn-icon" title="Underline"><i className="fa-solid fa-underline"></i></button>
        <div className="w-px h-6 mx-1" style={{backgroundColor: 'var(--border-color)'}}></div>
        <button onMouseDown={handleMouseDown} onClick={() => togglePicker('size')} className={`btn btn-secondary btn-icon ${activePicker === 'size' ? 'bg-fuchsia-500/20' : ''}`} title="Font Size"><i className="fa-solid fa-text-height"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => togglePicker('color')} className={`btn btn-secondary btn-icon ${activePicker === 'color' ? 'bg-fuchsia-500/20' : ''}`} title="Text Color"><i className="fa-solid fa-palette"></i></button>
        <div className="w-px h-6 mx-1" style={{backgroundColor: 'var(--border-color)'}}></div>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('insertOrderedList')} className="btn btn-secondary btn-icon" title="Numbered List"><i className="fa-solid fa-list-ol"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('insertUnorderedList')} className="btn btn-secondary btn-icon" title="Bulleted List"><i className="fa-solid fa-list-ul"></i></button>
        <div className="w-px h-6 mx-1" style={{backgroundColor: 'var(--border-color)'}}></div>
        <button onMouseDown={handleMouseDown} onClick={() => onMediaAction('link')} className="btn btn-secondary btn-icon" title="Insert Link"><i className="fa-solid fa-link"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onMediaAction('image')} className="btn btn-secondary btn-icon" title="Insert Image"><i className="fa-solid fa-image"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onMediaAction('draw')} className="btn btn-secondary btn-icon" title="Add Drawing"><i className="fa-solid fa-pencil"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onMediaAction('audio')} className={`btn btn-secondary btn-icon ${isRecording ? 'bg-red-500/30 text-red-400 animate-pulse' : ''}`} title="Record Audio"><i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i></button>
      </div>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activePicker !== 'none' ? 'max-h-40 mt-2' : 'max-h-0'}`}>
         <div className="p-3 rounded-lg" style={{backgroundColor: 'var(--bg-tertiary)'}}>
            {activePicker === 'size' && <div className="flex justify-around animate-picker-in">{fontSizes.map(size => <button key={size.value} onMouseDown={handleMouseDown} onClick={() => { onCommand('fontSize', size.value); togglePicker('size'); }} className="btn btn-secondary px-4 py-2">{size.name}</button>)}</div>}
            {activePicker === 'color' && <div className="grid grid-cols-7 gap-2 animate-picker-in">{COLORS.map(c => <button key={c} onMouseDown={handleMouseDown} onClick={() => { onCommand('foreColor', c); togglePicker('color'); }} className="w-7 h-7 rounded-full transform transition-transform hover:scale-110" style={{backgroundColor: c}}></button>)}</div>}
         </div>
      </div>
    </div>
  );
};

const LinkModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (url: string, text: string) => void, initialText: string }> = ({ isOpen, onClose, onSave, initialText }) => {
    const [url, setUrl] = useState('https://');
    const [text, setText] = useState('');
    useEffect(() => { if (isOpen) setText(initialText); }, [isOpen, initialText]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(url, text); onClose(); };
    return <Modal isOpen={isOpen} onClose={onClose} title="Insert Link"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>URL</label><input type="url" value={url} onChange={e => setUrl(e.target.value)} className="form-input" required autoFocus /></div><div><label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Text to display</label><input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Leave empty to use URL" className="form-input" /></div><button type="submit" className="w-full btn btn-primary">Insert</button></form></Modal>;
};

const DrawingModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (dataUrl: string) => void }> = ({ isOpen, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [penColor, setPenColor] = useState('#FFFFFF');
    const [penSize, setPenSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!isDrawing || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in e ? e.touches[0] : e;
        const x = pos.clientX - rect.left;
        const y = pos.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPos.current = { x, y };
    }, [isDrawing]);
    // FIX: Changed event type from native MouseEvent | TouchEvent to React's synthetic event types to fix compatibility issues with React event handlers (onMouseDown, onTouchStart).
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const pos = 'touches' in e ? e.touches[0] : e;
        setIsDrawing(true);
        lastPos.current = { x: pos.clientX - rect.left, y: pos.clientY - rect.top };
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };
    const stopDrawing = () => setIsDrawing(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('touchmove', draw);
        return () => {
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('touchmove', draw);
        };
    }, [draw]);
    const handleSave = () => { if(canvasRef.current) onSave(canvasRef.current.toDataURL('image/png')); onClose(); };
    const clearCanvas = () => { const canvas = canvasRef.current; if(!canvas) return; const ctx = canvas.getContext('2d'); if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); };
    return <Modal isOpen={isOpen} onClose={onClose} title="Drawing Pad"><div className="space-y-3"><canvas ref={canvasRef} width="300" height="300" onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchEnd={stopDrawing} className="rounded-lg w-full" style={{backgroundColor: 'var(--bg-primary)', touchAction: 'none'}}></canvas><div className="flex items-center gap-2"><label className="text-sm">Color:</label><div className="flex gap-1.5">{['#FFFFFF', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#d946ef'].map(c => <button key={c} onClick={() => setPenColor(c)} className={`w-6 h-6 rounded-full ${penColor === c ? 'ring-2 ring-offset-2 ring-[var(--accent-secondary)]' : ''}`} style={{backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)'} as React.CSSProperties}></button>)}</div></div><div className="flex items-center gap-2"><label className="text-sm">Size:</label><input type="range" min="1" max="20" value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="flex-grow" /></div><div className="flex gap-2"><button onClick={clearCanvas} className="btn btn-secondary flex-grow">Clear</button><button onClick={handleSave} className="btn btn-primary flex-grow">Save Drawing</button></div></div></Modal>
};

// --- Note Editor View ---
interface NoteEditorProps {
  noteToEdit: TNote | null;
  activeFolderId: string;
  onSave: (note: Partial<TNote>) => void;
  onCancel: () => void;
  onDelete: (noteId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteToEdit, activeFolderId, onSave, onCancel, onDelete }) => {
  const { folders, tags, setTags, setFolders } = useAppContext();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteFolderId, setNoteFolderId] = useState('');
  const [noteTagIds, setNoteTagIds] = useState<string[]>([]);
  
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isManageFoldersOpen, setIsManageFoldersOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  
  const [newTagName, setNewTagName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  
  const initialData = useRef({ title, content, noteFolderId, noteTagIds });
  const hasChanges = JSON.stringify({ title, content, noteFolderId, noteTagIds }) !== JSON.stringify(initialData.current);
  
  useUnsavedChangesWarning(hasChanges);

  useEffect(() => {
    const data = {
      title: noteToEdit?.title || '',
      content: noteToEdit?.content || '',
      noteFolderId: noteToEdit?.folderId || activeFolderId,
      noteTagIds: noteToEdit?.tagIds || [],
    };
    setTitle(data.title);
    setContent(data.content);
    setNoteFolderId(data.noteFolderId);
    setNoteTagIds(data.noteTagIds);
    initialData.current = data;
    if (contentRef.current && contentRef.current.innerHTML !== data.content) {
        contentRef.current.innerHTML = data.content;
    }
  }, [noteToEdit, activeFolderId]);
  
  const restoreSelection = () => {
      if (selectionRef.current) {
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(selectionRef.current);
      }
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    setContent(contentRef.current?.innerHTML || '');
  };

  const handleMediaAction = async (action: 'link' | 'image' | 'audio' | 'draw') => {
      selectionRef.current = window.getSelection()?.getRangeAt(0).cloneRange() || null;
      switch (action) {
          case 'link': setIsLinkModalOpen(true); break;
          case 'image': imageInputRef.current?.click(); break;
          case 'draw': setIsDrawingModalOpen(true); break;
          case 'audio': await handleAudioRecord(); break;
      }
  };
  
  const handleLinkSave = (url: string, text: string) => {
    restoreSelection();
    const linkText = text.trim() || url;
    handleCommand('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          restoreSelection();
          handleCommand('insertImage', event.target?.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset for same file upload
  };
  
  const handleDrawingSave = (dataUrl: string) => {
      restoreSelection();
      handleCommand('insertImage', dataUrl);
  };
  
  const handleAudioRecord = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          return;
      }
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];
          recorder.ondataavailable = event => audioChunksRef.current.push(event.data);
          recorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              restoreSelection();
              handleCommand('insertHTML', `<audio controls src="${audioUrl}"></audio>`);
              stream.getTracks().forEach(track => track.stop()); // Stop mic access
              setIsRecording(false);
          };
          recorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Microphone access denied:", err);
          alert("Microphone access is required for voice notes.");
      }
  };

  const handleSave = () => {
    const noteData: Partial<TNote> = {
      id: noteToEdit?.id,
      title: title.trim() || 'Untitled Note',
      content: contentRef.current?.innerHTML || '',
      folderId: noteFolderId,
      tagIds: noteTagIds,
    };
    onSave(noteData);
  };
  
  const handleCancelAttempt = () => hasChanges ? setShowConfirmCancel(true) : onCancel();
  const handleCreateTag = () => { if (newTagName.trim()) { setTags(prev => [...prev, { id: Date.now().toString(), name: newTagName.trim() }]); setNewTagName(''); } };
  const handleCreateFolder = () => { if (newFolderName.trim()) { const newFolder = { id: Date.now().toString(), name: newFolderName.trim() }; setFolders(prev => [...prev, newFolder]); setNoteFolderId(newFolder.id); setNewFolderName(''); }};

  return (
    <div className="fixed inset-0 z-40 flex flex-col h-full animate-view-in" style={{backgroundColor: 'var(--bg-primary)'}}>
        <style>{`
            .editor-content :is(ul, ol) { margin-left: 1.5rem; padding-left: 0.5rem; } .editor-content ul { list-style-type: disc; } .editor-content ol { list-style-type: decimal; }
            .editor-content a { color: var(--accent-primary); text-decoration: underline; }
            .editor-content > *:not(div) { margin-bottom: 0.75rem; }
            .editor-content :is(img, video, iframe, audio) { max-width: 100%; border-radius: 0.5rem; display: block; margin: 0.5rem 0; }
        `}</style>
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--border-color)'}}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('notes.titlePlaceholder')} className="w-full bg-transparent text-2xl font-bold focus:outline-none" style={{color: 'var(--text-primary)'}}/>
            <button onClick={handleCancelAttempt} className="btn btn-secondary btn-icon text-lg flex-shrink-0 ml-4">&times;</button>
        </header>
        <main className="flex-grow overflow-y-auto px-4 flex flex-col"><EditBar onCommand={handleCommand} onMediaAction={handleMediaAction} isRecording={isRecording} /><div ref={contentRef} contentEditable onInput={e => setContent((e.target as HTMLDivElement).innerHTML)} className="editor-content focus:outline-none w-full flex-grow"/></main>
        <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        <footer className="flex-shrink-0 p-4 border-t space-y-3" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)'}}>
            <div className="flex items-center gap-3">
                <i className="fa-solid fa-folder-open w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow"><CustomSelect options={folders.map(f => ({value: f.id, label: f.name}))} value={noteFolderId} onChange={setNoteFolderId}/></div>
                <button onClick={() => setIsManageFoldersOpen(true)} className="btn btn-secondary btn-icon text-xs flex-shrink-0"><i className="fa-solid fa-gear"></i></button>
            </div>
            <div className="flex items-center gap-3">
                <i className="fa-solid fa-tags w-6 text-center text-lg" style={{color: 'var(--text-secondary)'}}></i>
                <div className="flex-grow"><MultiSelectDropdown options={tags.map(t => ({value: t.id, label: t.name}))} selectedValues={noteTagIds} onChange={setNoteTagIds} placeholder="Select tags..."/></div>
                <button onClick={() => setIsManageTagsOpen(true)} className="btn btn-secondary btn-icon text-xs flex-shrink-0"><i className="fa-solid fa-gear"></i></button>
            </div>
            <div className="flex gap-2 pt-2">{noteToEdit && <button onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label={t('notes.delete')}><i className="fa-solid fa-trash"></i></button>}<button onClick={handleSave} disabled={!hasChanges} className="flex-grow btn btn-primary"><i className="fa-solid fa-check text-lg"></i></button></div>
        </footer>
        <Modal isOpen={showConfirmCancel} onClose={() => setShowConfirmCancel(false)} title="Unsaved Changes"><p className="mb-4 text-center" style={{color: 'var(--text-secondary)'}}>Discard changes?</p><div className="pt-2"><button onClick={onCancel} className="w-full btn btn-danger">Discard</button></div></Modal>
        <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Are you sure?"><p className="mb-4 text-center" style={{color: 'var(--text-secondary)'}}>Permanently delete this note?</p><div className="pt-2"><button onClick={() => { if (noteToEdit) onDelete(noteToEdit.id); }} className="w-full btn btn-danger">Yes</button></div></Modal>
        <Modal isOpen={isManageTagsOpen} onClose={() => setIsManageTagsOpen(false)} title="Manage Tags"><form onSubmit={(e) => { e.preventDefault(); handleCreateTag(); }} className="flex gap-2"><input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="New tag name..." className="form-input flex-grow" /><button type="submit" className="btn btn-primary btn-icon flex-shrink-0"><i className="fa-solid fa-plus"></i></button></form></Modal>
        <Modal isOpen={isManageFoldersOpen} onClose={() => setIsManageFoldersOpen(false)} title="Manage Folders"><form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="flex gap-2"><input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name..." className="form-input flex-grow" /><button type="submit" className="btn btn-primary btn-icon flex-shrink-0"><i className="fa-solid fa-plus"></i></button></form></Modal>
        <LinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onSave={handleLinkSave} initialText={selectionRef.current?.toString() || ''} />
        <DrawingModal isOpen={isDrawingModalOpen} onClose={() => setIsDrawingModalOpen(false)} onSave={handleDrawingSave} />
    </div>
  );
};

// --- Main Notes Page ---
function NotesPage() {
  const { notes, setNotes, folders, tags, setTags, activeAction, setActiveAction } = useAppContext();
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [selectedNote, setSelectedNote] = useState<TNote | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('uncategorized');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (view === 'editor') return;
    const allUsedTagIds = new Set(notes.flatMap(note => note.tagIds));
    const tagsInUse = tags.filter(tag => allUsedTagIds.has(tag.id));
    if (tagsInUse.length !== tags.length) setTags(tagsInUse);
  }, [notes, tags, setTags, view]);

  useEffect(() => {
    if (activeAction === 'notes') {
      setSelectedNote(null);
      setView('editor');
      setActiveAction(null);
    }
  }, [activeAction, setActiveAction]);

  const notesForFolder = useMemo(() => {
    const sorted = [...notes].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (selectedFolderId === 'all') return sorted;
    return sorted.filter(n => n.folderId === selectedFolderId);
  }, [notes, selectedFolderId]);

  const availableTags = useMemo(() => {
    const tagIdsInNotes = new Set<string>();
    notesForFolder.forEach(note => note.tagIds.forEach(tagId => tagIdsInNotes.add(tagId)));
    return tags.filter(tag => tagIdsInNotes.has(tag.id));
  }, [notesForFolder, tags]);

  const filteredNotes = useMemo(() => {
    if (selectedTagIds.length === 0) return notesForFolder;
    return notesForFolder.filter(note => selectedTagIds.every(tagId => note.tagIds.includes(tagId)));
  }, [notesForFolder, selectedTagIds]);

  const handleSaveNote = (noteData: Partial<TNote>) => {
    if (noteData.id) {
      setNotes(prev => prev.map(n => n.id === noteData.id ? { ...n, ...noteData, updatedAt: new Date().toISOString() } as TNote : n));
    } else {
      const newNote: TNote = { title: 'Untitled Note', content: '', tagIds: [], ...noteData, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as TNote;
      setNotes(prev => [newNote, ...prev]);
    }
    setView('list');
    setSelectedNote(null);
  };
  
  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setView('list');
    setSelectedNote(null);
  };

  const folderOptions = [{ value: 'all', label: 'All Notes', className: 'text-lg font-bold py-1' }, ...folders.map(f => ({ value: f.id, label: f.name }))];
  const tagOptions = availableTags.map(tag => ({ value: tag.id, label: tag.name }));

  if (view === 'editor') return <NoteEditor noteToEdit={selectedNote} activeFolderId={selectedFolderId === 'all' ? 'uncategorized' : selectedFolderId} onSave={handleSaveNote} onCancel={() => { setView('list'); setSelectedNote(null); }} onDelete={handleDeleteNote} />;

  return (
    <div>
      <Header titleKey="header.notes" />
      <div className="p-4 space-y-4">
        <div className="space-y-4">
            <CustomSelect options={folderOptions} value={selectedFolderId} onChange={setSelectedFolderId} />
            {availableTags.length > 0 && <MultiSelectDropdown options={tagOptions} selectedValues={selectedTagIds} onChange={setSelectedTagIds} placeholder={t('notes.filterTags')} />}
        </div>
        {filteredNotes.length === 0 ? (
          <div className="text-center py-10 rounded-lg mt-4 flex justify-center items-center h-40" style={{backgroundColor: 'var(--bg-secondary)'}}><i className="fa-solid fa-book-open text-5xl" style={{color: 'var(--text-tertiary)'}}></i></div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map(note => {
              const folder = folders.find(f => f.id === note.folderId);
              return (
                <button key={note.id} onClick={() => { setSelectedNote(note); setView('editor'); }} className="w-full text-left flex gap-3 p-3 rounded-lg transition-all duration-150 hover:bg-[var(--bg-tertiary)] active:scale-[0.99]" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-bold truncate">{note.title}</h3>
                    <p className="text-sm truncate mt-1" style={{color: 'var(--text-secondary)'}}>{stripHtml(note.content)}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5" style={{backgroundColor: 'var(--bg-quaternary)', color: 'var(--text-secondary)'}}><i className="fa-solid fa-folder"></i>{folder?.name || 'Uncategorized'}</span>
                        <div className="flex flex-wrap gap-1">
                          {note.tagIds.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean).map(tag => <span key={tag!.id} className="text-xs font-medium px-2 py-0.5 rounded-full" style={{backgroundColor: 'var(--bg-quaternary)', color: 'var(--text-secondary)'}}>{tag!.name}</span>)}
                        </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesPage;