import { useEffect, useState } from 'react'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Calendar,
  Store,
  Eye,
  X,
  History as HistoryIcon,
} from 'lucide-react'

const History = () => {
  const { restaurants, activeRestaurant } = useRestaurant()
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRestId, setSelectedRestId] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices', { credentials: 'include' })
      const data = await res.json()
      if (data.success && Array.isArray(data.invoices)) {
        setInvoices(data.invoices)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const invNum = inv.invoiceNumber?.toLowerCase() || ''
    const custName = inv.customerName?.toLowerCase() || ''
    const matchesSearch = invNum.includes(searchQuery.toLowerCase()) || custName.includes(searchQuery.toLowerCase())

    const rId = inv.restaurant?._id || inv.restaurant
    const matchesRest = selectedRestId === 'all' || rId === selectedRestId

    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter

    return matchesSearch && matchesRest && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D372E] tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-[#758C76]" />
            <span>Billing & Invoice History</span>
          </h1>
          <p className="text-xs text-[#78857A] font-medium">
            Search, audit, and reprint historical bills across all restaurants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">Total Bills:</span>
          <span className="bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] font-black text-xs px-3 py-1 rounded-xl">
            {invoices.length} Generated
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E1D7] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#88938A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, guest name..."
            className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Restaurant filter */}
          <select
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
          >
            <option value="all">All Outlets</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Payment filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid / Pending</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-[#758C76]/30 border-t-[#758C76] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#78857A]">Loading invoice records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="w-12 h-12 text-[#88938A] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#2D372E]">No invoices found</h3>
            <p className="text-xs text-[#78857A] mt-1">Try tweaking your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#78857A] font-bold uppercase tracking-wider border-b border-[#E8E1D7]">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Restaurant</th>
                  <th className="py-3.5 px-6">Guest / Customer</th>
                  <th className="py-3.5 px-6">Items Qty</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D7] text-[#2D372E] font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#2D372E]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-6 text-[#78857A] whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-[#2D372E]">{inv.restaurant?.name || 'Restaurant'}</p>
                      {inv.branch && (
                        <p className="text-[10px] text-[#758C76] font-medium">{inv.branch}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div>
                        <p className="font-semibold text-[#2D372E]">{inv.customerName}</p>
                        {inv.customerPhone && (
                          <p className="text-[10px] text-[#88938A]">{inv.customerPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {inv.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} items
                    </td>
                    <td className="py-3.5 px-6 font-black text-[#2D372E]">
                      ₹{inv.total?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                            : 'bg-[#FAF0E6] text-[#8C6D48] border border-[#ECD9C6]'
                        }`}
                      >
                        {inv.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 text-[#758C76] hover:text-[#627763] font-bold hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details / Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] overflow-hidden max-h-[92vh] flex flex-col justify-between">
            <div className="p-4 border-b border-[#E8E1D7] flex items-center justify-between bg-[#FAF8F5] no-print">
              <span className="font-bold text-sm text-[#2D372E]">Invoice Receipt</span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-[#2D372E]" id="receipt-modal">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#D5C7B8]">
                <h2 className="text-lg font-black text-[#2D372E]">
                  {selectedInvoice.restaurant?.name || 'BILLU RESTAURANT'}
                </h2>
                {selectedInvoice.branch && (
                  <p className="text-[11px] font-bold text-[#758C76]">
                    {selectedInvoice.branch}
                  </p>
                )}
                <p className="text-[11px] text-[#78857A]">Invoice Receipt • Official Bill of Supply</p>
              </div>

              <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between">
                  <span>Invoice: <strong>{selectedInvoice.invoiceNumber}</strong></span>
                  <span>Date: {new Date(selectedInvoice.createdAt || selectedInvoice.invoiceDate || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest: {selectedInvoice.customerName}</span>
                  <span className="capitalize">{selectedInvoice.orderType || 'Dine-in'}</span>
                </div>
                {selectedInvoice.tableNumber && (
                  <div>Table: {selectedInvoice.tableNumber}</div>
                )}
              </div>

              <div className="space-y-1.5 pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between font-bold text-[11px] text-[#78857A]">
                  <span>Item</span>
                  <span>Qty × Price = Total</span>
                </div>
                {selectedInvoice.items?.map((item, idx) => {
                  const qty = Number(item.quantity) || 1
                  const unitPrice = Number(
                    item.priceAtInvoice ??
                    item.priceAtOrder ??
                    item.price ??
                    item.sellingPrice ??
                    (item.total && qty ? item.total / qty : 0)
                  ) || 0
                  const lineTotal = Number(item.total) || (qty * unitPrice) || 0

                  return (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-medium truncate pr-2">{item.name}</span>
                      <span className="whitespace-nowrap font-mono">
                        {qty} × ₹{unitPrice.toFixed(2)} = ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-1 text-xs pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(Number(selectedInvoice.subtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#78857A]">
                  <span>CGST</span>
                  <span>₹{(Number(selectedInvoice.cgst) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#78857A]">
                  <span>SGST</span>
                  <span>₹{(Number(selectedInvoice.sgst) || 0).toFixed(2)}</span>
                </div>
                {Number(selectedInvoice.discount) > 0 && (
                  <div className="flex justify-between text-[#3E6842]">
                    <span>Discount</span>
                    <span>-₹{(Number(selectedInvoice.discount) || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-[#2D372E] pt-1 border-t border-[#E8E1D7]">
                  <span>FINAL TOTAL</span>
                  <span className="text-[#758C76]">₹{(Number(selectedInvoice.total) || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-[#78857A] pt-1 space-y-1">
                <p className="font-semibold text-[#2D372E]">
                  Payment Status: {(selectedInvoice.paymentStatus || 'PAID').toUpperCase()}
                </p>
                <p className="italic">
                  {selectedInvoice.invoiceFooter || 'Thank you for dining with us!'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E1D7] flex items-center justify-end gap-2 no-print">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History
