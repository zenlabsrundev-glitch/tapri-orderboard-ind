import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, X, ArrowDown, Check } from 'lucide-react';
import { TeaCupLogo } from '@/components/tapri/TeaCupLogo';
import { TeaLoading } from '@/components/tapri/TeaLoading';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiBase } from '@/lib/api-utils';
import type { MenuCardItem, MenuCardTag, MenuCategory } from '@/lib/menu-api-contract';

const API_URL = getApiBase('menu/card');

type DraftState = Record<string, { name: string; description: string; price: string }>;

const emptyDraft = { name: '', description: '', price: '' };
const CATEGORY_ORDER = ['hot-teas', 'milk-drinks', 'cold-drinks', 'snacks'] as const;
const CATEGORY_TITLES: Record<(typeof CATEGORY_ORDER)[number], string> = {
  'hot-teas': 'HOT TEAS',
  'milk-drinks': 'MILK DRINKS',
  'cold-drinks': 'COLD DRINKS',
  snacks: 'SNACKS',
};
const DEFAULT_TAGS_BY_CATEGORY: Record<string, MenuCardTag[]> = {
  'hot-teas': [{ type: 'hot', label: 'Hot' }],
  'milk-drinks': [],
  'cold-drinks': [{ type: 'cold', label: 'Cold' }],
  snacks: [],
};

