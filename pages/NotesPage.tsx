import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext, useTranslation } from '../context/AppContext';
import { TNote, TTag, TCalendar, TCalendarCategory } from '../types';
import Header from '../components/Header';
import CustomSelect from '../components/CustomSelect';
import { COLORS } from '../constants';
import Modal from '../components/Modal';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

// --- Helper Functions ---
const stripHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
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

// --- Editor Toolbar Component ---
const EditBar: React.FC<{ onCommand: (cmd: string, val?: string) => void }> = ({ onCommand }) => {
  const handleMouseDown = (e: React.MouseEvent) => e.preventDefault();
  const [activePicker, setActivePicker] = useState<'none' | 'color' | 'size'>('none');

  const fontSizes = [{ name: 'Small', value: '2'}, { name: 'Medium', value: '4'}, { name: 'Large', value: '6'}];
  
  const togglePicker = (picker: 'color' | 'size') => {
    setActivePicker(prev => prev === picker ? 'none' : picker);
  };

  return (
    <div className="sticky top-0 z-20 mb-4" style={{backgroundColor: 'var(--bg-primary)'}}>
        <style>{`
          @keyframes picker-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-picker-in { animation: picker-in 0.2s ease-out forwards; }
        `}</style>

      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg border" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('bold')} className="btn btn-secondary btn-icon" title="Bold"><i className="fa-solid fa-bold"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('italic')} className="btn btn-secondary btn-icon" title="Italic"><i className="fa-solid fa-italic"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('underline')} className="btn btn-secondary btn-icon" title="Underline"><i className="fa-solid fa-underline"></i></button>
        <div className="w-px h-6 mx-1" style={{backgroundColor: 'var(--border-color)'}}></div>
        
        <button onMouseDown={handleMouseDown} onClick={() => togglePicker('size')} className={`btn btn-secondary btn-icon transition-colors ${activePicker === 'size' ? 'bg-fuchsia-500/20' : ''}`} title="Font Size"><i className="fa-solid fa-text-height"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => togglePicker('color')} className={`btn btn-secondary btn-icon transition-colors ${activePicker === 'color' ? 'bg-fuchsia-500/20' : ''}`} title="Text Color"><i className="fa-solid fa-palette"></i></button>

        <div className="w-px h-6 mx-1" style={{backgroundColor: 'var(--border-color)'}}></div>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('insertOrderedList')} className="btn btn-secondary btn-icon" title="Numbered List"><i className="fa-solid fa-list-ol"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('insertUnorderedList')} className="btn btn-secondary btn-icon" title="Bulleted List"><i className="fa-solid fa-list-ul"></i></button>
        <button onMouseDown={handleMouseDown} onClick={() => onCommand('createLink')} className="btn btn-secondary btn-icon" title="Insert Link"><i className="fa-solid fa-link"></i></button>
      </div>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activePicker !== 'none' ? 'max-h-40 mt-2' : 'max-h-0'}`}>
         <div className="p-3 rounded-lg" style={{backgroundColor: 'var(--bg-tertiary)'}}>
            {activePicker === 'size' && (
               <div className="flex justify-around animate-picker-in">
                 {fontSizes.map(size => 
                     <button
                         key={size.value} 
                         onMouseDown={handleMouseDown} 
                         onClick={() => { onCommand('fontSize', size.value); togglePicker('size'); }} 
                         className="btn btn-secondary px-4 py-2"
                     >
                         {size.name}
                     </button>
                 )}
               </div>
            )}
            {activePicker === 'color' && (
                <div className="grid grid-cols-7 gap-2 animate-picker-in">
                  {COLORS.map(c => <button key={c} onMouseDown={handleMouseDown} onClick={() => { onCommand('foreColor', c); togglePicker('color'); }} className="w-7 h-7 rounded-full transform transition-transform hover:scale-110" style={{backgroundColor: c}}></button>)}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

// --- Note Editor View Component ---
interface NoteEditorProps {
  noteToEdit: TNote | null;
  activeCalendarId: string;
  onSave: (note: Partial<TNote>) => void;
  onCancel: () => void;
  onDelete: (noteId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteToEdit, activeCalendarId, onSave, onCancel, onDelete }) => {
  const { calendars, tags, setTags, calendarCategories, calendarOrder, calendarCategoryOrder } = useAppContext();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteCalendarId, setNoteCalendarId] = useState('');
  const [noteTagIds, setNoteTagIds] = useState<string[]>([]);
  
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  
  const initialData = useRef({ title, content, noteCalendarId, noteTagIds });
  const hasChanges = JSON.stringify({ title, content, noteCalendarId, noteTagIds }) !== JSON.stringify(initialData.current);
  
  useUnsavedChangesWarning(hasChanges);

  useEffect(() => {
    const data = {
      title: noteToEdit?.title || '',
      content: noteToEdit?.content || '',
      noteCalendarId: noteToEdit?.calendarId || activeCalendarId,
      noteTagIds: noteToEdit?.tagIds || [],
    };
    setTitle(data.title);
    setContent(data.content);
    setNoteCalendarId(data.noteCalendarId);
    setNoteTagIds(data.noteTagIds);
    initialData.current = data;
    if (contentRef.current && contentRef.current.innerHTML !== data.content) {
        contentRef.current.innerHTML = data.content;
    }
  }, [noteToEdit, activeCalendarId]);

  const handleCommand = (command: string, value?: string) => {
    if (command === 'createLink') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
            alert('Please select some text to create a link.');
            contentRef.current?.focus();
            return;
        }
        const savedRangeForLink = selection.getRangeAt(0).cloneRange();
        const url = prompt('Enter URL:', 'https://');
        
        if (url) {
            const currentSelection = window.getSelection();
            if (currentSelection) {
                currentSelection.removeAllRanges();
                currentSelection.addRange(savedRangeForLink);
            }
            document.execCommand('createLink', false, url);
        }
    } else {
        document.execCommand(command, false, value);
    }
    contentRef.current?.focus();
    setContent(contentRef.current?.innerHTML || '');
  };

  const handleSave = () => {
    const noteData: Partial<TNote> = {
      id: noteToEdit?.id,
      title: title.trim() || 'Untitled Note',
      content: contentRef.current?.innerHTML || '',
      calendarId: noteCalendarId,
      tagIds: noteTagIds,
    };
    onSave(noteData);
  };
  
  const handleCancelAttempt = () => {
    if (hasChanges) {
      setShowConfirmCancel(true);
    } else {
      onCancel();
    }
  };

  const handleCreateTag = () => {
    const tagName = newTagName.trim();
    if (tagName) {
      const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (existingTag) {
        setNoteTagIds(prev => prev.includes(existingTag.id) ? prev : [...prev, existingTag.id]);
      } else {
        const newTag: TTag = { id: Date.now().toString(), name: tagName };
        setTags(prev => [...prev, newTag]);
        setNoteTagIds(prev => [...prev, newTag.id]);
      }
    }
    setNewTagName('');
  };
  
  const handleAddExistingTag = (tagId: string) => {
      if (!noteTagIds.includes(tagId)) {
          setNoteTagIds(prev => [...prev, tagId]);
      }
  };

  const folderOptions = useMemo(() => {
    const options: any[] = [];
    const userCalendars = calendars.filter(c => c.id !== 'overview');
    
    const sortedCalendars = calendarOrder
        .map(id => userCalendars.find(c => c.id === id))
        .filter((c): c is TCalendar => !!c);
    
    const categorized = new Map<string, TCalendar[]>();
    const uncategorized: TCalendar[] = [];

    sortedCalendars.forEach(cal => {
        if (cal.categoryId && calendarCategories.find(cat => cat.id === cal.categoryId)) {
            if (!categorized.has(cal.categoryId)) {
                categorized.set(cal.categoryId, []);
            }
            categorized.get(cal.categoryId)!.push(cal);
        } else {
            uncategorized.push(cal);
        }
    });
    
    uncategorized.forEach(cal => options.push({ value: cal.id, label: cal.name }));
    
    if (uncategorized.length > 0 && categorized.size > 0) {
        options.push({ isHeader: true, label: ' ' }); 
    }

    calendarCategoryOrder.forEach(catId => {
        const cat = calendarCategories.find(c => c.id === catId);
        if (cat) {
            const cals = categorized.get(cat.id);
            if (cals && cals.length > 0) {
                options.push({ isHeader: true, label: cat.name });
                cals.forEach(cal => options.push({ value: cal.id, label: cal.name }));
            }
        }
    });

    return options;
  }, [calendars, calendarOrder, calendarCategories, calendarCategoryOrder]);

  const availableTagsToAdd = tags.filter(tag => !noteTagIds.includes(tag.id));

  return (
    <div className="flex flex-col h-full animate-view-in" style={{backgroundColor: 'var(--bg-primary)'}}>
        <style>{`
            .editor-content ul { list-style-type: disc; margin-left: 1.5rem; padding-left: 0.5rem; }
            .editor-content ol { list-style-type: decimal; margin-left: 1.5rem; padding-left: 0.5rem; }
            .editor-content a { color: var(--accent-primary); text-decoration: underline; }
            .editor-content > * { margin-bottom: 0.75rem; }
        `}</style>
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--border-color)'}}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('notes.titlePlaceholder')} className="w-full bg-transparent text-2xl font-bold focus:outline-none" style={{color: 'var(--text-primary)'}}/>
            <button onClick={handleCancelAttempt} className="btn btn-secondary btn-icon text-lg flex-shrink-0 ml-4">&times;</button>
        </header>

        <main className="flex-grow overflow-y-auto px-4">
            <EditBar onCommand={handleCommand} />
            <div
                ref={contentRef}
                contentEditable
                onInput={e => setContent((e.target as HTMLDivElement).innerHTML)}
                className="editor-content focus:outline-none min-h-[50vh] w-full"
            />
        </main>
        
        <footer className="flex-shrink-0 p-4 border-t space-y-3" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)'}}>
            <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Folder</label>
                <CustomSelect options={folderOptions} value={noteCalendarId} onChange={setNoteCalendarId}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Tags</label>
              <div className="flex items-center gap-2">
                  <div className="flex-grow flex flex-wrap gap-1 p-2 rounded-md min-h-[38px]" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                    {noteTagIds.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? <button key={tag.id} onClick={() => setNoteTagIds(noteTagIds.filter(id => id !== tagId))} className="bg-fuchsia-500/20 text-fuchsia-300 text-xs font-semibold px-2 py-0.5 rounded-full hover:bg-fuchsia-500/40" style={{backgroundColor: 'var(--accent-primary)', color: 'var(--accent-text)', opacity: 0.8}}>&times; {tag.name}</button> : null;
                    })}
                  </div>
                  <button onClick={() => setIsManageTagsModalOpen(true)} className="btn btn-secondary btn-icon text-xs flex-shrink-0"><i className="fa-solid fa-plus"></i></button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
                {noteToEdit && <button onClick={() => setShowConfirmDelete(true)} className="btn btn-danger">{t('notes.delete')}</button>}
                <button onClick={handleSave} disabled={!hasChanges} className="flex-grow btn btn-primary">{t('notes.save')}</button>
            </div>
        </footer>

        <Modal isOpen={showConfirmCancel} onClose={() => setShowConfirmCancel(false)} title="Unsaved Changes">
            <div className="text-center">
                <p className="mb-4" style={{color: 'var(--text-secondary)'}}>You have unsaved changes. Are you sure you want to discard them?</p>
                <div className="flex gap-2">
                    <button onClick={() => setShowConfirmCancel(false)} className="flex-1 btn btn-secondary">Keep Editing</button>
                    <button onClick={onCancel} className="flex-1 btn btn-danger">Discard</button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Confirm Deletion">
            <div className="text-center">
                <p className="mb-4" style={{color: 'var(--text-secondary)'}}>Are you sure you want to permanently delete this note?</p>
                <div className="flex gap-2">
                    <button onClick={() => setShowConfirmDelete(false)} className="flex-1 btn btn-secondary">{t('common.cancel')}</button>
                    <button 
                        onClick={() => { if (noteToEdit) onDelete(noteToEdit.id); }} 
                        className="flex-1 btn btn-danger"
                    >
                        {t('common.delete')}
                    </button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={isManageTagsModalOpen} onClose={() => setIsManageTagsModalOpen(false)} title="Manage Tags">
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTag(); }} className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-secondary)'}}>Create new tag</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newTagName} 
                        onChange={e => setNewTagName(e.target.value)} 
                        placeholder="Tag name..." 
                        className="form-input flex-grow" 
                    />
                    <button type="submit" className="btn btn-primary flex-shrink-0">{t('common.create')}</button>
                </div>
            </form>

            <div className="w-full h-px my-4" style={{backgroundColor: 'var(--border-color)'}}></div>

            <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--text-secondary)'}}>Add existing tag</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {availableTagsToAdd.length > 0 ? availableTagsToAdd.map(tag => (
                        <button 
                            key={tag.id} 
                            type="button"
                            onClick={() => handleAddExistingTag(tag.id)}
                            className="text-xs font-semibold px-2 py-1 rounded-full hover:bg-slate-700 transition-colors"
                             style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)'}}
                        >
                            + {tag.name}
                        </button>
                    )) : (
                        <p className="text-sm" style={{color: 'var(--text-tertiary)'}}>All tags have been added.</p>
                    )}
                </div>
            </div>
        </Modal>
    </div>
  );
};

// --- Main Notes Page Component ---
function NotesPage() {
  const { notes, setNotes, calendars, tags, setTags, activeAction, setActiveAction } = useAppContext();
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [selectedNote, setSelectedNote] = useState<TNote | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState('overview');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    // This effect cleans up any tags that are no longer used by any note.
    // It's suspended when the editor is open to prevent deleting newly created tags before a note is saved.
    if (view === 'editor') {
      return;
    }

    const allUsedTagIds = new Set(notes.flatMap(note => note.tagIds));
    const tagsInUse = tags.filter(tag => allUsedTagIds.has(tag.id));
    
    // Only update state if there's a difference to avoid infinite loops
    if (tagsInUse.length !== tags.length) {
      setTags(tagsInUse);
    }
  }, [notes, tags, setTags, view]);

  useEffect(() => {
    if (activeAction === 'notes') {
      if (selectedCalendarId === 'overview') {
        const firstUserCalendar = calendars.find(c => c.id !== 'overview');
        if (firstUserCalendar) {
            setSelectedCalendarId(firstUserCalendar.id);
        }
      }
      setSelectedNote(null);
      setView('editor');
      setActiveAction(null);
    }
  }, [activeAction, setActiveAction, selectedCalendarId, calendars]);

  const notesForCalendar = useMemo(() => {
    const sorted = [...notes].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (selectedCalendarId === 'overview') return sorted;
    return sorted.filter(n => n.calendarId === selectedCalendarId);
  }, [notes, selectedCalendarId]);

  const availableTags = useMemo(() => {
    const tagIdsInNotes = new Set<string>();
    notesForCalendar.forEach(note => note.tagIds.forEach(tagId => tagIdsInNotes.add(tagId)));
    return tags.filter(tag => tagIdsInNotes.has(tag.id));
  }, [notesForCalendar, tags]);

  const filteredNotes = useMemo(() => {
    if (selectedTagIds.length === 0) return notesForCalendar;
    return notesForCalendar.filter(note => 
        selectedTagIds.some(tagId => note.tagIds.includes(tagId))
    );
  }, [notesForCalendar, selectedTagIds]);

  const handleSaveNote = (noteData: Partial<TNote>) => {
    if (noteData.id) { // Editing
      setNotes(prev => prev.map(n => n.id === noteData.id ? { ...n, ...noteData, updatedAt: new Date().toISOString() } as TNote : n));
    } else { // Adding
      const newNote: TNote = {
        title: 'Untitled Note',
        content: '',
        tagIds: [],
        ...noteData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as TNote;
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

  const calendarOptions = calendars.map(cal => ({ value: cal.id, label: cal.name }));
  const tagOptions = availableTags.map(tag => ({ value: tag.id, label: tag.name }));

  if (view === 'editor') {
    return <NoteEditor 
              noteToEdit={selectedNote} 
              activeCalendarId={selectedCalendarId === 'overview' ? (calendars.find(c => c.id !== 'overview')?.id || '') : selectedCalendarId}
              onSave={handleSaveNote} 
              onCancel={() => { setView('list'); setSelectedNote(null); }}
              onDelete={handleDeleteNote}
           />;
  }

  return (
    <div>
      <Header titleKey="header.notes" />
      <div className="p-4 space-y-4">
        <div className="space-y-4">
            <CustomSelect options={calendarOptions} value={selectedCalendarId} onChange={setSelectedCalendarId} />
            {availableTags.length > 0 && (
                <MultiSelectDropdown 
                    options={tagOptions}
                    selectedValues={selectedTagIds}
                    onChange={setSelectedTagIds}
                    placeholder={t('notes.filterTags')}
                />
            )}
        </div>
        
        {selectedCalendarId !== 'overview' && (
          <div className="text-center">
              <button onClick={() => { setSelectedNote(null); setView('editor'); }} className="btn btn-primary w-full">
                  <i className="fa-solid fa-plus mr-2"></i>
                  {t('notes.add')}
              </button>
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="text-center py-10 rounded-lg mt-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
            <i className="fa-solid fa-book-open text-4xl mb-3" style={{color: 'var(--text-tertiary)'}}></i>
            <p style={{color: 'var(--text-secondary)'}}>No notes found. Create one!</p>
          </div>
        )}
        
        <div className="space-y-3">
          {filteredNotes.map(note => {
            const cal = calendars.find(c => c.id === note.calendarId);
            return (
              <button key={note.id} onClick={() => { setSelectedNote(note); setView('editor'); }} className="w-full text-left flex gap-3 p-3 rounded-lg transition-all duration-150 hover:bg-slate-800/80 active:scale-[0.99]" style={{backgroundColor: 'var(--bg-secondary)'}}>
                <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{ backgroundColor: cal?.color || '#fff' }}></div>
                <div className="flex-grow overflow-hidden">
                  <h3 className="font-bold truncate">{note.title}</h3>
                  <p className="text-sm truncate mt-1" style={{color: 'var(--text-secondary)'}}>{stripHtml(note.content)}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tagIds.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? <span key={tag.id} className="text-xs font-medium px-2 py-0.5 rounded-full" style={{backgroundColor: 'var(--bg-quaternary)', color: 'var(--text-secondary)'}}>{tag.name}</span> : null;
                    })}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default NotesPage;
