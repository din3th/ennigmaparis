
const AnnouncementTab = ({ formData, setFormData }) => (
  <>
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Top Announcement Bar
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Displays a sleek banner across the very top of the website for promotions, delivery offers, or notices.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showAnnouncement}
            onChange={(e) => setFormData({ ...formData, showAnnouncement: e.target.checked })}
            className="rounded text-black w-4 h-4"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {formData.showAnnouncement ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Live Preview Bar */}
      {formData.showAnnouncement && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            Live Preview:
          </label>
          <div className="bg-black text-white py-2 px-4 text-center text-xs tracking-widest uppercase font-medium">
            {formData.announcementText || 'Your announcement message goes here...'}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
          Announcement Message
        </label>
        <input
          type="text"
          value={formData.announcementText}
          onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
          placeholder="Complimentary Worldwide Express Delivery on Orders Over $250 • ENNIGMA PARIS"
          className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Supports delivery notices, holiday greetings, discount promotions, or VIP club invitations.
        </p>
      </div>
    </div>
  </>
);

export default AnnouncementTab;
