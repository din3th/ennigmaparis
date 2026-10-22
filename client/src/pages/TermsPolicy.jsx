import { useLocation, Link } from 'react-router-dom';

const TermsPolicy = () => {
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-sans">
      <div className="text-center pb-10 border-b border-gray-200">
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 mb-2 block">
          Legal & Compliance
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif uppercase tracking-widest text-gray-900 mb-3">
          {isPrivacy ? 'Privacy & Data Protection' : 'Terms of Service'}
        </h1>
        <p className="text-xs text-gray-400 font-mono">
          Last Revised: October 2026 • ENNIGMA PARIS Haute Couture
        </p>

        {/* Tab switcher */}
        <div className="flex justify-center gap-4 mt-6">
          <Link
            to="/privacy"
            className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-sm border ${
              isPrivacy ? 'bg-black text-white border-black' : 'text-gray-600 border-gray-200 hover:border-black'
            }`}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-sm border ${
              !isPrivacy ? 'bg-black text-white border-black' : 'text-gray-600 border-gray-200 hover:border-black'
            }`}
          >
            Terms of Service
          </Link>
        </div>
      </div>

      <div className="py-12 prose prose-sm max-w-none text-xs sm:text-sm text-gray-600 leading-relaxed font-sans space-y-8">
        {isPrivacy ? (
          <>
            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                1. Commitment to Client Confidentiality
              </h2>
              <p>
                At ENNIGMA PARIS, we uphold the highest standard of discretion and data protection for our esteemed international and Sri Lankan clientele. We collect only information necessary to ensure bespoke fulfillment, secure payments, and tailor your personalized shopping experience.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                2. Information We Collect
              </h2>
              <p>
                When you browse our collections, register an account, or finalize an order, we may collect:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal identification: Full name, email address, phone number.</li>
                <li>Delivery address: Street, city, postal code, and delivery instructions.</li>
                <li>Transactional history: Purchased items, dates, and encrypted payment references.</li>
                <li>Atelier correspondence: Messages sent to our customer concierge.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                3. Payment Security & Encryption
              </h2>
              <p>
                We do not store your complete credit card credentials on our servers. All digital transactions are processed through end-to-end encrypted PCI-DSS Level 1 compliant gateways (Stripe & PayHere).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                4. Data Sharing & Third Parties
              </h2>
              <p>
                We never sell, rent, or trade your personal data. Information is shared strictly with trusted logistics partners (courier drivers) and payment clearinghouses necessary to complete your order.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or purchasing from <strong>ennigmaparis.com</strong>, you agree to be bound by these Terms of Service and all applicable trade laws in Sri Lanka and international commerce jurisdictions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                2. Product Availability & Bespoke Craftsmanship
              </h2>
              <p>
                All pieces are offered subject to limited availability. Due to the high craftsmanship of our Parisian designs, minor hand-stitched characteristics may vary slightly, reflecting the authentic artisanal nature of each item.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                3. Pricing & Currency
              </h2>
              <p>
                All prices are stated in Sri Lankan Rupees (LKR) inclusive of applicable domestic taxes unless otherwise indicated. We reserve the right to modify pricing or correct inadvertent typographical errors prior to dispatch.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-serif font-bold uppercase tracking-wider text-gray-900">
                4. Intellectual Property
              </h2>
              <p>
                All visual imagery, typography, editorial photography, and garment silhouettes are the exclusive property of ENNIGMA PARIS. Unauthorized commercial reproduction or imitation is strictly prohibited.
              </p>
            </section>
          </>
        )}

        <div className="pt-8 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>ENNIGMA PARIS Legal Atelier</span>
          <Link to="/shop" className="text-black font-bold uppercase tracking-wider hover:underline">
            Return to Store →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPolicy;
