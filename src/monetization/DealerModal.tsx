// Flight Case Dealer — Studio Supplier surface (bead 89o.5).
// An audio-equipment road warehouse, not a cash shop: fixed catalogue,
// exact previews, provider-localised prices, owned states. Static by
// construction (no autoplay animation — reduced-motion safe). Opens only
// on explicit click; never interrupts sessions.

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { V1_CATALOGUE } from './catalog';
import { priceFor, useDealerStore } from './store';
import type { StoreProduct } from './types';

type Section = 'featured' | 'customs' | 'collections' | 'owned' | 'back';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'featured', label: 'Featured Cases' },
  { id: 'customs', label: 'Case Customs' },
  { id: 'collections', label: 'Studio Collections' },
  { id: 'owned', label: 'Owned' },
  { id: 'back', label: 'Back Catalogue' },
];

const isFullyOwned = (p: StoreProduct, isOwned: (id: string) => boolean): boolean =>
  p.entitlements.every((e) => isOwned(e.entitlementId));

function productsFor(section: Section, isOwned: (id: string) => boolean): StoreProduct[] {
  switch (section) {
    case 'featured':
      return V1_CATALOGUE.filter((p) => p.type === 'supporter_pack' || (p.type === 'curated_case' && p.preview.chooseOneOfMany));
    case 'customs':
      return V1_CATALOGUE.filter((p) => p.type === 'case_cosmetic');
    case 'collections':
      return V1_CATALOGUE.filter((p) => p.type === 'studio_pack' || (p.type === 'curated_case' && !p.preview.chooseOneOfMany));
    case 'owned':
      return V1_CATALOGUE.filter((p) => isFullyOwned(p, isOwned));
    case 'back':
      return V1_CATALOGUE;
  }
}

const ProductCard: React.FC<{ product: StoreProduct }> = ({ product }) => {
  const { products, purchase, purchaseSku, isOwned } = useDealerStore();
  const [choice, setChoice] = useState<string>(product.preview.items[0]?.ref ?? '');
  const owned = isFullyOwned(product, isOwned);
  const pending = purchase.status === 'pending' && purchase.sku === product.sku;
  const failed = purchase.status === 'failed' && purchase.sku === product.sku;
  const cancelled = purchase.status === 'cancelled' && purchase.sku === product.sku;

  return (
    <Card className="p-3 bg-stone-900/70 border-stone-700">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-amber-100 text-sm">{product.title}</h4>
          <p className="text-xs text-stone-400 mt-0.5">{product.description}</p>
        </div>
        {owned && (
          <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
            OWNED
          </span>
        )}
      </div>

      <div className="mt-2 rounded border border-stone-800 bg-stone-950/70 p-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">
          {product.preview.chooseOneOfMany ? `${product.preview.tagline} — pick one:` : product.preview.tagline}
        </p>
        <ul className="space-y-1">
          {product.preview.items.map((item) => (
            <li key={item.ref} className="flex items-center gap-2 text-xs text-stone-300">
              {product.preview.chooseOneOfMany ? (
                <input
                  type="radio"
                  name={`choice-${product.id}`}
                  checked={choice === item.ref}
                  onChange={() => setChoice(item.ref)}
                  aria-label={`Choose ${item.label}`}
                  className="accent-amber-500"
                />
              ) : null}
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-amber-300">{priceFor(product.sku, products)}</span>
        {owned ? (
          <span className="text-xs text-emerald-400">In your studio ✓</span>
        ) : (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => void purchaseSku(product.sku, product.preview.chooseOneOfMany ? choice : undefined)}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold"
          >
            {pending ? 'Confirming…' : `Purchase · ${priceFor(product.sku, products)}`}
          </Button>
        )}
      </div>
      {failed && <p className="mt-1 text-xs text-rose-400">{purchase.message} Nothing was granted.</p>}
      {cancelled && <p className="mt-1 text-xs text-stone-400">Cancelled — nothing was granted.</p>}
    </Card>
  );
};

export const DealerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [section, setSection] = useState<Section>('featured');
  const { productsLoading, productsError, refreshProducts, restore, isOwned, celebration, clearCelebration } = useDealerStore();
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const list = useMemo(() => productsFor(section, isOwned), [section, isOwned]);

  const handleRestore = async () => {
    try {
      const n = await restore();
      setRestoreMsg(n > 0 ? `Restored ${n} purchase${n === 1 ? '' : 's'}.` : 'No purchases found on this account.');
    } catch {
      setRestoreMsg('Restore unavailable — check connection and retry.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { clearCelebration(); onClose(); } }}>
      <DialogContent className="max-w-2xl bg-stone-950 border-stone-700 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-amber-400">📦 Sal&apos;s Road Warehouse — Flight Case Dealer</DialogTitle>
          <DialogDescription className="text-stone-400">
            Tour-tested cases, liveries and studio dressing. Everything below shows exactly what you get — no blind rolls, ever.
          </DialogDescription>
        </DialogHeader>

        {celebration && (
          <div className="rounded border border-amber-600 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            🎉 {celebration.productTitle} is yours — your studio reveal plays after checkout settles.
          </div>
        )}

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Dealer sections">
          {SECTIONS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              role="tab"
              aria-selected={section === s.id}
              variant={section === s.id ? 'default' : 'outline'}
              onClick={() => setSection(s.id)}
              className={section === s.id ? 'bg-amber-600 text-stone-950 font-bold' : 'text-stone-300'}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {productsLoading && <p className="text-xs text-stone-400">Loading dealer prices…</p>}
        {productsError && (
          <div className="text-xs text-rose-400">
            {productsError}{' '}
            <Button size="sm" variant="outline" onClick={() => void refreshProducts()} className="ml-1">
              Retry
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-2">
            {list.length === 0 && !productsLoading && (
              <p className="text-sm text-stone-500 py-6 text-center">
                {section === 'owned' ? 'Nothing owned yet — the warehouse remembers every purchase.' : 'Nothing shelved here right now.'}
              </p>
            )}
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-1">
          <Button size="sm" variant="outline" onClick={() => void handleRestore()} className="text-stone-300">
            Restore purchases
          </Button>
          {restoreMsg && <span className="text-xs text-stone-400">{restoreMsg}</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealerModal;
