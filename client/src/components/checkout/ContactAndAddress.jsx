const inputClass = 'w-full border border-gray-200 p-3 text-sm focus:border-black focus:outline-none transition-colors';

const PROVINCES = [
  ['Western', 'Western Province'],
  ['Central', 'Central Province'],
  ['Southern', 'Southern Province'],
  ['North Western', 'North Western Province'],
  ['North Central', 'North Central Province'],
  ['Sabaragamuwa', 'Sabaragamuwa Province'],
  ['Uva', 'Uva Province'],
  ['Eastern', 'Eastern Province'],
  ['Northern', 'Northern Province'],
];

export const SectionHeading = ({ step, children }) => (
  <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center">{step}</span>
    {children}
  </h2>
);

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export const ContactDetails = ({ contact, onChange }) => (
  <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
    <SectionHeading step={1}>Contact Details</SectionHeading>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Email Address *" className="sm:col-span-2">
        <input type="email" name="email" placeholder="email@example.com" value={contact.email} onChange={onChange} required className={inputClass} />
      </Field>
      <Field label="Full Name *">
        <input type="text" name="name" placeholder="First & Last Name" value={contact.name} onChange={onChange} required className={inputClass} />
      </Field>
      <Field label="Phone Number *">
        <input type="tel" name="phone" placeholder="+94 7X XXX XXXX" value={contact.phone} onChange={onChange} required className={inputClass} />
      </Field>
    </div>
  </div>
);

export const ShippingAddress = ({ address, onChange }) => (
  <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
    <SectionHeading step={2}>Shipping Address</SectionHeading>
    <div className="space-y-4">
      <Field label="Street Address *">
        <input type="text" name="street" placeholder="House number and street name" value={address.street} onChange={onChange} required className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City *">
          <input type="text" name="city" placeholder="City" value={address.city} onChange={onChange} required className={inputClass} />
        </Field>
        <Field label="State / Province *">
          <select name="state" value={address.state || 'Western'} onChange={onChange} required className={`${inputClass} bg-white font-medium`}>
            {PROVINCES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Postal Code *">
          <input type="text" name="zip" placeholder="Zip Code" value={address.zip} onChange={onChange} required className={inputClass} />
        </Field>
        <Field label="Country">
          <input type="text" name="country" value={address.country} readOnly className="w-full border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500" />
        </Field>
      </div>
    </div>
  </div>
);
