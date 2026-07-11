import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addCartItemDB, removeCartItemDB, clearCartDB, syncCartWithDB, getDBCart } from '../actions/cart';

export type ProductStub = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
  product?: ProductStub; 
};

interface CartState {
  items: CartItem[];
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
  addItem: (product: ProductStub, quantity: number, isLoggedIn: boolean) => Promise<void>;
  removeItem: (productId: string, isLoggedIn: boolean) => Promise<void>;
  clearCart: (isLoggedIn: boolean) => Promise<void>;
  syncWithDB: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      setHydrated: (state) => set({ isHydrated: state }),
      
      addItem: async (product, quantity, isLoggedIn) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productId === product.id);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { productId: product.id, quantity, product }] });
        }

        if (isLoggedIn) {
          await addCartItemDB(product.id, quantity);
        }
      },

      removeItem: async (productId, isLoggedIn) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
        });

        if (isLoggedIn) {
          await removeCartItemDB(productId);
        }
      },

      clearCart: async (isLoggedIn) => {
        set({ items: [] });
        if (isLoggedIn) {
          await clearCartDB();
        }
      },

      syncWithDB: async () => {
        const { items } = get();
        
        if (items.length > 0) {
          // Fusionar locales con DB
          const dbCart = await syncCartWithDB(items.map(i => ({ productId: i.productId, quantity: i.quantity })));
          if (dbCart) {
            // Reconstruir store desde DB
            const syncedItems = dbCart.items.map((dbItem: any) => ({
              productId: dbItem.productId,
              quantity: dbItem.quantity,
              product: dbItem.product
            }));
            set({ items: syncedItems });
          }
        } else {
          // Si el carrito local está vacío, traemos lo de DB
          const dbCart = await getDBCart();
          if (dbCart) {
            const syncedItems = dbCart.items.map((dbItem: any) => ({
              productId: dbItem.productId,
              quantity: dbItem.quantity,
              product: dbItem.product
            }));
            set({ items: syncedItems });
          }
        }
      },

      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product?.price || 0;
          return total + (price * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'dgg-cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
