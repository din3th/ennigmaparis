import { Building2 } from 'lucide-react';
import { SectionHeading } from './ContactAndAddress';
import BankTransferPanel from './BankTransferPanel';

const OPTIONS = [
  { value: 'COD', title: 'Cash on Delivery (COD)', description: 'Pay in cash when your package is delivered.' },
  {
    value: 'Stripe',
    title: 'Credit / Debit Card (Stripe)',
    description: 'You will be redirected to Stripe’s secure checkout to enter your card. We never see your card details.',
    badges: ['VISA', 'MC', 'AMEX'],
  },
  { value: 'PayHere', title: 'PayHere (Online Banking & Cards)', description: 'You will be redirected to PayHere’s secure checkout.' },
];

const selectedClass = (on) =>
  on ? 'border-black bg-gray-50/50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300';

const PaymentOptions = ({ method, onMethodChange, bankTransferProps }) => (
  <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
    <SectionHeading step={3}>Payment Options</SectionHeading>
    <div className="space-y-4">
      <div className={`border rounded-sm transition-all ${method === 'Bank Transfer' ? 'border-black bg-white ring-1 ring-black shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
        <label className="flex items-start p-4 cursor-pointer">
          <input type="radio" name="payment" value="Bank Transfer" checked={method === 'Bank Transfer'}
            onChange={(e) => onMethodChange(e.target.value)} className="mt-1 h-4 w-4 accent-black cursor-pointer" />
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 tracking-wide flex items-center gap-2">
                <Building2 size={16} /> Direct Bank Fund Transfer
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-black text-white rounded-xs">Manual Verification</span>
            </div>
            <span className="block text-xs text-gray-500 mt-1">Transfer directly to our account and attach the payment slip.</span>
          </div>
        </label>
        {method === 'Bank Transfer' && <BankTransferPanel {...bankTransferProps} />}
      </div>

      {OPTIONS.map((opt) => (
        <label key={opt.value} className={`flex items-start p-4 border rounded-sm cursor-pointer transition-all ${selectedClass(method === opt.value)}`}>
          <input type="radio" name="payment" value={opt.value} checked={method === opt.value}
            onChange={(e) => onMethodChange(e.target.value)} className="mt-1 h-4 w-4 accent-black" />
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-semibold text-gray-900">{opt.title}</span>
              {opt.badges && (
                <div className="flex gap-1 text-[10px] font-bold text-gray-400">
                  {opt.badges.map((b) => <span key={b} className="border px-1 border-gray-200">{b}</span>)}
                </div>
              )}
            </div>
            <span className="block text-xs text-gray-500 mt-0.5">{opt.description}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
);

export default PaymentOptions;
