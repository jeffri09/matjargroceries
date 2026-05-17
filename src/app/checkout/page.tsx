'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/stores/cart-store';
import { useHistoryStore } from '@/stores/history-store';
import { formatHarga } from '@/lib/utils';
import { generateWAMessage, generateWALink, DEFAULT_WA_NUMBER } from '@/lib/whatsapp';
import { submitOrder } from '@/lib/api';
import { calculateDiscount, type CouponData } from '@/lib/coupon';
import storesData from '../../../public/data/stores.json';
import paymentsData from '../../../public/data/payments.json';
import styles from './page.module.css';

const MapPicker = dynamic(() => import('@/components/checkout/MapPicker'), { ssr: false });

type Schedule = 'hari-ini' | 'besok' | 'pilih';
type Payment = 'transfer' | 'qris' | 'cod';

export default function CheckoutPage() {
    const router = useRouter();
    const items = useCartStore((s) => s.items);
    const getTotal = useCartStore((s) => s.getTotal);
    const getItemCount = useCartStore((s) => s.getItemCount);
    const clearCart = useCartStore((s) => s.clearCart);
    const addOrder = useHistoryStore((s) => s.addOrder);
    const [mounted, setMounted] = useState(false);

    // Form state
    const [nama, setName] = useState('');
    const [telepon, setTelepon] = useState('');
    const [alamat, setAddress] = useState('');
    const [catatan, setNote] = useState('');
    const [jadwal, setSchedule] = useState<Schedule>('hari-ini');
    const [tanggalPilih, setTanggalPilih] = useState('');
    const [pembayaran, setPayment] = useState<Payment>('transfer');
    const [copied, setCopied] = useState('');

    // Location state from map
    const [lokasi, setLocation] = useState<{ lat: number; lng: number; jarak: number } | null>(null);
    const [lokasiError, setLocationError] = useState(false);

    // Store data
    const store = storesData[0];

    const handleLocationSelect = useCallback((location: { lat: number; lng: number; alamat: string; jarak: number } | null) => {
        if (location) {
            setLocation({ lat: location.lat, lng: location.lng, jarak: location.jarak });
            setAddress(location.alamat);
            setLocationError(false);
        } else {
            setLocation(null);
            setLocationError(true);
        }
    }, []);

    // Coupon state (read from sessionStorage set in cart)
    const [kuponData, setCouponData] = useState<CouponData | null>(null);

    useEffect(() => {
        setMounted(true);
        // Restore coupon from sessionStorage (set in cart page)
        const saved = sessionStorage.getItem('coupon');
        if (saved) {
            try { setCouponData(JSON.parse(saved)); } catch { /* ignore */ }
        }

        // Auto-fill from last order (if fields empty)
        const orders = useHistoryStore.getState().orders;
        if (orders.length > 0) {
            const last = orders[0];
            setName(prev => prev || last.nama);
            setTelepon(prev => prev || last.telepon);
        }
    }, []);

    if (!mounted) {
        return (
            <main className={styles.page}>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>Loading checkout...</p>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className={styles.page}>
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-muted)' }}>
                        shopping_cart
                    </span>
                    <h2 style={{ marginTop: '16px', marginBottom: '8px' }}>Cart is Empty</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Addkan produk dulu sebelum checkout.</p>
                    <Link href="/" style={{ background: 'var(--color-primary)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 600 }}>
                        Start Shopping
                    </Link>
                </div>
            </main>
        );
    }

    const subtotal = getTotal();
    const jarakKm = lokasi?.jarak || 0;
    const ongkirHitung = Math.ceil(jarakKm) * (store?.tarif_per_km || 3000);
    const gratisShipping = subtotal >= (store?.gratis_ongkir_diatas || 100000);
    const ongkirBase = gratisShipping ? 0 : ongkirHitung;

    // Calculate coupon discounts
    const { diskon, ongkirDiscount } = kuponData
        ? calculateDiscount(kuponData, subtotal, ongkirBase)
        : { diskon: 0, ongkirDiscount: 0 };
    const ongkir = Math.max(0, ongkirBase - ongkirDiscount);
    const total = subtotal - diskon + ongkir;
    const itemCount = getItemCount();

    // Date picker helpers
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const jadwalLabel: Record<Schedule, string> = {
        'hari-ini': 'Today',
        'besok': 'Tomorrow Morning',
        'pilih': tanggalPilih
            ? new Date(tanggalPilih).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'Scheduled',
    };

    // Payment data
    const bankAccounts = paymentsData.filter((p: { tipe: string }) => p.tipe === 'transfer');
    const qrisData = paymentsData.find((p: { tipe: string }) => p.tipe === 'qris');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(''), 2000);
        });
    };

    const bayarLabel: Record<Payment, string> = {
        transfer: 'Bank Transfer',
        qris: 'Zelle / Venmo (QR)',
        cod: 'Pay on Delivery (COD)',
    };

    const handleCheckout = () => {
        if (!nama.trim() || !telepon.trim() || !alamat.trim()) {
            alert('Please fill in name, phone, and address.');
            return;
        }
        if (!lokasi) {
            alert('Please pick your delivery location on the map.');
            return;
        }
        if (lokasiError) {
            alert(`Location too far. Maximum ${store?.max_jarak_km || 25} km from store.`);
            return;
        }

        // Generate orderId once — shared across WA, GAS, and localStorage
        const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
        const linkMaps = `https://maps.google.com/?q=${lokasi.lat},${lokasi.lng}`;

        const message = generateWAMessage({
            orderId,
            nama,
            telepon,
            alamat,
            catatan: catatan || undefined,
            jadwal: jadwalLabel[jadwal],
            metodePay: bayarLabel[pembayaran],
            items,
            subtotal,
            ongkir,
            total,
            diskon: diskon > 0 ? diskon : undefined,
            kupon: kuponData?.kode,
            linkMaps,
        });

        const waUrl = generateWALink(DEFAULT_WA_NUMBER, message);
        window.open(waUrl, '_blank');

        // Save to localStorage history
        addOrder({
            id: orderId,
            tanggal: new Date().toISOString(),
            nama,
            telepon,
            alamat,
            items: [...items],
            subtotal,
            ongkir,
            diskon: diskon + ongkirDiscount,
            kupon: kuponData?.kode,
            total,
            jadwal: jadwalLabel[jadwal],
            metodePay: bayarLabel[pembayaran],
            catatan: catatan || undefined,
            linkMaps,
        });

        // Record order to Google Sheets (fire-and-forget)
        submitOrder({
            orderId,
            nama,
            telepon,
            alamat,
            catatan: catatan || undefined,
            jadwal: jadwalLabel[jadwal],
            metodePay: bayarLabel[pembayaran],
            items: items.map(i => ({
                id: i.id,
                nama: i.nama,
                harga: i.harga,
                qty: i.qty,
                variasi: i.variasi,
                tambahan: i.tambahan,
                catatan: i.catatan,
            })),
            subtotal,
            ongkir,
            total,
            diskon: diskon > 0 ? diskon : undefined,
            kupon: kuponData?.kode,
            linkMaps,
        });

        // Clear cart and coupon, then redirect to struk
        clearCart();
        sessionStorage.removeItem('coupon');
        router.push(`/receipt/${orderId}`);
    };

    return (
        <main className={styles.page}>
            {/* Breadcrumb Steps */}
            <nav className={styles.steps} aria-label="Progress checkout">
                <div className={`${styles.step} ${styles.stepDone}`}>
                    <span className={styles.stepNumber}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                    </span>
                    <span className={styles.stepLabel}>Cart</span>
                </div>
                <div className={`${styles.stepLine} ${styles.stepLineDone}`} />
                <div className={`${styles.step} ${styles.stepActive}`}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepLabel}>Checkout</span>
                </div>
                <div className={styles.stepLine} />
                <div className={styles.step}>
                    <span className={styles.stepNumber}>3</span>
                    <span className={styles.stepLabel}>Selesai</span>
                </div>
            </nav>

            <div className={styles.checkoutLayout}>
                {/* Left: Forms */}
                <div>
                    {/* Recipient Data */}
                    <div className={styles.formCard} style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2 className={styles.formTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>person</span>
                            Recipient Data
                        </h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="nama" className={styles.formLabel}>
                                    Full Name <span className={styles.formRequired}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nama"
                                    className={styles.formInput}
                                    placeholder="Masukkan nama lengkap"
                                    value={nama}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="telepon" className={styles.formLabel}>
                                    WhatsApp Number <span className={styles.formRequired}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="telepon"
                                    className={styles.formInput}
                                    placeholder="08xxxxxxxxxx"
                                    value={telepon}
                                    onChange={(e) => setTelepon(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Pengiriman */}
                    <div className={styles.formCard} style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2 className={styles.formTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>location_on</span>
                            Address Pengiriman
                        </h2>
                        {store && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 12px', marginBottom: 'var(--space-md)',
                                borderRadius: 'var(--radius)', background: 'var(--bg-green-soft)',
                                border: '1px solid var(--color-primary-light)',
                                fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>store</span>
                                <span>Store: <strong>{store.nama}</strong> — {store.alamat}</span>
                            </div>
                        )}
                        <div className={styles.formGroup}>
                            <label htmlFor="alamat" className={styles.formLabel}>
                                Address Lengkap <span className={styles.formRequired}>*</span>
                            </label>
                            <textarea
                                id="alamat"
                                className={styles.formTextarea}
                                placeholder="Jl. Contoh No. 123, RT 01/RW 02, Kel. Contoh, Kec. Contoh"
                                rows={3}
                                value={alamat}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>
                        <MapPicker
                            storeLat={store?.lat || -6.17}
                            storeLng={store?.lng || 106.83}
                            maxJarak={store?.max_jarak_km || 10}
                            onLocationSelect={handleLocationSelect}
                        />
                    </div>

                    {/* Schedule Pengiriman */}
                    <div className={styles.formCard} style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2 className={styles.formTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>schedule</span>
                            Schedule Pengiriman
                        </h2>
                        <div className={styles.scheduleOptions}>
                            {([
                                { key: 'hari-ini' as Schedule, icon: 'bolt', label: 'Today' },
                                { key: 'besok' as Schedule, icon: 'calendar_today', label: 'Tomorrow' },
                                { key: 'pilih' as Schedule, icon: 'event', label: 'Pick Date' },
                            ]).map((opt) => (
                                <button
                                    key={opt.key}
                                    className={`${styles.scheduleOption} ${jadwal === opt.key ? styles.scheduleOptionActive : ''}`}
                                    onClick={() => setSchedule(opt.key)}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {jadwal === 'pilih' && (
                            <div style={{ marginTop: 'var(--space-md)' }}>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    value={tanggalPilih}
                                    onChange={e => setTanggalPilih(e.target.value)}
                                    min={todayStr}
                                    max={maxDateStr}
                                    required
                                />
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    📅 Pick a date within the next 7 days
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className={styles.formCard} style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2 className={styles.formTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>payments</span>
                            Payment Method
                        </h2>
                        <div className={styles.paymentOptions}>
                            {([
                                { key: 'transfer' as Payment, icon: 'account_balance', color: '#3b82f6', bg: '#eff6ff', name: 'Bank Transfer', desc: 'Chase, BoA, Wells Fargo' },
                                { key: 'qris' as Payment, icon: 'qr_code_2', color: '#a855f7', bg: '#faf5ff', name: 'QRIS', desc: 'Scan QR to pay' },
                                { key: 'cod' as Payment, icon: 'payments', color: '#16a34a', bg: '#f0fdf4', name: 'Pay on Delivery (COD)', desc: 'Pay saat orders tiba' },
                            ]).map((opt) => (
                                <label
                                    key={opt.key}
                                    className={`${styles.paymentOption} ${pembayaran === opt.key ? styles.paymentOptionActive : ''}`}
                                    onClick={() => setPayment(opt.key)}
                                >
                                    <div className={styles.paymentRadio}>
                                        <div className={styles.paymentRadioDot} />
                                    </div>
                                    <div className={styles.paymentIcon} style={{ background: opt.bg }}>
                                        <span className="material-symbols-outlined" style={{ color: opt.color }}>{opt.icon}</span>
                                    </div>
                                    <div className={styles.paymentInfo}>
                                        <p className={styles.paymentName}>{opt.name}</p>
                                        <p className={styles.paymentDesc}>{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Payment Detail Panel */}
                        {pembayaran === 'transfer' && bankAccounts.length > 0 && (
                            <div className={styles.paymentDetail}>
                                <p className={styles.paymentDetailTitle}>💳 Select destination account:</p>
                                {bankAccounts.map((bank: { provider: string; no_rekening: string; atas_nama: string }, idx: number) => (
                                    <div key={idx} className={styles.bankCard}>
                                        <div className={styles.bankInfo}>
                                            <span className={styles.bankProvider}>{bank.provider}</span>
                                            <span className={styles.bankNumber}>{bank.no_rekening}</span>
                                            <span className={styles.bankName}>a.n. {bank.atas_nama}</span>
                                        </div>
                                        <button
                                            className={styles.copyBtn}
                                            onClick={() => copyToClipboard(bank.no_rekening, `bank-${idx}`)}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                                {copied === `bank-${idx}` ? 'check' : 'content_copy'}
                                            </span>
                                            {copied === `bank-${idx}` ? 'Tersalin!' : 'Salin'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pembayaran === 'qris' && (
                            <div className={styles.paymentDetail}>
                                <p className={styles.paymentDetailTitle}>📱 Scan QR Code to pay:</p>
                                {qrisData && 'qris_url' in qrisData && qrisData.qris_url ? (
                                    <div className={styles.qrisImageWrap}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={qrisData.qris_url as string}
                                            alt="QRIS Payment"
                                            className={styles.qrisImage}
                                            style={{ maxWidth: '280px', width: '100%' }}
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.qrisPlaceholder}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>qr_code_2</span>
                                        <p>QR Code akan dikirim via WhatsApp setelah checkout</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {pembayaran === 'cod' && (
                            <div className={styles.paymentDetail}>
                                <div className={styles.codInfo}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#f59e0b' }}>info</span>
                                    <p>💵 Please prepare exact change to help the driver. Thank you!</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className={styles.formCard}>
                        <h2 className={styles.formTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>edit_note</span>
                            Note Addan
                        </h2>
                        <div className={styles.formGroup}>
                            <textarea
                                className={styles.formTextarea}
                                placeholder="Note untuk driver atau penjual (opsional)"
                                rows={2}
                                value={catatan}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <aside>
                    <div className={styles.summaryCard}>
                        <h2 className={styles.summaryTitle}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>receipt_long</span>
                            Summary Orders
                        </h2>

                        {items.map((item) => (
                            <div key={item.id + (item.variasi || '')} className={styles.summaryItem}>
                                <div className={styles.summaryItemImage}>
                                    <Image
                                        src={item.foto}
                                        alt={item.nama}
                                        fill
                                        sizes="56px"
                                        style={{ objectFit: 'cover' }}
                                        loading="lazy"
                                    />
                                </div>
                                <div className={styles.summaryItemInfo}>
                                    <p className={styles.summaryItemName}>{item.nama}</p>
                                    <p className={styles.summaryItemMeta}>
                                        {item.variasi && <>{item.variasi} · </>}
                                        {item.qty}× {formatHarga(item.harga + (item.tambahan || 0))}
                                    </p>
                                </div>
                                <span className={styles.summaryItemPrice}>
                                    {formatHarga(item.subtotal)}
                                </span>
                            </div>
                        ))}

                        <div className={styles.summaryDivider} />

                        <div className={styles.summaryRows}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal ({itemCount} item)</span>
                                <span className={styles.summaryRowValue}>{formatHarga(subtotal)}</span>
                            </div>
                            {diskon > 0 && (
                                <div className={styles.summaryRow} style={{ color: 'var(--color-primary)' }}>
                                    <span>Discount ({kuponData?.kode})</span>
                                    <span className={styles.summaryRowValue}>-{formatHarga(diskon)}</span>
                                </div>
                            )}
                            <div className={styles.summaryRow}>
                                <span>Shipping ({jarakKm > 0 ? `${jarakKm} km` : 'pick location'})</span>
                                <span className={styles.summaryRowValue}>
                                    {gratisShipping || ongkirDiscount > 0 ? (
                                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                            {ongkir === 0 ? 'FREE' : formatHarga(ongkir)}
                                        </span>
                                    ) : (
                                        formatHarga(ongkir)
                                    )}
                                </span>
                            </div>
                            {(gratisShipping || ongkirDiscount > 0) && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', marginTop: '-4px' }}>
                                    🎉 {ongkirDiscount > 0 ? `Free shipping from coupon ${kuponData?.kode}` : `Free shipping on orders over ${formatHarga(store?.gratis_ongkir_diatas || 100000)}`}
                                </div>
                            )}
                        </div>

                        <div className={styles.summaryDivider} />

                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span className={styles.summaryTotalPrice}>{formatHarga(total)}</span>
                        </div>

                        <button className={styles.checkoutCTA} onClick={handleCheckout}>
                            <span className="material-symbols-outlined">send</span>
                            Checkout via WhatsApp
                        </button>
                        <p className={styles.secureNote}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                            Transaksi aman & terenkripsi
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}
