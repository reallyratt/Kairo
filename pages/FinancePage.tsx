import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { TTransaction, TransactionType, TFinanceCategory, TWallet } from '../types';
import Modal from '../components/Modal';
import Header from '../components/Header';
import { toYYYYMMDD, dateFromYYYYMMDD } from '../utils';
import CustomSelect from '../components/CustomSelect';
import { COLORS } from '../constants';

const LABEL_STYLE = "block text-sm font-medium text-slate-400 mb-1";
type FilterType = 'day' | 'week' | 'month' | 'year' | 'all' | 'range';
const WALLET_ICONS = ['fa-wallet', 'fa-credit-card', 'fa-building-columns', 'fa-piggy-bank', 'fa-sack-dollar', 'fa-landmark'];


const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// --- Transaction Form Modal ---
const TransactionFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Partial<TTransaction>) => void;
    onDelete?: (id: string) => void;
    initialData?: Partial<TTransaction>;
    walletId: string;
}> = ({ isOpen, onClose, onSave, onDelete, initialData, walletId }) => {
    const { financeCategories } = useAppContext();
    const [formData, setFormData] = useState<Partial<TTransaction>>({});
    const isEditing = !!initialData?.id;
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // New state for combobox
    const [categoryInput, setCategoryInput] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryInputRef = useRef<HTMLDivElement>(null);
    
    const availableCategories = useMemo(() => {
        return financeCategories.filter(c => c.type === formData.type);
    }, [financeCategories, formData.type]);

    useEffect(() => {
        if (isOpen) {
            const currentType = initialData?.type || TransactionType.Expense;
            const categoriesForType = financeCategories.filter(c => c.type === currentType);
            const initialCategoryName = categoriesForType.find(c => c.id === initialData?.categoryId)?.name || '';

            setFormData({
                type: currentType,
                date: toYYYYMMDD(new Date()),
                ...initialData,
                categoryId: initialCategoryName, // Store category name
                walletId: initialData?.walletId || walletId,
            });
            setCategoryInput(initialCategoryName); // Set combobox input
            setShowConfirmDelete(false);
        }
    }, [isOpen, initialData, walletId, financeCategories]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryInputRef.current && !categoryInputRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        if (isCategoryDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCategoryDropdownOpen]);
    
    const handleChange = (field: keyof Omit<TTransaction, 'id'>, value: any) => {
        // When changing type, clear the category
        if (field === 'type' && value !== formData.type) {
            setCategoryInput('');
            setFormData(prev => ({ ...prev, categoryId: '', [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCategoryInput(value);
        handleChange('categoryId', value); // Update formData with name
        if (!isCategoryDropdownOpen) {
            setIsCategoryDropdownOpen(true);
        }
    };

    const handleCategorySelect = (categoryName: string) => {
        setCategoryInput(categoryName);
        handleChange('categoryId', categoryName); // Update formData with name
        setIsCategoryDropdownOpen(false);
    };

    const suggestedCategories = useMemo(() => {
        if (!categoryInput) return availableCategories;
        return availableCategories.filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()));
    }, [categoryInput, availableCategories]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.title || formData.amount === undefined || !formData.categoryId) return;
        onSave(formData);
    }
    
    const handleConfirmDelete = () => {
        if (onDelete && formData.id) {
            onDelete(formData.id);
        }
    };
    
    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Transaction" : "Add Transaction"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={LABEL_STYLE}>Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => handleChange('type', TransactionType.Expense)} className="py-2 rounded-md font-semibold transition-colors" style={{ backgroundColor: formData.type === TransactionType.Expense ? 'var(--danger-primary)' : 'var(--bg-tertiary)', color: formData.type === TransactionType.Expense ? 'var(--accent-text)' : 'var(--text-primary)'}}>Expense</button>
                            <button type="button" onClick={() => handleChange('type', TransactionType.Income)} className="py-2 rounded-md font-semibold transition-colors" style={{ backgroundColor: formData.type === TransactionType.Income ? 'var(--success-primary)' : 'var(--bg-tertiary)', color: formData.type === TransactionType.Income ? 'var(--accent-text)' : 'var(--text-primary)'}}>Income</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="title" className={LABEL_STYLE}>Title</label>
                        <input id="title" type="text" placeholder="e.g., Lunch with friends" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} className="form-input" required />
                    </div>
                     <div>
                        <label htmlFor="amount" className={LABEL_STYLE}>Amount (in Rupiah)</label>
                        <input
                            id="amount"
                            type="number"
                            placeholder="50000"
                            value={formData.amount ?? ''}
                            onChange={e => handleChange('amount', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            onBlur={e => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value < 0) {
                                    handleChange('amount', 0);
                                }
                            }}
                            className="form-input"
                            step="1"
                            min="0"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="description" className={LABEL_STYLE}>Description</label>
                        <textarea id="description" placeholder="(Optional)" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className="form-input h-20 resize-none"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className={LABEL_STYLE}>Category</label>
                             <div ref={categoryInputRef} className="relative">
                                <input
                                    id="category"
                                    type="text"
                                    placeholder="e.g., Food or select one"
                                    value={categoryInput}
                                    onChange={handleCategoryInputChange}
                                    onFocus={() => setIsCategoryDropdownOpen(true)}
                                    className="form-input"
                                    required
                                    autoComplete="off"
                                />
                                {isCategoryDropdownOpen && suggestedCategories.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-lg shadow-lg max-h-40 overflow-auto animate-dropdown-in" style={{backgroundColor: 'var(--bg-quaternary)'}}>
                                        <ul>
                                            {suggestedCategories.map(c => (
                                                <li
                                                    key={c.id}
                                                    className="px-4 py-2 cursor-pointer hover:bg-[var(--accent-primary)]/20"
                                                    style={{color: 'var(--text-primary)'}}
                                                    onMouseDown={(e) => { // Use onMouseDown to fire before input's onBlur
                                                        e.preventDefault();
                                                        handleCategorySelect(c.name);
                                                    }}
                                                >
                                                    {c.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="date" className={LABEL_STYLE}>Date</label>
                            <input id="date" type="date" value={formData.date || ''} onChange={e => handleChange('date', e.target.value)} className="form-input" required />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        {isEditing && onDelete && <button type="button" onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label="Delete"><i className="fa-solid fa-trash"></i></button>}
                        <button type="submit" className="flex-grow btn btn-primary">{isEditing ? <i className="fa-solid fa-check text-lg"></i> : 'Add Transaction'}</button>
                    </div>
                </form>
            </Modal>
             <Modal isOpen={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Are you sure?">
                <div className="text-center">
                    <p className="mb-4" style={{color: 'var(--text-secondary)'}}>Do you want to permanently delete this transaction?</p>
                    <div className="pt-2">
                        <button onClick={handleConfirmDelete} className="w-full btn btn-danger">Yes</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// --- Add Wallet Modal ---
const AddWalletModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, icon: string, color: string) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(WALLET_ICONS[0]);
    const [color, setColor] = useState(COLORS[0]);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setIcon(WALLET_ICONS[0]);
            setColor(COLORS[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(name, icon, color);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Wallet">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="walletName" className={LABEL_STYLE}>Wallet Name</label>
                    <input id="walletName" type="text" placeholder="e.g. Savings" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                </div>
                <div>
                    <label className={LABEL_STYLE}>Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                        {WALLET_ICONS.map(ic => (
                            <button type="button" key={ic} onClick={() => setIcon(ic)} className={`text-lg p-2 rounded-lg transition-colors ${icon === ic ? 'bg-[var(--accent-primary)]/30' : 'bg-[var(--bg-tertiary)]'}`} style={{color: icon === ic ? 'var(--accent-text)' : 'var(--text-primary)'}}><i className={`fa-solid ${ic}`}></i></button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className={LABEL_STYLE}>Color</label>
                    <div className="grid grid-cols-7 gap-2">
                        {COLORS.map(c => (
                            <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-[var(--accent-secondary)]' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full btn btn-primary">Add Wallet</button>
            </form>
        </Modal>
    );
};

// --- Manage Wallet Modal ---
const ManageWalletModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    wallet: TWallet;
    onUpdate: (id: string, name: string, icon: string, color: string) => void;
    onDelete: (id: string) => void;
}> = ({ isOpen, onClose, wallet, onUpdate, onDelete }) => {
    const [name, setName] = useState(wallet.name);
    const [icon, setIcon] = useState(wallet.icon);
    const [color, setColor] = useState(wallet.color);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(wallet.name);
            setIcon(wallet.icon);
            setColor(wallet.color);
            setShowConfirmDelete(false);
        }
    }, [wallet, isOpen]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(wallet.id, name, icon, color);
        onClose();
    };

    const handleDeleteConfirm = () => {
        onDelete(wallet.id);
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={showConfirmDelete ? "Are you sure?" : "Manage Wallet"}>
            {showConfirmDelete ? (
                <div className="text-center">
                    <p className="mb-4" style={{color: 'var(--text-secondary)'}}>Are you sure? This will delete the wallet and all its transactions.</p>
                    <div className="pt-2">
                        <button type="button" onClick={handleDeleteConfirm} className="w-full btn btn-danger">Yes</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                     <div>
                        <label htmlFor="walletNameEdit" className={LABEL_STYLE}>Wallet Name</label>
                        <input id="walletNameEdit" type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
                    </div>
                    <div>
                        <label className={LABEL_STYLE}>Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                            {WALLET_ICONS.map(ic => (
                                <button type="button" key={ic} onClick={() => setIcon(ic)} className={`text-lg p-2 rounded-lg transition-colors ${icon === ic ? 'bg-[var(--accent-primary)]/30' : 'bg-[var(--bg-tertiary)]'}`} style={{color: icon === ic ? 'var(--accent-text)' : 'var(--text-primary)'}}><i className={`fa-solid ${ic}`}></i></button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={LABEL_STYLE}>Color</label>
                        <div className="grid grid-cols-7 gap-2">
                            {COLORS.map(c => (
                                <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all transform hover:scale-110 active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-[var(--accent-secondary)]' : ''}`} style={{ backgroundColor: c, '--tw-ring-offset-color': 'var(--bg-secondary)' } as React.CSSProperties}></button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowConfirmDelete(true)} className="btn btn-danger btn-icon" aria-label="Delete"><i className="fa-solid fa-trash"></i></button>
                        <button type="submit" className="flex-grow btn btn-primary"><i className="fa-solid fa-check text-lg"></i></button>
                    </div>
                </form>
            )}
        </Modal>
    );
};


function FinancePage() {
    const { wallets, setWallets, transactions, setTransactions, financeCategories, setFinanceCategories, activeAction, setActiveAction } = useAppContext();
    const [selectedWalletId, setSelectedWalletId] = useState('overview');
    const [filterType, setFilterType] = useState<FilterType>('month');
    const [dateRange, setDateRange] = useState({ from: toYYYYMMDD(new Date()), to: toYYYYMMDD(new Date()) });
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TTransaction | null>(null);
    const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
    const [isManageWalletModalOpen, setIsManageWalletModalOpen] = useState(false);

    useEffect(() => {
        const usedCategoryIds = new Set(transactions.map(t => t.categoryId));
        const categoriesInUse = financeCategories.filter(c => usedCategoryIds.has(c.id));
        
        if (categoriesInUse.length !== financeCategories.length) {
            setFinanceCategories(categoriesInUse);
        }
    }, [transactions, financeCategories, setFinanceCategories]);

    useEffect(() => {
        if (activeAction === 'finance') {
          let targetWalletId = selectedWalletId;
          if (selectedWalletId === 'overview') {
            const firstWallet = wallets.find(w => w.id !== 'overview');
            if (firstWallet) {
              targetWalletId = firstWallet.id;
              setSelectedWalletId(firstWallet.id);
            } else {
              // Can't add transaction without a wallet
              setActiveAction(null);
              return;
            }
          }
          setEditingTransaction(null);
          setIsFormOpen(true);
          setActiveAction(null);
        }
      }, [activeAction, setActiveAction, selectedWalletId, wallets]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (filterType) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                const firstDayOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.setDate(firstDayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'range':
                startDate = dateFromYYYYMMDD(dateRange.from);
                endDate = dateFromYYYYMMDD(dateRange.to);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        return transactions
            .filter(t => selectedWalletId === 'overview' || t.walletId === selectedWalletId)
            .filter(t => {
                if (selectedCategoryId === 'all') return true;
                return t.categoryId === selectedCategoryId;
            })
            .filter(t => {
                if (!startDate || !endDate) return true;
                const tDate = dateFromYYYYMMDD(t.date);
                return tDate >= startDate && tDate <= endDate;
            })
            .sort((a, b) => dateFromYYYYMMDD(b.date).getTime() - dateFromYYYYMMDD(a.date).getTime());
    }, [transactions, selectedWalletId, filterType, dateRange, selectedCategoryId]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === TransactionType.Income) {
                acc.income += t.amount;
            } else {
                acc.expense += t.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const handleSaveTransaction = (data: Partial<TTransaction>) => {
        const categoryName = ((data.categoryId as unknown as string) || '').trim();
        if (!categoryName) return;

        let category = financeCategories.find(c => 
            c.name.toLowerCase() === categoryName.toLowerCase() && c.type === data.type
        );

        if (!category) {
            const newCategory: TFinanceCategory = {
                id: Date.now().toString(),
                name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                icon: 'fa-tag',
                type: data.type as TransactionType
            };
            setFinanceCategories(prev => [...prev, newCategory]);
            category = newCategory;
        }
        
        const transactionData = { ...data, categoryId: category.id };

        if (transactionData.id) { // Edit
            setTransactions(prev => prev.map(t => t.id === transactionData.id ? {...t, ...transactionData} as TTransaction : t));
        } else { // Add
            setTransactions(prev => [...prev, {...transactionData, id: Date.now().toString()} as TTransaction]);
        }
        setIsFormOpen(false);
        setEditingTransaction(null);
    }
    
    const handleDeleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setIsFormOpen(false);
        setEditingTransaction(null);
    }
    
    const handleAddWallet = (name: string, icon: string, color: string) => {
        const newWallet: TWallet = { id: Date.now().toString(), name, icon, color };
        setWallets(prev => [...prev, newWallet]);
        setIsAddWalletModalOpen(false);
    }

    const handleUpdateWallet = (id: string, name: string, icon: string, color: string) => {
        setWallets(prev => prev.map(w => w.id === id ? { ...w, name, icon, color } : w));
    }

    const handleDeleteWallet = (id: string) => {
        setTransactions(prev => prev.filter(t => t.walletId !== id));
        setWallets(prev => prev.filter(w => w.id !== id));
        if (selectedWalletId === id) {
            setSelectedWalletId('overview');
        }
    }

    const walletOptions = wallets.map(w => ({ value: w.id, label: w.name }));
    const filterOptions: {id: FilterType, label: string}[] = [
        {id: 'day', label: 'Day'}, {id: 'week', label: 'Week'}, {id: 'month', label: 'Month'},
        {id: 'year', label: 'Year'}, {id: 'all', label: 'All'}, {id: 'range', label: 'Range'}
    ];
    
    const categoryFilterOptions = useMemo(() => {
        const incomeCategories = financeCategories.filter(c => c.type === TransactionType.Income);
        const expenseCategories = financeCategories.filter(c => c.type === TransactionType.Expense);
        
        const options: ({ value: string; label: string; } | { isHeader: true; label: string; })[] = [{ value: 'all', label: 'All Categories' }];

        if (incomeCategories.length > 0) {
            options.push({ isHeader: true, label: 'Income' });
            incomeCategories.forEach(c => options.push({ value: c.id, label: c.name }));
        }

        if (expenseCategories.length > 0) {
            options.push({ isHeader: true, label: 'Expenses' });
            expenseCategories.forEach(c => options.push({ value: c.id, label: c.name }));
        }

        return options;
    }, [financeCategories]);

    const selectedWallet = wallets.find(w => w.id === selectedWalletId);

    return (
        <div>
            <Header titleKey="header.finance" />
            <div className="p-4 space-y-4">
                {/* Wallet Selector */}
                <div className="flex items-center gap-2">
                    <CustomSelect options={walletOptions} value={selectedWalletId} onChange={setSelectedWalletId} className="flex-grow" />
                    {selectedWalletId !== 'overview' && selectedWallet && (
                        <button onClick={() => setIsManageWalletModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-gear"></i></button>
                    )}
                    <button onClick={() => setIsAddWalletModalOpen(true)} className="btn btn-secondary btn-icon flex-shrink-0"><i className="fa-solid fa-plus"></i></button>
                </div>
                
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                    <div>
                        <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Income</p>
                        <p className="font-bold" style={{color: 'var(--success-primary)'}}>{formatCurrency(summary.income)}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Expenses</p>
                        <p className="font-bold" style={{color: 'var(--danger-primary)'}}>{formatCurrency(summary.expense)}</p>
                    </div>
                     <div>
                        <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Balance</p>
                        <p className="font-bold" style={{color: 'var(--text-primary)'}}>{formatCurrency(summary.income - summary.expense)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-2">
                    <div className="p-2 rounded-xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
                        <div className="flex gap-1 justify-between overflow-x-auto">
                            {filterOptions.map(opt => (
                                <button key={opt.id} onClick={() => setFilterType(opt.id)} className={`px-3 py-1 text-sm rounded-lg font-semibold whitespace-nowrap transition-colors ${filterType === opt.id ? 'text-white' : ''}`} style={{
                                    backgroundColor: filterType === opt.id ? 'var(--accent-primary)' : 'transparent',
                                    color: filterType === opt.id ? 'var(--accent-text)' : 'var(--text-secondary)'
                                }}>{opt.label}</button>
                            ))}
                        </div>
                        {filterType === 'range' && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t" style={{borderColor: 'var(--border-color)'}}>
                                <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))} className="form-input text-sm p-1.5"/>
                                <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))} className="form-input text-sm p-1.5"/>
                            </div>
                        )}
                    </div>
                     {financeCategories.length > 0 && (
                        <CustomSelect
                            options={categoryFilterOptions}
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                        />
                    )}
                </div>

                 {/* Add Transaction Button */}
                 {selectedWalletId !== 'overview' && (
                    <button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }} className="w-full btn btn-primary">
                        <i className="fa-solid fa-plus mr-2"></i>Add Transaction
                    </button>
                 )}

                {/* Transaction History */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold" style={{color: 'var(--text-secondary)'}}>History</h3>
                     {filteredTransactions.length === 0 ? (
                        <div className="text-center py-10 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
                            <i className="fa-solid fa-receipt text-4xl mb-3" style={{color: 'var(--text-tertiary)'}}></i>
                            <p style={{color: 'var(--text-secondary)'}}>No transactions for this period.</p>
                        </div>
                     ) : filteredTransactions.map(t => {
                        const category = financeCategories.find(c => c.id === t.categoryId);
                        const wallet = wallets.find(w => w.id === t.walletId);
                        const isOverview = selectedWalletId === 'overview';
                        const barColor = isOverview ? wallet?.color : category?.color;
                        const isIncome = t.type === TransactionType.Income;
                        
                        return (
                            <button key={t.id} onClick={() => { setEditingTransaction(t); setIsFormOpen(true); }} className="w-full text-left flex gap-3 p-3 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
                                <div className="w-1.5 self-stretch shrink-0 rounded-full" style={{ backgroundColor: barColor || '#fff' }}></div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-bold truncate">{t.title}</p>
                                    <p className="text-xs flex items-center gap-1.5 flex-wrap" style={{color: 'var(--text-secondary)'}}>
                                        {category?.icon && <i className={`fa-solid ${category.icon} w-4 text-center`}></i>}
                                        <span>{category?.name || 'Uncategorized'}</span>
                                        {isOverview && wallet && (
                                            <>
                                                <span className="mx-1">•</span>
                                                {wallet.icon && <i className={`fa-solid ${wallet.icon} w-4 text-center`}></i>}
                                                <span>{wallet.name}</span>
                                            </>
                                        )}
                                    </p>
                                    {t.description && <p className="text-sm mt-1 truncate">{t.description}</p>}
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className={`font-bold ${isIncome ? 'text-[var(--success-primary)]' : 'text-[var(--danger-primary)]'}`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                                    </p>
                                    <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>{dateFromYYYYMMDD(t.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <TransactionFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveTransaction}
                onDelete={handleDeleteTransaction}
                initialData={editingTransaction}
                walletId={selectedWalletId}
            />
            
            <AddWalletModal 
                isOpen={isAddWalletModalOpen}
                onClose={() => setIsAddWalletModalOpen(false)}
                onAdd={handleAddWallet}
            />

            {selectedWallet && selectedWallet.id !== 'overview' && (
                <ManageWalletModal 
                    isOpen={isManageWalletModalOpen} 
                    onClose={() => setIsManageWalletModalOpen(false)} 
                    wallet={selectedWallet} 
                    onUpdate={handleUpdateWallet} 
                    onDelete={handleDeleteWallet} 
                />
            )}
        </div>
    );
}

export default FinancePage;