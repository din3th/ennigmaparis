import { useState } from 'react';
import { X, Ruler, Sparkles, Check, Info } from 'lucide-react';

const SIZE_CHART = [
  { uk: 'UK 6', us: 'US 2', eu: '34 EU', it: '38 IT', int: 'XS', bustCm: 80, waistCm: 62, hipCm: 86, bustIn: 31.5, waistIn: 24.5, hipIn: 34.0 },
  { uk: 'UK 8', us: 'US 4', eu: '36 EU', it: '40 IT', int: 'S',  bustCm: 85, waistCm: 67, hipCm: 91, bustIn: 33.5, waistIn: 26.5, hipIn: 36.0 },
  { uk: 'UK 10', us: 'US 6', eu: '38 EU', it: '42 IT', int: 'M', bustCm: 90, waistCm: 72, hipCm: 96, bustIn: 35.5, waistIn: 28.5, hipIn: 38.0 },
  { uk: 'UK 12', us: 'US 8', eu: '40 EU', it: '44 IT', int: 'L', bustCm: 95, waistCm: 77, hipCm: 101, bustIn: 37.5, waistIn: 30.5, hipIn: 40.0 },
  { uk: 'UK 14', us: 'US 10', eu: '42 EU', it: '46 IT', int: 'XL', bustCm: 100, waistCm: 82, hipCm: 106, bustIn: 39.5, waistIn: 32.5, hipIn: 42.0 },
  { uk: 'UK 16', us: 'US 12', eu: '44 EU', it: '48 IT', int: 'XXL', bustCm: 105, waistCm: 87, hipCm: 111, bustIn: 41.5, waistIn: 34.5, hipIn: 44.0 },
  { uk: 'UK 18', us: 'US 14', eu: '46 EU', it: '50 IT', int: '3XL', bustCm: 110, waistCm: 92, hipCm: 116, bustIn: 43.5, waistIn: 36.5, hipIn: 46.0 },
];

