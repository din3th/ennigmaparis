import { Link } from 'react-router-dom';
import { Sparkles, Compass, Scissors, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="font-sans">
      {/* Hero Editorial */}
      <div className="relative h-[65vh] w-full bg-black overflow-hidden flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
          alt="Ennigma Paris Atelier"
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-300 block mb-2">
            Haute Couture Heritage
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif tracking-[0.2em] uppercase font-bold mb-4">
            The Atelier Story
          </h1>
          <p className="text-sm sm:text-base text-gray-200 font-light tracking-wide leading-relaxed">
            Bridging classic Parisian silhouettes with modern minimalist precision.
          </p>
        </div>
      </div>

      {/* Main Philosophy */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Our Identity</span>
            <h2 className="text-3xl font-serif tracking-tight text-gray-900 mt-2 mb-6">
              Timeless Elegance, Quiet Confidence
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
              <p>
                Founded with a singular vision, <strong>ENNIGMA PARIS</strong> stands at the intersection of European haute couture design and understated everyday luxury. We believe that true sophistication whispers rather than shouts.
              </p>
              <p>
                Every garment is conceptualized with architectural precision, utilizing carefully sourced natural fabrics, Italian crepes, and structured silks designed to flatter with effortless grace.
              </p>
              <p>
                From our roots in Paris to our boutique flagship atelier in Colombo, Sri Lanka, we craft limited-edition drops that honor timeless design over fleeting trends.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden rounded-sm shadow-xl">
            <img
              src="https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1200&auto=format&fit=crop"
              alt="Model in Ennigma gown"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Pillars */}
        <div className="mt-24 pt-16 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <Scissors size={28} className="mx-auto text-gray-800 mb-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Bespoke Precision</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tailored drape lines crafted with artisanal seams, ensuring impeccable comfort across all day and evening wear.
            </p>
          </div>
          <div className="p-6">
            <Sparkles size={28} className="mx-auto text-gray-800 mb-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Conscious Luxury</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Small batch releases to avoid overproduction. Every thread is selected for longevity and graceful aging.
            </p>
          </div>
          <div className="p-6">
            <Award size={28} className="mx-auto text-gray-800 mb-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Parisian Heritage</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Rooted in the sartorial craftsmanship and timeless aesthetic of Parisian haute couture.
            </p>
          </div>
        </div>

        {/* Boutique Location */}
        <div className="mt-20 bg-gray-50 p-8 sm:p-12 border border-gray-100 rounded-sm max-w-xl mx-auto text-center">
          <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-6">
            Flagship Boutique
          </h3>
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
              Colombo Flagship Boutique
            </span>
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              2a De Fonseka Rd, Colombo 00500<br />
              Western Province, Sri Lanka<br />
              <span className="font-mono text-gray-900 block mt-2 font-bold">+94 76 864 5555</span>
              <span className="font-mono text-gray-700 block mt-1">concierge@ennigmaparis.com</span>
              <span className="text-gray-500 block mt-2 text-[11px]">Hours: Monday – Sunday, 10:00 AM – 8:00 PM</span>
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/shop"
            className="inline-block bg-black text-white px-10 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gray-800 transition-colors shadow-md"
          >
            Explore The Current Collection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
