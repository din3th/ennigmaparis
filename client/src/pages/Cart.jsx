import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQty, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold tracking-widest font-heading uppercase text-center mb-12">Your Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-8">Your cart is currently empty.</p>
          <Link to="/shop" className="inline-block bg-black text-white px-10 py-4 uppercase tracking-widest text-sm font-bold hover:bg-gray-900 transition-colors">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white">
          <ul className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={`${item.product}-${item.size}`} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3 className="uppercase tracking-widest text-sm">
                        <Link to={`/shop/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <p className="ml-4">LKR {(item.price * item.qty).toLocaleString('en-US')}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 uppercase">Size: {item.size}</p>
                  </div>
                  
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center border border-gray-300">
                      <button 
                        onClick={() => updateQty(item.product, item.size, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                      >-</button>
                      <span className="px-3 font-medium">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.product, item.size, item.qty + 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >+</button>
                    </div>

                    <div className="flex">
                      <button 
                        type="button" 
                        className="font-medium text-gray-400 hover:text-gray-900 uppercase tracking-widest text-xs"
                        onClick={() => removeFromCart(item.product, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-200 py-6 mt-6">
            <div className="flex justify-between text-lg font-medium text-gray-900 uppercase tracking-widest">
              <p>Subtotal</p>
              <p>LKR {cartTotal.toLocaleString('en-US')}</p>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
            <div className="mt-8">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center bg-black px-6 py-4 text-base font-bold text-white shadow-sm hover:bg-gray-900 uppercase tracking-widest"
              >
                Checkout
              </button>
            </div>
            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
              <p>
                or{' '}
                <Link to="/shop" className="font-medium text-black hover:text-gray-700 underline uppercase">
                  Continue Shopping
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
