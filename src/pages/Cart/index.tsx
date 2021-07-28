import {
  MdDelete,
  MdAddCircleOutline,
  MdRemoveCircleOutline,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import { useCart } from '../../hooks/useCart';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { Container, EmptyCart, ProductTable, Total } from './styles';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
}

const Cart = (): JSX.Element => {
  const { cart, removeProduct, updateProductAmount } = useCart();
    
  const total =
    formatPrice(
      cart.reduce(function(total, product){
        const lastPrice = product.price * product.amount
        return total + lastPrice;
        }, 0)      
    )

  async function handleProductIncrement(product: Product) {
    const productId = product.id
    const productOnStock = await api.get(`stock/${productId}`).then(response => response.data)
      
    
    if(productOnStock.amount >= 1){
      await api.put(`stock/${productId}`,{
        amount: productOnStock.amount - 1
      })
    
      const amount = product.amount + 1;
      updateProductAmount({productId,amount})
    } else {
      toast('Nao temos mais esse produto no estoque', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        });
    }
  } 

  async function handleProductDecrement(product: Product) {
    const productId = product.id
    const productOnStock = await api.get(`stock/${productId}`).then(response => response.data)
    
    const amount = product.amount - 1;
    updateProductAmount({productId,amount})
    
    if(product.amount !== 0){
      await api.put(`stock/${productId}`,{
        amount: productOnStock.amount + 1
      })
    }

  }

  async function handleRemoveProduct(productId: number) {      
    removeProduct(productId)
  }

  return (
    <Container>
      {cart.length?
      <ProductTable>
                 
        <thead>
        <tr>
          <th aria-label="product image" />
          <th>PRODUTO</th>
          <th>QTD</th>
          <th>SUBTOTAL</th>
          <th aria-label="delete icon" />
        </tr>
      </thead>
      <tbody>
        {cart.map((product)=>(
          <tr data-testid="product" key={product.id}>
          <td>
            <img src={product.image} alt={product.title}/>
          </td>
          <td>
            <strong>{product.title}</strong>
            <span>{formatPrice(product.price)}</span>
          </td>
          <td>
            <div>
              <button
                type="button"
                data-testid="decrement-product"
                disabled={product.amount <= 0}
                onClick={() => handleProductDecrement(product)}
              >
                <MdRemoveCircleOutline size={20} />
              </button>
              <input
                type="text"
                data-testid="product-amount"
                readOnly
                value={product.amount}
              />
              <button
                type="button"
                data-testid="increment-product"
                onClick={() => handleProductIncrement(product)}
              >
                <MdAddCircleOutline size={20} />
              </button>
            </div>
          </td>
          <td>
            <strong>{formatPrice(product.price * product.amount)}</strong>
          </td>
          <td>
            <button
              type="button"
              data-testid="remove-product"
              onClick={() => handleRemoveProduct(product.id)}
            >
              <MdDelete size={20} />
            </button>
          </td>
        </tr>
        ))}
      </tbody>
        
      </ProductTable>
       : 
      <EmptyCart>
        Seu carrinho esta vazio
      </EmptyCart>
      }

      {cart.length?
      <footer>

        <button type="button">Finalizar pedido</button>

        <Total>
          <span>TOTAL</span>
          <strong>{total}</strong>
        </Total>
      </footer> : ''}
    </Container>
  );
};

export default Cart;
