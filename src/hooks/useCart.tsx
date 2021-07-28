import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(()=>{
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))    
  },[cart])
 

  const addProduct = async (productId: number) => {
    try {
      const productSelected = await api.get(`products/${productId}`).then(response => response.data)
      const productOnStock = await api.get(`stock/${productId}`).then(response => response.data)
      
      const isIn = cart.filter((item) => item.id === productId)
 
      if(productOnStock.amount >= 1) {

        await api.put(`stock/${productId}`,{
          amount: productOnStock.amount - 1
        })

        if(isIn.length === 0){

          const productWithAmount = { 
            ...productSelected,
            amount: 1        
          }

          setCart([
            productWithAmount,          
            ...cart
          ])

      } else{
          const amount = isIn[0].amount + 1
          updateProductAmount({productId,amount})
        }

      } else {        
        toast('Nao disponivel no estoque', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          });
      }

    } catch {
      toast.error('Nao foi possivel adicionar seu item')
    }
  };

  const removeProduct = async (productId: number) => {
    
    try {
      const productOnStock = await api.get(`stock/${productId}`).then(response => response.data)
      const isIn = cart.filter((item) => item.id === productId)
      const amountUpdate = cart.filter((item) => item.id !== productId)
  
      await api.put(`stock/${productId}`,{
        amount: productOnStock.amount + isIn[0].amount
      })
      setCart(amountUpdate)

      toast('Item removido do carrinho', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
      
    } catch {
      toast.error('Nao foi possivel remover seu item');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {      
      
        if(amount === 0){

          toast('Voce removel o item', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            });
          removeProduct(productId)
        } else {

          const productUpdateAmount = cart.map((item)=> { 
            if(item.id === productId) {
              
                const amountUpdate = {
                  ...item,
                  amount: amount,
                }
                return amountUpdate
              
              
            }
            return item 
          }        
        )
        setCart(productUpdateAmount)
        }   

    } catch {
      toast('Nao foi possivel atualizar seu carrinho')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
