'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { formatHarga } from '@/lib/utils';
import { validateCoupon, calculateDiscount, type CouponData } from '@/lib/coupon';
import styles from './page.module.css';

export default function CartPage() {
    const items = useCartStore((s) => s.items);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQty = useCartStore((s) => s.updateQty);
    const clearCart = useCartStore((s) => s.clearCart);
    const getTotal = useCartStore((s) => s.getTotal);
    const getItemCount = useCartStore((s) => s.getItemCount);
    const [mounted, setMounted] = useState(false);
    const [kuponInput, setCouponInput] = useState('');
    const [kuponLoading, setCouponLoading] = useState(false);
    const [kuponError, setCouponError] = useState('');
    const [kuponData, setCouponData] = useState<CouponData | null>(null);

    useEffect(() => {
        setMounted(true);
        // Restore coupon from sessionStorage
        const saved = sessionStorage.getItem('coupon');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCouponData(parsed);
                setCouponInput(parsed.kode);
            } catch { /* ignore */ }
        }
    }, []);

    const handleApplyCoupon = async () => {
        const kode = kuponInput.trim().toUpperCase();
        if (!kode) return;
        setCouponLoading(true);
        setCouponError('');
        const result = await validateCoupon(kode, getTotal());
        if (result.success && result.coupon) {
            setCouponData(result.coupon);
            sessionStorage.setItem('coupon', JSON.stringify(result.coupon));
        } else {
            setCouponError(result.error || 'Coupon tidak valid');
            setCouponData(null);
            sessionStorage.removeItem('coupon');
        }
        setCouponLoading(false);
    };

    const handleRemoveCoupon = () => {
        setCouponData(null);
        setCouponInput('');
        setCouponError('');
        sessionStorage.removeItem('coupon');
    };

    const subtotal = getTotal();
    const itemCount = getItemCount();
    const { diskon } = kuponData ? calculateDiscount(kuponData, subtotal, 0) : { diskon: 0 };

    if (!mounted) {
        return (
            <main className={styles.page}>
                <h1 className={styles.pageTitle}>
                    <span className="material-symbols-outlined">shopping_cart</span>
                    Shopping Cart
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className={styles.page}>
                <h1 className={styles.pageTitle}>
                    <span className="material-symbols-outlined">shopping_cart</span>
                    Shopping Cart
                </h1>
                <div className={styles.emptyState}>
                    <span className={`material-symbols-outlined ${styles.emptyIcon}`}>
                        remove_shopping_cart
                    </span>
                    <h2 className={styles.emptyTitle}>Cart is Empty</h2>
                    <p className={styles.emptyDesc}>
                        Your cart is empty. Start shopping for fresh groceries!
                    </p>
                    <Link href="/" className={styles.emptyBtn}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            storefront
                        </span>
                        Start Shopping
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.cartHeader}>
                <h1 className={styles.pageTitle}>
                    <span className="material-symbols-outlined">shopping_cart</span>
                    Cart ({itemCount})
                </h1>
                <button className={styles.clearBtn} onClick={clearCart}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        delete_sweep
                    </span>{' '}
                    Remove Semua
                </button>
            </div>

            <div className={styles.cartLayout}>
                {/* Cart Items */}
                <div className={styles.cartCard}>
                    {items.map((item) => (
                        <div key={item.id + (item.variasi || '')} className={styles.cartItem}>
                            <div className={styles.cartItemImage}>
                                <Image
                                    src={item.foto}
                                    alt={item.nama}
                                    fill
                                    sizes="88px"
                                    style={{ objectFit: 'cover' }}
                                    loading="lazy"
                                />
                            </div>
                            <div className={styles.cartItemInfo}>
                                <p className={styles.cartItemName}>{item.nama}</p>
                                <p className={styles.cartItemMeta}>
                                    {item.variasi && <>{item.variasi} · </>}
                                    {formatHarga(item.harga + (item.tambahan || 0))}/item
                                    {item.catatan && <> · &ldquo;{item.catatan}&rdquo;</>}
                                </p>
                                <div className={styles.cartItemBottom}>
                                    <span className={styles.cartItemPrice}>
                                        {formatHarga(item.subtotal)}
                                    </span>
                                    <div className={styles.cartItemQty}>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => {
                                                if (item.qty <= 1) {
                                                    removeItem(item.id, item.variasi);
                                                } else {
                                                    updateQty(item.id, item.qty - 1, item.variasi);
                                                }
                                            }}
                                            aria-label="Kurangi"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                                {item.qty <= 1 ? 'delete' : 'remove'}
                                            </span>
                                        </button>
                                        <span className={styles.qtyValue}>{item.qty}</span>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => updateQty(item.id, item.qty + 1, item.variasi)}
                                            aria-label="Add"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => removeItem(item.id, item.variasi)}
                                aria-label={`Remove ${item.nama}`}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Coupon Input */}
                <aside>
                    <div className={styles.summaryCard} style={{ marginBottom: 'var(--space-md)' }}>
                        <h2 className={styles.summaryTitle}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>confirmation_number</span>
                            Kode Coupon
                        </h2>
                        {kuponData ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', borderRadius: 'var(--radius)', border: '1px solid #bbf7d0' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '18px' }}>check_circle</span>
                                <span style={{ flex: 1, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{kuponData.kode}</span>
                                <button onClick={handleRemoveCoupon} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Masukkan kode"
                                        value={kuponInput}
                                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                        style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={kuponLoading || !kuponInput.trim()}
                                        style={{ padding: '10px 18px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 'var(--font-size-sm)', opacity: kuponLoading || !kuponInput.trim() ? 0.5 : 1, cursor: 'pointer' }}
                                    >
                                        {kuponLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {kuponError && (
                                    <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '6px' }}>{kuponError}</p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Summary */}
                    <div className={styles.summaryCard}>
                        <h2 className={styles.summaryTitle}>Summary Shopping</h2>

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
                            <span>Shipping</span>
                            <span className={styles.summaryRowValue} style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>Dihitung saat checkout</span>
                        </div>

                        <div className={styles.summaryDivider} />

                        <div className={styles.summaryTotal}>
                            <span>Subtotal</span>
                            <span className={styles.summaryTotalPrice}>{formatHarga(subtotal - diskon)}</span>
                        </div>

                        <Link href="/checkout" className={styles.checkoutBtn}>
                            <span className="material-symbols-outlined">shopping_cart_checkout</span>
                            Continue ke Checkout
                        </Link>

                        <Link href="/" className={styles.continueShopping}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                            Continue Shopping
                        </Link>
                    </div>
                </aside>
            </div>
        </main>
    );
}
