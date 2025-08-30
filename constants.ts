import { TransactionType } from "./types";

export const COLORS = [
  '#22d3ee', // cyan-400
  '#4ade80', // green-400
  '#a3e635', // lime-400
  '#facc15', // yellow-400
  '#fb923c', // orange-400
  '#f87171', // red-400
  '#f472b6', // pink-400
];

export const DEFAULT_CALENDARS = [
    { id: 'overview', name: 'Overview', color: '#f472b6' }, // pink-400
    { id: 'personal', name: 'Personal', color: '#22d3ee' }, // cyan-400
    { id: 'work', name: 'Work', color: '#4ade80' }
];

export const DEFAULT_WALLETS = [
    { id: 'overview', name: 'Overview', icon: 'fa-solid fa-layer-group', color: '#a3e635' }, // lime-400
    { id: 'cash', name: 'Cash', icon: 'fa-solid fa-wallet', color: '#22d3ee' }, // cyan-400
    { id: 'bank', name: 'Bank Account', icon: 'fa-solid fa-building-columns', color: '#facc15' } // yellow-400
];

export const DEFAULT_FINANCE_CATEGORIES = [
    // Income
    { id: 'salary', name: 'Salary', color: '#4ade80', icon: 'fa-money-bill-wave', type: TransactionType.Income },
    { id: 'freelance', name: 'Freelance', color: '#22d3ee', icon: 'fa-briefcase', type: TransactionType.Income },
    { id: 'gifts', name: 'Gifts', color: '#f472b6', icon: 'fa-gift', type: TransactionType.Income },

    // Expense
    { id: 'food', name: 'Food & Dining', color: '#facc15', icon: 'fa-utensils', type: TransactionType.Expense },
    { id: 'groceries', name: 'Groceries', color: '#fb923c', icon: 'fa-cart-shopping', type: TransactionType.Expense },
    { id: 'rent', name: 'Rent', color: '#f87171', icon: 'fa-house-user', type: TransactionType.Expense },
    { id: 'transport', name: 'Transport', color: '#22d3ee', icon: 'fa-bus', type: TransactionType.Expense },
    { id: 'entertainment', name: 'Entertainment', color: '#f472b6', icon: 'fa-film', type: TransactionType.Expense },
    { id: 'other_expense', name: 'Other', color: '#a3e635', icon: 'fa-ellipsis', type: TransactionType.Expense }
];

export const DEFAULT_HABIT_CATEGORIES = [
    { id: 'health', name: 'Health' },
    { id: 'productivity', name: 'Productivity' }
];