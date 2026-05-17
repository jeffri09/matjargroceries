'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useEffect, useState } from 'react';
import styles from './BottomNav.module.css';

const navItems = [
    { href: '/', icon: 'home', iconFilled: 'home', label: 'Home' },
    { href: '/categories', icon: 'grid_view', iconFilled: 'grid_view', label: 'Categories' },
    { href: '/cart', icon: 'shopping_cart', iconFilled: 'shopping_cart', label: 'Cart', showBadge: true },
    { href: '/history', icon: 'history', iconFilled: 'history', label: 'History' },
    { href: '/find-order', icon: 'search', iconFilled: 'search', label: 'Find' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const cartCount = useCartStore((s) => s.getItemCount());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className={styles.bottomNav} aria-label="Bottom navigation">
            {navItems.map((item) => {
                const isActive =
                    item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    >
                        <div className={styles.iconWrapper}>
                            <span
                                className="material-symbols-outlined"
                                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                                {isActive ? item.iconFilled : item.icon}
                            </span>
                            {item.showBadge && mounted && cartCount > 0 && (
                                <span className={styles.badge}>{cartCount}</span>
                            )}
                        </div>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
