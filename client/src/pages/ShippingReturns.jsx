import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, Box, HelpCircle } from 'lucide-react';

const ShippingReturns = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-sans">
      <div className="text-center pb-10 border-b border-gray-200">
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 mb-2 block">
          Client Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-widest text-gray-900 mb-3">
          Shipping & Returns
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto font-sans leading-relaxed">
          Complimentary white-glove packaging, expedited courier delivery, and flexible 14-day exchange privileges.
        </p>
      </div>

      <div className="py-12 space-y-12">
        {/* Shipping Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
              <Truck size={18} />
            </div>
            <h2 className="text-lg font-serif uppercase tracking-wider text-gray-900">
              Delivery Services & Timelines
            </h2>
          </div>
          <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 space-y-3 text-xs text-gray-600 leading-relaxed font-sans">
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="font-bold text-gray-900">Colombo Express (Same / Next Day)</span>
              <span className="font-mono text-black font-bold">Complimentary over LKR 15,000</span>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="font-bold text-gray-900">Islandwide Courier (Sri Lanka 2–3 Days)</span>
              <span className="font-mono text-black">LKR 450 (or Free for VIP Orders)</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="font-bold text-gray-900">International Courier (DHL Express 3–6 Days)</span>
              <span className="font-mono text-black">Calculated at live checkout</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-sans">
            All shipments require a signature upon delivery. You will receive an SMS and tracking email with real-time GPS coordinates as soon as your atelier package is dispatched.
          </p>
        </section>

        {/* Packaging Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
              <Box size={18} />
            </div>
            <h2 className="text-lg font-serif uppercase tracking-wider text-gray-900">
              Luxury Atelier Packaging
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-sans">
            Every garment from <strong>ENNIGMA PARIS</strong> arrives wrapped in acid-free Parisian tissue paper, encased inside our signature matte black embossed keepsake box, and tied with a satin ribbon. Gift messages may be added at checkout at no additional cost.
          </p>
        </section>

        {/* Returns Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <h2 className="text-lg font-serif uppercase tracking-wider text-gray-900">
              14-Day Exchange & Return Policy
            </h2>
          </div>
          <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 space-y-3 text-xs text-gray-600 leading-relaxed font-sans">
            <p>
              We want you to be entirely captivated by your ENNIGMA purchase. We accept returns and size exchanges within <strong>14 days of delivery</strong> provided that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>The piece is unworn, unwashed, and in pristine original condition.</li>
              <li>All original fabric and security tags remain attached.</li>
              <li>Returned in the original protective presentation packaging.</li>
            </ul>
            <p className="pt-2">
              For Colombo collections, our courier can pick up the exchange item directly from your address. For store credits or card refunds, processing takes 3–5 business days following atelier inspection.
            </p>
          </div>
        </section>

        {/* Contact Support */}
        <section className="border-t border-gray-200 pt-8 text-center space-y-3">
          <HelpCircle size={24} className="mx-auto text-gray-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-900">
            Need Personal Assistance?
          </h3>
          <p className="text-xs text-gray-500 font-sans max-w-sm mx-auto">
            Our atelier concierges are available 7 days a week to assist with order tracking, sizing questions, or exchange requests.
          </p>
          <div className="pt-2 font-mono text-xs font-bold text-gray-900">
            Call or WhatsApp: +94 76 864 5555 &nbsp;|&nbsp; concierge@ennigmaparis.com
          </div>
          <div className="pt-4">
            <Link
              to="/shop"
              className="inline-block bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShippingReturns;