const SizeGuideModal = ({ isOpen, onClose, onSelectSize, currentSelectedSize, availableSizes = [] }) => {
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' or 'recommender'

  // Recommender input state
  const [userBust, setUserBust] = useState('');
  const [userWaist, setUserWaist] = useState('');
  const [userHips, setUserHips] = useState('');
  const [recommendedSize, setRecommendedSize] = useState(null);

  if (!isOpen) return null;

  const handleCalculateRecommendation = (e) => {
    e.preventDefault();
    const bustNum = parseFloat(userBust);
    const waistNum = parseFloat(userWaist);

    if (!bustNum && !waistNum) return;

    // Convert to inches for consistent matching if user entered in cm
    const bustIn = unit === 'cm' && bustNum ? bustNum / 2.54 : bustNum;
    const waistIn = unit === 'cm' && waistNum ? waistNum / 2.54 : waistNum;

    let closest = null;
    let minDiff = Infinity;

    SIZE_CHART.forEach((row) => {
      let diff = 0;
      let count = 0;
      if (bustIn) {
        diff += Math.abs(row.bustIn - bustIn);
        count++;
      }
      if (waistIn) {
        diff += Math.abs(row.waistIn - waistIn);
        count++;
      }
      const avgDiff = diff / count;
      if (avgDiff < minDiff) {
        minDiff = avgDiff;
        closest = row;
      }
    });

    if (closest) {
      // Find matching size among product's available sizes if possible
      let matchedSize = closest.uk;
      if (availableSizes.length > 0) {
        const directMatch = availableSizes.find(
          (s) => s.toLowerCase() === closest.uk.toLowerCase() ||
                 s.toLowerCase() === closest.int.toLowerCase() ||
                 s.toLowerCase().includes(closest.uk.toLowerCase())
        );
        if (directMatch) matchedSize = directMatch;
      }
      setRecommendedSize({
        row: closest,
        matchedSize,
        confidence: minDiff < 1.5 ? 'Perfect Match' : 'Recommended Fit',
      });
    }
  };

  const handleApplySize = (size) => {
    if (onSelectSize) {
      onSelectSize(size);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white max-w-3xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-black p-1.5 transition-colors cursor-pointer rounded-full hover:bg-gray-100"
          aria-label="Close Size Guide"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center pb-5 border-b border-gray-100">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 block mb-1">
            Atelier Measurements &amp; Fit Studio
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif uppercase tracking-widest text-gray-900">
            ENNIGMA PARIS Size Guide
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Our luxury silhouettes are tailored to standard British &amp; French couture sizing for flawless proportion and drape.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === 'chart'
                  ? 'bg-black text-white border-black'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              Size Chart &amp; Conversions
            </button>
            <button
              onClick={() => setActiveTab('recommender')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                activeTab === 'recommender'
                  ? 'bg-black text-white border-black'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <Sparkles size={13} className="text-amber-500" /> Find My Size Calculator
            </button>
          </div>
        </div>

        {/* TAB 1: SIZING CHART */}
        {activeTab === 'chart' && (
          <div className="py-5 space-y-6">
            {/* Unit Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Display Measurements In:</span>
              <div className="inline-flex rounded-sm p-0.5 bg-gray-100 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer rounded-xs ${
                    unit === 'in' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Inches (in)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer rounded-xs ${
                    unit === 'cm' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Centimeters (cm)
                </button>
              </div>
            </div>

            {/* Sizing Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase font-bold tracking-widest text-gray-600">
                    <th className="py-3 px-3">UK / AUS</th>
                    <th className="py-3 px-3">US / CAN</th>
                    <th className="py-3 px-3">EU / FR</th>
                    <th className="py-3 px-3">IT</th>
                    <th className="py-3 px-3">Int'l</th>
                    <th className="py-3 px-3">Bust ({unit})</th>
                    <th className="py-3 px-3">Waist ({unit})</th>
                    <th className="py-3 px-3">Hips ({unit})</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-xs">
                  {SIZE_CHART.map((row) => {
                    const isSelected = currentSelectedSize === row.uk || currentSelectedSize === row.int;
                    return (
                      <tr 
                        key={row.uk} 
                        className={`transition-colors ${isSelected ? 'bg-amber-50/70 font-semibold' : 'hover:bg-gray-50'}`}
                      >
                        <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-1.5">
                          {row.uk}
                          {isSelected && <span className="text-[9px] bg-black text-white px-1.5 py-0.2 rounded-xs">Current</span>}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{row.us}</td>
                        <td className="py-3 px-3 text-gray-600">{row.eu}</td>
                        <td className="py-3 px-3 text-gray-600">{row.it}</td>
                        <td className="py-3 px-3 font-semibold text-gray-800">{row.int}</td>
                        <td className="py-3 px-3 font-mono">
                          {unit === 'in' ? `${row.bustIn}"` : `${row.bustCm} cm`}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {unit === 'in' ? `${row.waistIn}"` : `${row.waistCm} cm`}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {unit === 'in' ? `${row.hipIn}"` : `${row.hipCm} cm`}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleApplySize(row.uk)}
                            className="text-[11px] font-bold uppercase tracking-wider text-black hover:underline cursor-pointer"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* How to Measure Atelier Section */}
            <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-800">
                <Ruler size={14} /> How to Take Your Measurements
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="p-2.5 bg-white rounded-xs border border-gray-100">
                  <strong className="block text-gray-900 mb-1">1. Bust</strong>
                  Measure around the fullest part of your bust, keeping the measuring tape parallel to the floor and comfortably snug.
                </div>
                <div className="p-2.5 bg-white rounded-xs border border-gray-100">
                  <strong className="block text-gray-900 mb-1">2. Natural Waist</strong>
                  Measure around the narrowest part of your torso, typically 1 to 2 inches above your navel.
                </div>
                <div className="p-2.5 bg-white rounded-xs border border-gray-100">
                  <strong className="block text-gray-900 mb-1">3. Hips</strong>
                  Stand with feet together and measure around the fullest circumference of your hips and seat.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIND MY SIZE RECOMMENDER */}
        {activeTab === 'recommender' && (
          <div className="py-5 space-y-6">
            <div className="bg-stone-50 border border-stone-200 p-5 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Atelier Intelligent Fit Recommender
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Enter your body measurements below. Our couture sizing algorithm will calculate your exact ENNIGMA Paris silhouette match.
              </p>

              <form onSubmit={handleCalculateRecommendation} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-stone-200">
                  <span className="text-xs font-semibold text-gray-700">Measurement Units:</span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="recUnit"
                      checked={unit === 'in'}
                      onChange={() => setUnit('in')}
                      className="accent-black"
                    />
                    Inches (in)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="recUnit"
                      checked={unit === 'cm'}
                      onChange={() => setUnit('cm')}
                      className="accent-black"
                    />
                    Centimeters (cm)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bust Circumference *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder={unit === 'in' ? 'e.g. 35.5' : 'e.g. 90'}
                      value={userBust}
                      onChange={(e) => setUserBust(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 text-xs focus:border-black focus:outline-none bg-white rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Natural Waist *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder={unit === 'in' ? 'e.g. 28.5' : 'e.g. 72'}
                      value={userWaist}
                      onChange={(e) => setUserWaist(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 text-xs focus:border-black focus:outline-none bg-white rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Hips (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unit === 'in' ? 'e.g. 38.0' : 'e.g. 96'}
                      value={userHips}
                      onChange={(e) => setUserHips(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 text-xs focus:border-black focus:outline-none bg-white rounded-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
                >
                  Calculate My Recommended Size
                </button>
              </form>
            </div>

            {/* Recommendation Result Card */}
            {recommendedSize && (
              <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-sm animate-fadeIn space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-xs mb-1">
                      <Check size={12} /> {recommendedSize.confidence}
                    </span>
                    <h4 className="text-xl font-serif font-bold text-gray-900 mt-1">
                      We Recommend: <span className="underline decoration-black">{recommendedSize.matchedSize}</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Equivalent to: <strong>{recommendedSize.row.eu}</strong> &bull; <strong>{recommendedSize.row.us}</strong> &bull; <strong>{recommendedSize.row.int}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplySize(recommendedSize.matchedSize)}
                    className="bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Select {recommendedSize.matchedSize} &amp; Close
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-xs border border-emerald-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Atelier Bust</span>
                    <span className="font-mono font-bold text-gray-800">
                      {unit === 'in' ? `${recommendedSize.row.bustIn}"` : `${recommendedSize.row.bustCm} cm`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Atelier Waist</span>
                    <span className="font-mono font-bold text-gray-800">
                      {unit === 'in' ? `${recommendedSize.row.waistIn}"` : `${recommendedSize.row.waistCm} cm`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Atelier Hips</span>
                    <span className="font-mono font-bold text-gray-800">
                      {unit === 'in' ? `${recommendedSize.row.hipIn}"` : `${recommendedSize.row.hipCm} cm`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Atelier Fit Advice */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 text-xs text-gray-600 rounded-sm">
              <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 block mb-0.5">Between Two Sizes?</strong>
                If your measurements fall between two sizes, we advise choosing the larger size if you prefer a relaxed, fluid drape, or the smaller size for a sculpted, figure-hugging silhouette.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Assistance needed? Contact <a href="mailto:concierge@ennigmaparis.com" className="underline text-gray-700">concierge@ennigmaparis.com</a>
          </span>
          <button
            onClick={onClose}
            className="border border-gray-300 px-6 py-2 text-xs font-bold uppercase tracking-wider hover:border-black transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
