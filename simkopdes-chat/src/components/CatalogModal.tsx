import React, { useEffect, useState } from "react";
import { Product } from "../types";
import { X, ShoppingBag, CheckCircle, Tag } from "lucide-react";

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderProduct: (product: Product, quantity: number) => void;
}

export default function CatalogModal({ isOpen, onClose, onOrderProduct }: CatalogModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderedId, setOrderedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/whatsapp/products")
        .then((res) => res.json())
        .then((data) => {
          setProducts(data);
          // Initialize quantities
          const initialQuants: Record<string, number> = {};
          data.forEach((p: Product) => {
            initialQuants[p.id] = 1;
          });
          setQuantities(initialQuants);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching catalog:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, Math.min(10, val)),
    }));
  };

  const handleOrder = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onOrderProduct(product, qty);
    setOrderedId(product.id);
    setTimeout(() => {
      setOrderedId(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        id="catalog-modal-container"
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px]">storefront</span>
            <div>
              <h2 className="text-lg font-bold">Katalog Produk Simkopdes</h2>
              <p className="text-xs text-white/85">Belanja kebutuhan pertanian langsung dari koperasi</p>
            </div>
          </div>
          <button 
            id="close-catalog-btn"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-primary">
              <div className="w-10 h-10 spinner"></div>
              <span className="text-sm text-on-surface-variant font-medium">Memuat katalog...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => {
                const currentPrice = product.promoPrice || product.price;
                const hasPromo = !!product.promoPrice;

                return (
                  <div 
                    key={product.id} 
                    id={`product-card-${product.id}`}
                    className="border border-[#bccac2]/40 rounded-xl overflow-hidden bg-[#f9f9f9] flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative h-40 bg-surface-container overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {hasPromo && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <Tag size={10} />
                            <span>PROMO</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded font-medium backdrop-blur-sm">
                          Stok: {product.stock}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                        <h3 className="font-semibold text-sm text-[#1a1c1c] mt-1.5 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="p-3 pt-0 border-t border-[#bccac2]/20 mt-2 bg-white">
                      <div className="flex justify-between items-baseline py-2">
                        <div className="flex flex-col">
                          {hasPromo && (
                            <span className="text-[11px] text-gray-400 line-through">
                              Rp {product.price.toLocaleString("id-ID")}/{product.unit}
                            </span>
                          )}
                          <span className="text-sm font-bold text-primary">
                            Rp {currentPrice.toLocaleString("id-ID")}
                            <span className="text-[11px] text-gray-500 font-normal">/{product.unit}</span>
                          </span>
                        </div>
                        
                        {/* Qty Selector */}
                        <div className="flex items-center border border-[#bccac2] rounded">
                          <button 
                            id={`qty-minus-${product.id}`}
                            onClick={() => handleQtyChange(product.id, (quantities[product.id] || 1) - 1)}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-[#1a1c1c]">
                            {quantities[product.id] || 1}
                          </span>
                          <button 
                            id={`qty-plus-${product.id}`}
                            onClick={() => handleQtyChange(product.id, (quantities[product.id] || 1) + 1)}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {orderedId === product.id ? (
                        <button 
                          disabled 
                          className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold"
                        >
                          <CheckCircle size={14} />
                          <span>Pemesanan Berhasil</span>
                        </button>
                      ) : (
                        <button 
                          id={`order-btn-${product.id}`}
                          onClick={() => handleOrder(product)}
                          className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-[0.98]"
                        >
                          <ShoppingBag size={14} />
                          <span>Pesan Sekarang</span>
                        </button>
                      )}
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
