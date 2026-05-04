import { useState, useMemo } from 'react';
import { Plus, Minus, Send, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Order, CATEGORIES } from '@/lib/tapri-data';
import { useMenu } from '@/hooks/use-menu';
import { TeaLoading } from './TeaLoading';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OrderPanelProps {
  onPlace: (o: Omit<Order, 'id'>) => void;
  onPopper?: () => void;
  onCelebrate?: () => void;
}

/** Stable decorative QR pattern (no Math.random per render). */
function useQrDecorPattern() {
  return useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        return (row * 3 + col * 5) % 7 !== 0;
      }),
    []
  );
}

export const OrderPanel = ({ onPlace, onPopper, onCelebrate }: OrderPanelProps) => {
  const { menu, loading: menuLoading, error: menuError } = useMenu();
  const qrCells = useQrDecorPattern();

  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number]['id']>('tea');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [groupName, setGroupName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupMins, setPickupMins] = useState(15);

  const menuBlocked = menuLoading || Boolean(menuError);
  const items = useMemo(() => menu.filter(m => m.category === activeCat), [activeCat, menu]);

  const bulkTeaItem = useMemo(() => {
    const teaItems = menu.filter(m => m.category === 'tea');
    return (
      teaItems.find(
        m =>
          m.id.toLowerCase().includes('masala') ||
          m.name.toLowerCase().includes('masala') ||
          m.name.toLowerCase().includes('chai')
      ) ?? teaItems[0]
    );
  }, [menu]);

  const updateQty = (id: string, delta: number) => {
    if (menuBlocked) return;
    setCart(c => {
      const next = (c[id] || 0) + delta;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const setBulk = (id: string, qty: number) => {
    if (menuBlocked || !id) return;
    setCart(c => ({ ...c, [id]: qty }));
  };

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [cart, menu]);

  const totalCups = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const handlePlace = () => {
    if (menuBlocked) {
      toast.error('Wait for the menu to load');
      return;
    }
    if (!groupName.trim() || !customerName.trim() || !phone.trim()) {
      toast.error('Fill group, name & phone');
      return;
    }
    if (totalCups === 0) {
      toast.error('Add some items first');
      return;
    }
    const lineItems = Object.entries(cart)
      .map(([id, qty]) => {
        const m = menu.find(x => x.id === id);
        return m ? { id, name: m.name, emoji: m.emoji, qty, price: m.price } : null;
      })
      .filter(Boolean) as Order['items'];

    if (lineItems.length !== Object.keys(cart).length) {
      toast.error('Some cart items are no longer on the menu. Clear cart and try again.');
      return;
    }

    const order = {
      groupName: groupName.trim(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      items: lineItems,
      total,
      pickupTime: new Date(Date.now() + pickupMins * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: Date.now(),
      urgent: pickupMins <= 10,
    };
    onPlace(order);
    onCelebrate?.();
    toast.success(`Order placed for ${groupName}! ☕`);
    setCart({});
    setGroupName('');
    setCustomerName('');
    setPhone('');
  };

  return (
    <aside className="paper-card rounded-2xl p-4 md:p-5 flex flex-col gap-4 h-fit lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-chai-deep">Place Order</h2>
          <p className="font-handwritten text-chai text-base -mt-0.5">Tap, count, send 🚀</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="border-chai/30 text-chai hover:bg-chai/10">
              <QrCode className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="paper-card">
            <DialogHeader>
              <DialogTitle className="text-chai-deep">Scan to Order ☕</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-56 h-56 rounded-xl bg-cream border-4 border-chai/30 p-3 grid grid-cols-8 grid-rows-8 gap-0.5">
                {qrCells.map((on, i) => (
                  <div key={i} className={`rounded-[2px] ${on ? 'bg-chai-deep' : 'bg-transparent'}`} />
                ))}
              </div>
              <p className="font-handwritten text-xl text-chai">Scan to skip the queue</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {menuError && (
        <div className="rounded-lg border border-urgent/40 bg-urgent/10 px-3 py-2 text-sm text-chai-deep">{menuError}</div>
      )}

      {/* Category tabs */}
      <div className={`flex gap-1.5 bg-secondary p-1 rounded-xl dark:bg-zinc-900/60 ${menuBlocked ? 'opacity-60 pointer-events-none' : ''}`}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.id)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition ${activeCat === c.id
                ? 'bg-gradient-chai text-cream shadow-card'
                : 'text-chai-deep/70 hover:bg-cream dark:hover:bg-zinc-900/70'
              }`}
          >
            <div className="text-base">{c.emoji}</div>
            {c.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 -mr-1">
        {menuLoading && (
          <TeaLoading className="border border-dashed border-border rounded-xl" />
        )}
        {!menuLoading && !menuError && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No items in this category.
          </div>
        )}
        {!menuLoading &&
          !menuError &&
          items.map(item => {
            const qty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 flex items-center gap-3 transition dark:bg-zinc-900/70 dark:border-amber-200/15 dark:hover:border-amber-200/30 ${qty > 0 ? 'bg-saffron/10 border-saffron/40 dark:bg-amber-400/10' : 'bg-cream border-border hover:border-chai/30'
                  }`}
              >
                <div className="text-2xl">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-chai-deep truncate dark:text-amber-50">{item.name}</div>
                  <div className="text-xs text-chai dark:text-amber-200">₹{item.price}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 border-chai/30 dark:border-amber-200/25 dark:bg-zinc-950/30 dark:text-amber-50 dark:hover:bg-zinc-900"
                    disabled={menuBlocked}
                    onClick={() => updateQty(item.id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-bold text-chai-deep tabular-nums dark:text-amber-50">{qty}</span>
                  <Button
                    size="icon"
                    className="h-7 w-7 bg-chai hover:bg-chai-deep text-cream dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                    disabled={menuBlocked}
                    onClick={() => updateQty(item.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bulk quick buttons */}
      {bulkTeaItem && !menuBlocked && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
            Bulk Add ({bulkTeaItem.name})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setBulk(bulkTeaItem.id, n)}
                className="py-2 rounded-lg bg-gradient-saffron text-chai-deep font-bold text-sm hover:scale-105 transition shadow-card"
              >
                {n} cups
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customer details */}
      <div className={`space-y-2 ${menuBlocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <div>
          <Label className="text-xs text-chai-deep">Group / Team</Label>
          <Input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="e.g. CSE Lab Team"
            className="bg-cream border-chai/20 dark:bg-zinc-900/70 dark:border-amber-200/20 dark:text-amber-50 dark:placeholder:text-amber-50/50"
            disabled={menuBlocked}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-chai-deep">Name</Label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="bg-cream border-chai/20 dark:bg-zinc-900/70 dark:border-amber-200/20 dark:text-amber-50 dark:placeholder:text-amber-50/50"
              disabled={menuBlocked}
            />
          </div>
          <div>
            <Label className="text-xs text-chai-deep">Phone</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="bg-cream border-chai/20 dark:bg-zinc-900/70 dark:border-amber-200/20 dark:text-amber-50 dark:placeholder:text-amber-50/50"
              disabled={menuBlocked}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-chai-deep">Pickup in (mins)</Label>
          <div className="flex gap-1.5 mt-1">
            {[10, 15, 30, 60].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPickupMins(m)}
                disabled={menuBlocked}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition ${pickupMins === m
                    ? 'bg-chai text-cream border-chai dark:bg-amber-500 dark:text-zinc-950 dark:border-amber-300/50'
                    : 'bg-cream text-chai border-chai/20 hover:border-chai/50 dark:bg-zinc-900/70 dark:text-amber-50 dark:border-amber-200/20 dark:hover:border-amber-200/40'
                  }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Total + Place */}
      <div className="border-t border-dashed border-chai/30 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-handwritten text-lg text-chai">Total ({totalCups} items)</span>
          <span className="font-display text-2xl font-extrabold text-chai-deep">₹{total}</span>
        </div>
        <Button
          onClick={handlePlace}
          disabled={menuBlocked}
          className="w-full bg-gradient-chai text-cream font-bold text-base py-6 rounded-xl shadow-warm hover:scale-[1.02] hover:shadow-glow-neon transition disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          Place Order
        </Button>
      </div>
    </aside>
  );
};
