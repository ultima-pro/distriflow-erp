import React from 'react';
import { Invoice, InvoiceItem, Retailer } from '../../types/erp';
import { formatCurrency } from '../../lib/format';

interface PrintableInvoiceProps {
  invoice: Invoice;
  items: InvoiceItem[];
  retailer?: Retailer | null;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  items,
  retailer,
}) => {
  return (
    <div id="printable-invoice" className="bg-white text-slate-900 p-8 sm:p-10 font-sans print:p-0 print:m-0 print:w-full">
      {/* Print-only CSS injected */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black flex items-center justify-center text-lg print:bg-black">
              D
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">DistriFlow ERP</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Distribution Management & Wholesale Supply</p>
          <p className="text-xs text-slate-500 mt-1">Kathmandu, Nepal • Phone: +977-1-4500000</p>
          <p className="text-xs text-slate-500">support@distriflow.internal</p>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded print:bg-black">
            TAX INVOICE
          </span>
          <p className="text-lg font-black text-slate-900 mt-2 font-mono">{invoice.invoiceNumber}</p>
          <p className="text-xs text-slate-600 mt-1">
            <span className="font-bold">Invoice Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-bold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
          <div className="mt-2">
            <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded border border-slate-300 uppercase">
              Status: {invoice.paymentStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-transparent print:border-slate-300">
          <h2 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Billed To (Customer):</h2>
          <p className="text-sm font-black text-slate-900">{invoice.retailerName}</p>
          {retailer?.contactPerson && (
            <p className="text-slate-700 mt-0.5"><span className="font-bold">Contact:</span> {retailer.contactPerson}</p>
          )}
          {retailer?.phone && (
            <p className="text-slate-700"><span className="font-bold">Phone:</span> {retailer.phone}</p>
          )}
          {retailer?.address && (
            <p className="text-slate-700 mt-0.5">{retailer.address}{retailer.city ? `, ${retailer.city}` : ''}</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-transparent print:border-slate-300">
          <h2 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Payment Terms & Order:</h2>
          <p className="text-slate-700"><span className="font-bold">Payment Terms:</span> Net 30 Days</p>
          <p className="text-slate-700"><span className="font-bold">Order ID:</span> #{invoice.orderId}</p>
          <p className="text-slate-700"><span className="font-bold">Currency:</span> Nepalese Rupee (Rs.)</p>
          <p className="text-slate-700 mt-1">
            <span className="font-bold">Remaining Balance Due:</span>{' '}
            <span className="text-rose-700 font-black">{formatCurrency(invoice.remainingBalance)}</span>
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider print:bg-slate-100 print:text-black">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Discount</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(item.discount)}</td>
                <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Notes */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t-2 border-slate-900 pt-4">
        <div className="max-w-md text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Payment Instructions:</p>
          <p>Please make cheques payable to <span className="font-bold">DistriFlow Enterprise Ltd.</span> or transfer via bank or digital wallet quoting invoice number {invoice.invoiceNumber}.</p>
          <p className="text-[10px] text-slate-500 pt-2 italic">Goods once sold and delivered in good order are subject to distributor return policy within 7 working days.</p>
        </div>

        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Subtotal:</span>
            <span className="font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
              <span className="font-medium">Discount:</span>
              <span className="font-bold">-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600 font-medium">VAT / Tax:</span>
              <span className="font-bold text-slate-900">{formatCurrency(invoice.tax)}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b-2 border-slate-900 text-sm">
            <span className="font-black text-slate-900">Total Amount:</span>
            <span className="font-black text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
            <span className="font-medium">Amount Paid:</span>
            <span className="font-bold">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between py-1.5 bg-slate-100 p-2 rounded print:bg-transparent">
            <span className="font-black text-slate-900">Balance Due:</span>
            <span className="font-black text-base text-rose-700">{formatCurrency(invoice.remainingBalance)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Seal */}
      <div className="mt-12 pt-6 grid grid-cols-2 gap-12 text-xs text-center border-t border-slate-200">
        <div>
          <div className="h-10"></div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">Customer Receiver Signature</div>
          <p className="text-[10px] text-slate-400">Received all goods in good condition</p>
        </div>
        <div>
          <div className="h-10"></div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">For DistriFlow ERP</div>
          <p className="text-[10px] text-slate-400">Authorized Signatory & Official Stamp</p>
        </div>
      </div>
    </div>
  );
};
