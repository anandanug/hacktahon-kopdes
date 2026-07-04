import React, { useEffect, useState } from "react";
import { Booking } from "../types";
import { X, Calendar, CheckCircle, Clock, MapPin, Receipt } from "lucide-react";

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
}

export default function MyBookingsModal({ isOpen, onClose, refreshTrigger }: MyBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/whatsapp/bookings/mem-001")
        .then((res) => res.json())
        .then((data) => {
          // Map FastAPI snake_case to frontend camelCase Booking type
          const mappedData = data.map((b: any) => ({
            id: b.id,
            productName: b.product_name,
            price: b.unit_price,
            quantity: b.quantity,
            customerName: b.member_name,
            bookingCode: b.booking_code,
            status: b.status,
            createdAt: b.created_at,
          }));
          // Sort newest first
          const sorted = mappedData.sort((a: Booking, b: Booking) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setBookings(sorted);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching bookings:", err);
          setLoading(false);
        });
    }
  }, [isOpen, refreshTrigger]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        id="bookings-modal-container"
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px]">receipt_long</span>
            <div>
              <h2 className="text-lg font-bold">Daftar Pemesanan Saya</h2>
              <p className="text-xs text-white/85">Detail booking produk tani aktif di gudang</p>
            </div>
          </div>
          <button 
            id="close-bookings-btn"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-primary">
              <div className="w-8 h-8 spinner"></div>
              <span className="text-xs text-on-surface-variant font-medium">Memuat pesanan...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-gray-400">
              <Receipt size={40} className="stroke-1" />
              <div>
                <p className="text-sm font-semibold text-[#1a1c1c]">Belum ada pemesanan</p>
                <p className="text-xs max-w-xs mt-1">Silakan memesan melalui asisten AI atau katalog produk kami.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const total = booking.price * booking.quantity;
                return (
                  <div 
                    key={booking.id} 
                    id={`booking-card-${booking.bookingCode}`}
                    className="border border-[#bccac2]/40 rounded-xl bg-[#f9f9f9] overflow-hidden"
                  >
                    {/* Upper */}
                    <div className="p-4 border-b border-[#bccac2]/20">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          #{booking.bookingCode}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          <span>Siap Diambil</span>
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-sm text-[#1a1c1c] mt-3">
                        {booking.productName}
                      </h3>
                      <div className="flex justify-between items-baseline mt-1 text-xs text-on-surface-variant">
                        <span>Jumlah: {booking.quantity} barang</span>
                        <span>Total: <strong className="text-primary font-bold">Rp {total.toLocaleString("id-ID")}</strong></span>
                      </div>
                    </div>

                    {/* Lower details */}
                    <div className="p-4 bg-white space-y-2.5 text-xs text-on-surface-variant border-t border-[#bccac2]/10">
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-[#1a1c1c]">Jadwal Pengambilan:</p>
                          <p className="text-gray-500 text-[11px]">Kamis & Jumat (08:00 - 15:00 WIB)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-[#1a1c1c]">Lokasi Gudang:</p>
                          <p className="text-gray-500 text-[11px]">Gudang Logistik Utama Simkopdes (Samping Kantor Desa)</p>
                        </div>
                      </div>

                      {/* simulated QR code */}
                      <div className="pt-2 flex items-center justify-between border-t border-[#bccac2]/10">
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-gray-500">Tunjukkan bukti ini kepada petugas:</p>
                          <p className="text-[10px] text-gray-400">Atas nama: {booking.customerName}</p>
                        </div>
                        {/* simulated QR code drawing */}
                        <div className="w-12 h-12 bg-white border border-[#bccac2] p-1 flex flex-col gap-0.5 justify-center items-center shrink-0">
                          <div className="flex gap-0.5">
                            <div className="w-2 h-2 bg-black"></div>
                            <div className="w-1 h-2 bg-black"></div>
                            <div className="w-2 h-2 bg-black"></div>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 bg-black"></div>
                            <div className="w-2 h-1 bg-black"></div>
                            <div className="w-1 h-1 bg-black"></div>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-2 h-2 bg-black"></div>
                            <div className="w-1 h-2 bg-black"></div>
                            <div className="w-2 h-2 bg-black"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