export default function MenuCard() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [newItems, setNewItems] = useState<DraftState>({});
  const [editingItems, setEditingItems] = useState<DraftState>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMenu = async () => {
    try {
      const res = await axios.get<MenuCategory[]>(API_URL);
      setMenu(res.data);
    } catch (error) {
      console.error('[MenuCard]: Failed to load menu card', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const menuToRender = useMemo(() => {
    const byId = new Map(menu.map(category => [category.id, category]));
    return CATEGORY_ORDER.map(categoryId => {
      const existing = byId.get(categoryId);
      return (
        existing ?? {
          id: categoryId,
          title: CATEGORY_TITLES[categoryId],
          items: [],
        }
      );
    });
  }, [menu]);

  const setNewItemField = (categoryId: string, field: keyof DraftState[string], value: string) => {
    setNewItems(current => ({
      ...current,
      [categoryId]: {
        ...(current[categoryId] ?? emptyDraft),
        [field]: value,
      },
    }));
  };

  const startEditing = (item: MenuCardItem) => {
    setEditingItems(current => ({
      ...current,
      [item.id]: {
        name: item.name,
        description: item.description,
        price: String(item.price),
      },
    }));
  };

  const cancelEditing = (itemId: string) => {
    setEditingItems(current => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  };

  const setEditingField = (itemId: string, field: keyof DraftState[string], value: string) => {
    setEditingItems(current => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? emptyDraft),
        [field]: value,
      },
    }));
  };

  const handleAdd = async (categoryId: string) => {
    const draft = newItems[categoryId] ?? emptyDraft;
    const name = draft.name.trim();
    const description = draft.description.trim();
    const price = Number(draft.price);

    if (!name || !description || !Number.isFinite(price) || price <= 0) {
      toast.error('Enter a valid name, description, and price');
      return;
    }

    setSavingKey(`add-${categoryId}`);
    try {
      await axios.post<MenuCardItem>(`${API_URL}/items`, {
        name,
        description,
        price,
        categoryId,
        tags: DEFAULT_TAGS_BY_CATEGORY[categoryId] ?? [],
      });
      await fetchMenu();
      setNewItems(current => ({ ...current, [categoryId]: emptyDraft }));
      toast.success('Menu item added');
    } catch (error) {
      console.error('[MenuCard]: Failed to add menu item', error);
      toast.error('Failed to add item');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveEdit = async (item: MenuCardItem) => {
    const draft = editingItems[item.id];
    if (!draft) {
      return;
    }

    const name = draft.name.trim();
    const description = draft.description.trim();
    const price = Number(draft.price);

    if (!name || !description || !Number.isFinite(price) || price <= 0) {
      toast.error('Enter a valid name, description, and price');
      return;
    }

    setSavingKey(`edit-${item.id}`);
    try {
      await axios.patch<MenuCardItem>(`${API_URL}/items/${item.id}`, {
        name,
        description,
        price,
      });
      await fetchMenu();
      cancelEditing(item.id);
      toast.success('Menu item updated');
    } catch (error) {
      console.error('[MenuCard]: Failed to update menu item', error);
      toast.error('Failed to update item');
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    setSavingKey(`delete-${itemId}`);
    try {
      await axios.delete(`${API_URL}/items/${itemId}`);
      await fetchMenu();
      cancelEditing(itemId);
      toast.success('Menu items removed');
    } catch (error) {
      console.error('[MenuCard]: Failed to delete menu item', error);
      toast.error('Failed to delete item');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-3 py-4 sm:px-4 md:px-8 md:py-8 relative">
      <div className="w-full max-w-4xl mx-auto paper-card rounded-2xl overflow-hidden dark:bg-zinc-900/95 dark:border dark:border-amber-400/20 dark:shadow-2xl">
        
        {/* Header Section */}
        <div className="relative pt-9 pb-6 px-4 sm:px-6 text-center bg-gradient-chai border-b-4 border-saffron/60 dark:border-amber-300/50">
          <div className="flex justify-center mb-4 text-cream opacity-90">
             <TeaCupLogo size={48} />
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-[0.08em] sm:tracking-[0.1em] text-cream uppercase mb-2">
            Tapri Tales
          </h1>
          <p className="font-handwritten text-base sm:text-lg text-saffron -mt-1 dark:text-amber-100">
            Street Tea Stall · Since 2010
          </p>
        </div>

        {/* Menu Content */}
        <div className="p-4 sm:p-6 md:p-10 space-y-8 sm:space-y-10 md:space-y-12 dark:bg-zinc-950/60">
          {loading && <TeaLoading className="border border-dashed border-border rounded-xl" />}

          {!loading && menuToRender.map((category) => (
            <div key={category.id} className="space-y-4">
              <h2 className="text-chai-deep font-display text-lg font-bold uppercase pb-2 border-b-2 border-border dark:text-amber-100 dark:border-amber-300/30">
                {category.title}
              </h2>
              
              <div className="space-y-3">
                {category.items.map((item) => {
                  const editing = editingItems[item.id];
                  return (
                  <div key={item.id} className="flex flex-col gap-4 p-3 sm:p-4 rounded-xl border bg-background/50 hover:bg-muted/50 transition group dark:bg-zinc-800/90 dark:border-amber-300/15 dark:hover:bg-zinc-800 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-3 sm:gap-4 items-start min-w-0">
                      <div className="mt-2 w-2.5 h-2.5 rounded-full bg-saffron dark:bg-amber-300" />
                      <div className="min-w-0 flex-1">
                        {editing ? (
                          <div className="space-y-2 w-full min-w-0 sm:min-w-[260px]">
                            <input
                              type="text"
                              value={editing.name}
                              onChange={(e) => setEditingField(item.id, 'name', e.target.value)}
                              className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50"
                            />
                            <input
                              type="text"
                              value={editing.description}
                              onChange={(e) => setEditingField(item.id, 'description', e.target.value)}
                              className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50"
                            />
                            <input
                              type="number"
                              min="1"
                              value={editing.price}
                              onChange={(e) => setEditingField(item.id, 'price', e.target.value)}
                              className="w-full sm:w-32 bg-background border rounded-lg px-3 py-2 text-sm text-foreground dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base sm:text-lg text-foreground dark:text-amber-50 break-words">{item.name}</h3>
                              <div className="flex gap-2 text-xs font-semibold">
                                {item.tags.map((tag, i) => (
                                  <span 
                                    key={i}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider ${
                                      tag.type === 'bestseller' ? 'bg-saffron/20 text-chai-deep dark:bg-amber-300/20 dark:text-amber-100' :
                                      tag.type === 'new' ? 'bg-neon/20 text-neon-glow drop-shadow dark:bg-emerald-400/20 dark:text-emerald-300' :
                                      tag.type === 'hot' ? 'text-urgent bg-transparent p-0 dark:text-orange-300' :
                                      tag.type === 'cold' ? 'text-blue-500 bg-transparent p-0 dark:text-sky-300' : ''
                                    }`}
                                  >
                                    {tag.type === 'hot' ? '▲ ' + tag.label : 
                                     tag.type === 'cold' ? '▼ ' + tag.label : 
                                     tag.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 break-words dark:text-amber-50/80">{item.description}</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-end">
                      <span className="font-bold text-lg sm:text-xl text-chai-deep md:mr-2 dark:text-amber-200">
                        ₹{editing ? editing.price || item.price : item.price}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3">
                      {editing ? (
                        <>
                          <button
                            className="px-4 py-2 rounded-lg border bg-chai text-cream text-sm font-semibold disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-950 dark:border-amber-300"
                            onClick={() => handleSaveEdit(item)}
                            disabled={savingKey === `edit-${item.id}`}
                          >
                            Save
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg border bg-background text-muted-foreground text-sm font-semibold dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200"
                            onClick={() => cancelEditing(item.id)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="w-10 h-10 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-chai hover:border-chai transition dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-amber-200 dark:hover:border-amber-300/40"
                          onClick={() => startEditing(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="w-10 h-10 rounded-lg border bg-background flex items-center justify-center text-muted-foreground hover:text-urgent hover:border-urgent transition disabled:opacity-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-rose-300 dark:hover:border-rose-400/40"
                        onClick={() => handleDelete(item.id)}
                        disabled={savingKey === `delete-${item.id}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Add New Item Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <input 
                  type="text" 
                  placeholder="Item name" 
                  value={newItems[category.id]?.name ?? ''}
                  onChange={(e) => setNewItemField(category.id, 'name', e.target.value)}
                  className="bg-background border rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50 dark:placeholder:text-zinc-400"
                />
                <input 
                  type="text" 
                  placeholder="Description" 
                  value={newItems[category.id]?.description ?? ''}
                  onChange={(e) => setNewItemField(category.id, 'description', e.target.value)}
                  className="bg-background border rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50 dark:placeholder:text-zinc-400"
                />
                <div className="md:col-span-2">
                  <input 
                    type="number" 
                    placeholder="₹ Price" 
                    min="1"
                    value={newItems[category.id]?.price ?? ''}
                    onChange={(e) => setNewItemField(category.id, 'price', e.target.value)}
                  className="bg-background border rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground w-full dark:bg-zinc-900 dark:border-amber-300/20 dark:text-amber-50 dark:placeholder:text-zinc-400"
                  />
                </div>
                <div className="md:col-span-2 flex justify-between items-center mt-2 gap-3">
                  <button
                  className="px-5 py-2.5 bg-chai text-cream rounded-lg text-sm font-bold hover:bg-chai-deep transition flex items-center gap-2 disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                    onClick={() => handleAdd(category.id)}
                    disabled={savingKey === `add-${category.id}`}
                  >
                    + Add
                  </button>
                  {category.id === 'hot-teas' && (
                     <button className="w-10 h-10 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800">
                       <ArrowDown className="w-5 h-5 text-muted-foreground dark:text-zinc-200" />
                     </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && menuToRender.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              No menu categories found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-8 text-center text-sm font-medium text-muted-foreground bg-muted/30 border-t dark:bg-zinc-900 dark:border-amber-300/10 dark:text-zinc-300">
          Prices in ₹ · Seasonal items may vary · Ask for today's special
        </div>
      </div>

      {/* Floating Confirm Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 md:bottom-10 md:right-10 px-6 py-3.5 bg-gradient-neon text-chai-deep font-display font-extrabold rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-transform z-50 neon-glow sm:w-auto"
      >
        <Check className="w-5 h-5 stroke-[3]" />
        CONFIRM MENU
      </button>
    </div>
  );
}
