import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (cartProducts) {
        const parsedCartProducts: Product[] = JSON.parse(cartProducts);
        parsedCartProducts.filter(item => item.quantity > 0);
        setProducts(parsedCartProducts);
      }
      await AsyncStorage.clear();
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const { id, title, image_url, price } = product;

      const productIndex = products.findIndex(item => item.id === id);

      const newProduct = {
        id,
        title,
        image_url,
        price,
        quantity: productIndex === -1 ? 1 : products[productIndex].quantity + 1,
      };

      const filteredProducts = products.filter(item => item.id !== product.id);
      setProducts([newProduct, ...filteredProducts]);
      if (products) {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      // INCREMENTS A PRODUCT QUANTITY IN THE CART
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex !== -1) {
        const incrementedProduct = products[productIndex];
        const filteredProducts = products.filter(item => item.id !== id);
        incrementedProduct.quantity += 1;
        setProducts([incrementedProduct, ...filteredProducts]);
      }
      if (products) {
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // DECREMENTS A PRODUCT QUANTITY IN THE CART AND REMOVES IT IF QUANTITY REACHES ZERO
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex !== -1) {
        const decrementedProduct = products[productIndex];
        const filteredProducts = products.filter(item => item.id !== id);
        decrementedProduct.quantity -= 1;
        if (decrementedProduct.quantity === 0) {
          setProducts(filteredProducts);
        } else {
          setProducts([...filteredProducts, decrementedProduct]);
        }
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
