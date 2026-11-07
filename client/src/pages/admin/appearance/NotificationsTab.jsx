import { AlertCircle, CheckCircle2, Mail, MessageSquare, RefreshCw, Send } from 'lucide-react';

const NotificationsTab = ({ formData, handleSendTestNotification, setFormData, testResult, testingNotif }) => (
  <>
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-600 text-white rounded">
              Live Dispatcher
            </span>
            <span className="text-xs text-gray-500">Order Alerts to Owner & Manager</span>
          </div>
          <h2 className="text-lg font-serif font-bold text-gray-900 tracking-wide uppercase">
            Owner & Manager Real-Time Order Alerts
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            When a customer places an order or submits a bank transfer receipt, automated high-priority email and WhatsApp alerts are dispatched to the owner and manager simultaneously.
          </p>
        </div>

        {/* Test Notification Button */}
        <button
          type="button"
          onClick={handleSendTestNotification}
          disabled={testingNotif}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest rounded transition-all shadow-md disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          {testingNotif ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Dispatching Test Alerts...
            </>
          ) : (
            <>
              <Send size={14} />
              Send Test Alert Now
            </>
          )}
        </button>
      </div>

      {/* Test Result Feedback Box */}
      {testResult && (
        <div
          className={`p-4 rounded-lg border text-xs space-y-2 animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
          {testResult.emailStatus && (
            <div className="pl-6 text-[11px] text-gray-700">
              • <strong>Email Status:</strong> {testResult.emailStatus}
            </div>
          )}
          {testResult.telegramStatus && (
            <div className="pl-6 text-[11px] text-gray-700">
              • <strong>Telegram Status:</strong> <span className={testResult.telegramStatus.includes('success') ? 'text-emerald-700 font-bold' : 'text-gray-700'}>{testResult.telegramStatus}</span>
            </div>
          )}
          {testResult.waResults && testResult.waResults.length > 0 && (
            <div className="pl-6 space-y-1 text-[11px] text-gray-700">
              {testResult.waResults.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  <span>• <strong>WhatsApp ({r.recipient}):</strong> {r.phone} — {r.provider || (r.fallback ? 'Click-to-chat ready' : 'Processed')}</span>
                  {r.waLink && (
                    <a
                      href={r.waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold hover:text-emerald-900"
                    >
                      Open in WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. System Owner Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              System Owner Contact
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400" />
              Owner Email Address
            </label>
            <input
              type="email"
              value={formData.notificationSettings?.ownerEmail || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    ownerEmail: e.target.value,
                  },
                })
              }
              placeholder="owner@ennigmaparis.com"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Receives full executive PDF invoices, customer delivery details, and payment slips.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-emerald-600" />
              Owner WhatsApp Phone Number
            </label>
            <input
              type="text"
              value={formData.notificationSettings?.ownerPhone || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    ownerPhone: e.target.value,
                  },
                })
              }
              placeholder="+94 77 123 4567 or 0771234567"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Include country code (e.g. +94 for Sri Lanka). Receives instant WhatsApp order summaries.
            </p>
          </div>
        </div>

        {/* 2. System Manager Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Operations Manager Contact
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400" />
              Manager Email Address
            </label>
            <input
              type="email"
              value={formData.notificationSettings?.managerEmail || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    managerEmail: e.target.value,
                  },
                })
              }
              placeholder="manager@ennigmaparis.com"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Operations copy for packaging, fulfillment, and bank transfer validation.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-emerald-600" />
              Manager WhatsApp Phone Number
            </label>
            <input
              type="text"
              value={formData.notificationSettings?.managerPhone || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    managerPhone: e.target.value,
                  },
                })
              }
              placeholder="+94 71 987 6543 or 0719876543"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Instant mobile notification for immediate warehouse packing & fulfillment.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Channels & Automation Preferences */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b pb-3">
          3. Channel Controls & Provider
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.notificationSettings?.enableEmailAlerts !== false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    enableEmailAlerts: e.target.checked,
                  },
                })
              }
              className="mt-0.5 rounded text-black w-4 h-4"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                Email Notifications
              </span>
              <span className="text-[11px] text-gray-500">
                Dispatches high-priority order invoice & customer details via SMTP.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.notificationSettings?.enableWhatsAppAlerts !== false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    enableWhatsAppAlerts: e.target.checked,
                  },
                })
              }
              className="mt-0.5 rounded text-black w-4 h-4"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                WhatsApp Notifications
              </span>
              <span className="text-[11px] text-gray-500">
                Sends structured WhatsApp messages with items, total, and address.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-sky-200 bg-sky-50/50 rounded-lg cursor-pointer hover:bg-sky-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.notificationSettings?.enableTelegramAlerts !== false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationSettings: {
                    ...formData.notificationSettings,
                    enableTelegramAlerts: e.target.checked,
                  },
                })
              }
              className="mt-0.5 rounded text-sky-600 w-4 h-4"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                  Telegram Push Alerts
                </span>
                <span className="px-1.5 py-0.2 text-[9px] bg-sky-500 text-white rounded font-bold">
                  ACTIVE
                </span>
              </div>
              <span className="text-[11px] text-gray-600">
                Bot: @Ennigma_Paris_Admin_Bot • Real-time alerts directly to your device.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            WhatsApp Dispatch Gateway
          </label>
          <select
            value={formData.notificationSettings?.whatsappProvider || 'twilio'}
            onChange={(e) =>
              setFormData({
                ...formData,
                notificationSettings: {
                  ...formData.notificationSettings,
                  whatsappProvider: e.target.value,
                },
              })
            }
            className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none bg-white"
          >
            <option value="twilio">Twilio WhatsApp API (Automated Cloud Delivery)</option>
            <option value="callmebot">CallMeBot WhatsApp API (Free Personal Gateway)</option>
            <option value="ultramsg">UltraMsg WhatsApp Gateway</option>
            <option value="clicktochat">Direct WhatsApp Click-to-Chat Link Mode</option>
          </select>
        </div>
      </div>
    </div>
  </>
);

export default NotificationsTab;
