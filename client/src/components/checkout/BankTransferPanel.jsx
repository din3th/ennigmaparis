import { useRef, useState } from 'react';
import axios from 'axios';
import { Copy, Check, UploadCloud, FileText, AlertCircle, CheckCircle2, X, Eye, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { formatMoney } from '../../hooks/useApi';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

const BANK = {
  bank: 'Commercial Bank of Ceylon',
  accountName: 'ENNIGMA PARIS (PVT) LTD',
  accountNumber: '80123456789012',
  accountDisplay: '8012 3456 7890 12',
  branch: 'Colombo Flagship / Cinnamon Gardens (035)',
  swift: 'CCBCLKX',
};

const CopyButton = ({ value, id, copied, onCopy, children, className }) => (
  <button type="button" onClick={() => onCopy(value, id)} className={className}>
    {copied === id ? <><Check size={13} className="text-emerald-500" /> Copied!</> : children}
  </button>
);

/**
 * Bank details and slip upload. The slip must upload successfully to the
 * server; there is no client-side fallback, so orders always reference a
 * stored file.
 */
const BankTransferPanel = ({ grandTotal, currency, reference, receipt, onReceiptChange }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext) || !(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setError('Only PDF documents or JPG, PNG and WEBP images are allowed.');
      return resetInput();
    }
    if (file.size > MAX_BYTES) {
      setError('File exceeds the 8MB limit.');
      return resetInput();
    }

    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const { data } = await axios.post(`${API_BASE_URL}/upload/receipt`, formData);
      onReceiptChange({
        url: data.url,
        filename: data.filename,
        originalName: data.originalName,
        fileType: data.fileType,
        size: data.size,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setPreview(null);
      onReceiptChange(null);
      resetInput();
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    setPreview(null);
    setError(null);
    onReceiptChange(null);
    resetInput();
  };

  return (
    <div className="p-5 pt-0 border-t border-gray-100 bg-gray-50/50">
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-sm p-3.5 mb-5 mt-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-bold block uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">Payment Instructions</span>
            Please transfer the exact amount of <strong className="font-mono font-bold text-black">{formatMoney(grandTotal, currency)}</strong> to the bank details below and attach your transfer confirmation slip (PDF or image). Your pieces are reserved and processed once the payment is verified.
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">ENNIGMA Atelier Bank Account</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Beneficiary Bank</span>
            <span className="font-semibold text-gray-900 text-sm">{BANK.bank}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Account Name</span>
            <span className="font-semibold text-gray-900 text-sm">{BANK.accountName}</span>
          </div>
          <div className="sm:col-span-2 bg-gray-50 p-2.5 rounded border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Account Number</span>
              <span className="font-mono font-bold text-base text-gray-900 tracking-wider">{BANK.accountDisplay}</span>
            </div>
            <CopyButton value={BANK.accountNumber} id="acc" copied={copied} onCopy={copy}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-gray-800 transition-colors rounded-xs cursor-pointer">
              <Copy size={13} /> Copy Number
            </CopyButton>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Branch</span>
            <span className="font-medium text-gray-800">{BANK.branch}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">SWIFT / BIC Code</span>
              <span className="font-mono font-bold text-gray-900">{BANK.swift}</span>
            </div>
            <CopyButton value={BANK.swift} id="swift" copied={copied} onCopy={copy}
              className="text-[11px] font-bold text-gray-600 hover:text-black flex items-center gap-1 cursor-pointer">
              <Copy size={12} /> Copy
            </CopyButton>
          </div>
          <div className="sm:col-span-2 pt-1 border-t border-gray-100 text-[11px] text-gray-500">
            <strong className="text-gray-700">Payment Reference:</strong> Please enter{' '}
            <span className="font-mono text-black font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{reference || 'Your Name'}</span> or your phone number in the transfer remark.
          </div>
        </div>
      </div>

      <div id="receipt-upload-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="fund-transfer-file-input" className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-1.5">
            <UploadCloud size={15} className="text-black" />
            Transfer Confirmation Slip <span className="text-red-500">*</span>
          </label>
          <span className="text-[10px] font-medium text-gray-500">PDF, JPG, PNG or WEBP · max 8MB</span>
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp,application/pdf"
          onChange={handleFile} className="hidden" id="fund-transfer-file-input" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-sm text-xs flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {uploading && (
          <div className="border border-gray-200 bg-white p-6 rounded-sm text-center">
            <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Uploading slip…</p>
          </div>
        )}

        {!uploading && receipt && (
          <div className="border border-emerald-300 bg-white p-4 rounded-sm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {preview ? (
                <img src={preview} alt="Receipt preview" className="w-14 h-14 object-cover rounded border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded flex flex-col items-center justify-center text-red-700 flex-shrink-0">
                  <FileText size={22} />
                  <span className="text-[9px] font-bold uppercase mt-0.5">PDF</span>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-gray-900 truncate max-w-[220px] sm:max-w-[280px] block mb-0.5">
                  {receipt.originalName || receipt.filename}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded text-[10px]">
                    <CheckCircle2 size={11} /> Attached
                  </span>
                  {receipt.size ? <span>{(receipt.size / 1024).toFixed(0)} KB</span> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <a href={receipt.url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black border border-gray-200 hover:border-black rounded-xs transition-colors inline-flex items-center gap-1">
                <Eye size={13} /> View
              </a>
              <button type="button" onClick={remove}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded-xs transition-colors inline-flex items-center gap-1 cursor-pointer">
                <X size={13} /> Remove
              </button>
            </div>
          </div>
        )}

        {!uploading && !receipt && (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-black bg-white hover:bg-gray-50/50 p-6 rounded-sm text-center cursor-pointer transition-all group">
            <span className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-600 flex items-center justify-center mx-auto mb-3 transition-colors">
              <UploadCloud size={20} />
            </span>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">Click to upload your slip</span>
            <span className="block text-[11px] text-gray-500">PDF, JPG, PNG or WEBP (max 8MB)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BankTransferPanel;
