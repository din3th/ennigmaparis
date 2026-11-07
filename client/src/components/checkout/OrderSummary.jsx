import { resolveImageUrl } from '../../config/api';
import { formatMoney } from '../../hooks/useApi';

const OrderSummary = ({
  cartItems, currency, subtotal, shippingPrice, discount, grandTotal,
  discountInput, onDiscountInputChange, onApplyDiscount, applyingDiscount, discountError, discountSuccess,
}) => (
  <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm sticky top-8 space-y-6">
    <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 pb-3 border-b border-gray-200">
      Bag Summary ({cartItems.length})
    </h2>

    <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto pr-1">
      {cartItems.map((item) => (
        <li key={`${item.product}-${item.size}`} className="py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={resolveImageUrl(item.image)} alt={item.name} className="h-14 w-12 object-cover border border-gray-200 rounded-sm bg-white" />
            <div>
              <h3 className="text-xs font-semibold text-gray-900 uppercase font-heading">{item.name}</h3>
              <p className="text-[11px] text-gray-500">Size: {item.size} | Qty: {item.qty}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-900">{formatMoney(item.price * item.qty, currency)}</span>
        </li>
      ))}
    </ul>

    <div className="border-t border-b border-gray-200 py-4">
      <label htmlFor="discount-code" className="block text-xs font-bold tracking-wider uppercase text-gray-700 mb-2">
        Promotional Code / Voucher
      </label>
      <div className="flex gap-2">
        <input id="discount-code" type="text" placeholder="e.g. PARIS10" value={discountInput}
          onChange={(e) => onDiscountInputChange(e.target.value.toUpperCase())}
          className="flex-1 border border-gray-300 p-2.5 text-xs focus:border-black focus:outline-none uppercase font-mono tracking-wider" />
        <button type="button" onClick={onApplyDiscount} disabled={applyingDiscount || !discountInput}
          className="bg-black text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer">
          {applyingDiscount ? '…' : 'Apply'}
        </button>
      </div>
      {discountError && <p className="mt-2 text-xs text-red-600 font-medium">{discountError}</p>}
      {discountSuccess && <p className="mt-2 text-xs text-green-700 font-medium">{discountSuccess}</p>}
    </div>

    <div className="space-y-2.5 text-xs text-gray-600 pt-2">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatMoney(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{shippingPrice === 0 ? <strong className="text-green-700">FREE</strong> : formatMoney(shippingPrice, currency)}</span>
      </div>
      {discount && (
        <div className="flex justify-between text-green-700 font-medium">
          <span>Discount ({discount.code})</span>
          <span>-{formatMoney(discount.discountAmount, currency)}</span>
        </div>
      )}
      <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm font-bold text-gray-900 uppercase">
        <span>Total</span>
        <span>{formatMoney(grandTotal, currency)}</span>
      </div>
      <p className="text-[10px] text-gray-400">Final prices, stock and discounts are confirmed when you place the order.</p>
    </div>
  </div>
);

export default OrderSummary;
