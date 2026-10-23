import { useState, useRef } from 'react';
import { X, Printer, Truck, ShieldAlert, CheckCircle2, QrCode } from 'lucide-react';

const COURIER_PARTNERS = [
  { id: 'promptx', name: 'PromptX Courier Express', hotline: '+94 11 755 5555' },
  { id: 'koombiyo', name: 'Koombiyo Delivery', hotline: '+94 11 744 4440' },
  { id: 'dhl', name: 'DHL Express Global', hotline: '+94 11 479 8888' },
  { id: 'domex', name: 'Domex Courier Express', hotline: '+94 11 775 9759' },
  { id: 'pronto', name: 'Pronto Lanka Express', hotline: '+94 11 230 4050' },
];

const CourierWaybillModal = ({ isOpen, onClose, order }) => {
  const [selectedCourier, setSelectedCourier] = useState('promptx');
  const [customTrackingNo, setCustomTrackingNo] = useState('');
  const [courierNotes, setCourierNotes] = useState('Handle with extreme care. Haute couture luxury garment inside. Do not bend or crush.');
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const currentCourier = COURIER_PARTNERS.find((c) => c.id === selectedCourier) || COURIER_PARTNERS[0];
  const waybillNo = customTrackingNo || `EP-WB-${(order._id || '').slice(-8).toUpperCase()}`;
  const isCOD = order.paymentMethod?.toLowerCase().includes('cash') || order.paymentMethod?.toLowerCase().includes('cod');
  const isPaid = order.paymentStatus === 'Completed';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-waybill-content, #printable-waybill-content * {
            visibility: visible !important;
          }
          #printable-waybill-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="bg-white max-w-4xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative border border-gray-100 max-h-[94vh] overflow-y-auto font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-gray-200 gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">
              Logistics &amp; Courier Dispatch Center
            </span>
            <h2 className="text-xl font-serif font-bold text-gray-900 mt-0.5">
              Printable Dispatch Waybill &amp; Consignment Slip
            </h2>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} /> 1-Click Print Waybill
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Courier Config Bar */}
        <div className="no-print bg-gray-50 border border-gray-200 p-4 rounded-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Select Courier Partner
            </label>
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="w-full border border-gray-300 p-2 text-xs bg-white focus:border-black focus:outline-none rounded-xs font-medium"
            >
              {COURIER_PARTNERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Custom AWB / Tracking No. (Optional)
            </label>
            <input
              type="text"
              placeholder={`Default: ${waybillNo}`}
              value={customTrackingNo}
              onChange={(e) => setCustomTrackingNo(e.target.value)}
              className="w-full border border-gray-300 p-2 text-xs bg-white focus:border-black focus:outline-none rounded-xs font-mono"
            >
            </input>
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
              Delivery Special Instructions
            </label>
            <input
              type="text"
              value={courierNotes}
              onChange={(e) => setCourierNotes(e.target.value)}
              className="w-full border border-gray-300 p-2 text-xs bg-white focus:border-black focus:outline-none rounded-xs"
            />
          </div>
        </div>

        {/* ACTUAL PRINTABLE WAYBILL SLIP CONTAINER */}
        <div 
          id="printable-waybill-content" 
          ref={printAreaRef}
          className="border-2 border-black p-6 bg-white text-black font-sans space-y-5"
        >
          {/* Top Bar: Brand, Barcode, Consignment Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-black gap-4">
            <div>
              <h1 className="text-2xl font-serif font-black tracking-widest uppercase">
                ENNIGMA PARIS
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gray-600 block">
                Official Dispatch Waybill &bull; Courier Consignment Note
              </span>
              <p className="text-[11px] text-gray-600 font-mono mt-1">
                Order Reference: <strong>#{order._id}</strong> &bull; Date: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB')}
              </p>
            </div>

            {/* Generated Barcode Display */}
            <div className="text-right flex flex-col items-end">
              <div className="bg-black text-white px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-widest inline-block mb-1">
                {currentCourier.name}
              </div>
              {/* Pseudo Barcode Representation */}
              <div className="flex items-center gap-[2px] h-11 bg-white p-1 border border-black">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                  <div key={idx} className="bg-black h-full" style={{ width: `${w * 1.5}px` }}></div>
                ))}
              </div>
              <span className="font-mono text-xs font-bold tracking-widest text-black mt-0.5">
                *{waybillNo}*
              </span>
            </div>
          </div>

          {/* COD / Payment Warning Notice Banner */}
          <div className={`p-4 border-2 ${
            isCOD
              ? 'bg-amber-100 border-amber-600 text-amber-950'
              : isPaid
              ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
              : 'bg-gray-100 border-black text-black'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck size={20} className="flex-shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">
                    {isCOD ? 'COLLECTION TYPE: CASH ON DELIVERY (COD)' : 'COLLECTION TYPE: PREPAID SHIPMENT'}
                  </span>
                  <p className="text-xs">
                    {isCOD 
                      ? 'Rider must collect the exact total cash amount below BEFORE handing the parcel to the customer.'
                      : 'Parcel has already been paid online / bank transfer. DO NOT COLLECT ANY CASH FROM RECIPIENT.'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-600 block">
                  {isCOD ? 'Amount to Collect' : 'Total Value'}
                </span>
                <span className="text-xl font-mono font-black">
                  LKR {(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Sender & Consignee Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shipper (Consignor) */}
            <div className="border border-black p-4 bg-gray-50/50">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block mb-1">
                From (Consignor / Shipper):
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                ENNIGMA PARIS ATELIER
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mt-1">
                2a De Fonseka Rd, Colombo 00500<br />
                Western Province, Sri Lanka<br />
                Atelier Hotline: <strong>+94 71 146 1306</strong><br />
                Email: concierge@ennigmaparis.com
              </p>
            </div>

            {/* Recipient (Consignee) */}
            <div className="border-2 border-black p-4 bg-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-black bg-black text-white px-2 py-0.5 inline-block mb-1">
                Deliver To (Consignee):
              </span>
              <h3 className="text-base font-bold text-black uppercase">
                {order.guestName || (order.user && order.user.name) || 'Valued Customer'}
              </h3>
              <p className="text-xs text-black font-semibold mt-1">
                Contact Phone: <strong className="text-sm font-mono underline">{order.guestPhone || (order.user && order.user.phone) || 'Not Provided'}</strong>
              </p>
              <p className="text-xs text-gray-800 leading-relaxed mt-1 whitespace-pre-line font-medium">
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state || ''} {order.shippingAddress?.zip || ''}<br />
                {order.shippingAddress?.country || 'Sri Lanka'}
              </p>
              {order.guestEmail && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Email: {order.guestEmail || (order.user && order.user.email)}
                </p>
              )}
            </div>
          </div>

          {/* Special Instructions & Handling */}
          <div className="border border-black p-3 bg-stone-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-black" />
              <span className="font-bold uppercase tracking-wider text-[11px]">Special Instructions:</span>
              <span className="text-gray-800 italic">{courierNotes}</span>
            </div>
            <span className="text-[10px] uppercase font-bold border border-black px-2 py-0.5">
              FRAGILE APPAREL
            </span>
          </div>

          {/* Manifest / Order Items */}
          <div className="border border-black">
            <div className="bg-black text-white px-3 py-2 text-[10px] uppercase font-bold tracking-widest flex justify-between">
              <span>Parcel Manifest ({order.items?.length || 0} Items)</span>
              <span>Total Units: {order.items?.reduce((sum, i) => sum + (i.qty || 1), 0) || 1}</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 text-[10px] uppercase font-bold text-gray-700">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Size</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-sans">
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-black">{item.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono">{item.size || 'M'}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.qty || 1}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      LKR {(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      LKR {((item.price || 0) * (item.qty || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Proof of Delivery Blocks */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t-2 border-black text-center text-xs">
            <div className="border border-gray-300 p-3 flex flex-col justify-between h-24">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Atelier Fulfillment Officer
              </span>
              <div className="border-t border-dashed border-gray-400 pt-1 text-[10px] text-gray-500">
                Signature &amp; Date
              </div>
            </div>

            <div className="border border-gray-300 p-3 flex flex-col justify-between h-24">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Courier Rider Pickup
              </span>
              <div className="border-t border-dashed border-gray-400 pt-1 text-[10px] text-gray-500">
                Rider Name / Vehicle / Sign
              </div>
            </div>

            <div className="border border-black p-3 flex flex-col justify-between h-24 bg-gray-50/50">
              <span className="text-[10px] uppercase font-bold text-black block">
                Customer Proof of Delivery
              </span>
              <div className="border-t border-dashed border-black pt-1 text-[10px] text-black font-semibold">
                Recipient Signature &amp; Date
              </div>
            </div>
          </div>

          {/* Bottom Micro Notice */}
          <div className="pt-2 text-[9px] text-gray-400 text-center font-mono">
            ENNIGMA PARIS COUTURE &bull; WORLDWIDE ATELIER DISPATCH SYSTEM &bull; GENERATED AUTOMATICALLY
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print pt-6 flex justify-between items-center border-t border-gray-200 mt-6">
          <span className="text-xs text-gray-500">
            Waybill ready for thermal or A4 printing. Courier hotline: <strong>{currentCourier.hotline}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Printer size={14} /> Print Waybill
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierWaybillModal;
