import Link from 'next/link';
import type { Metadata } from 'next';
import categoriesData from '../../../public/data/categories.json';
import type { Category } from '@/types';
import styles from './page.module.css';

const categories = categoriesData as Category[];

export const metadata: Metadata = {
    title: 'Product Categories',
    description: 'Browse our fresh product categories: Produce, Fruits, Halal Meat, Dairy, Pantry, and Snacks.',
};

const categoryIcons: Record<string, string> = {
    'fresh-produce': 'eco',
    'fruits': 'emoji_nature',
    'halal-meat-poultry': 'set_meal',
    'bumbu-dapur': 'soup_kitchen',
    'minuman': 'local_cafe',
    'snack': 'cookie',
};

export default function CategoriesPage() {
    return (
        <main className={styles.page}>
            <h1 className={styles.title}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>category</span>
                Product Categories
            </h1>
            <div className={styles.grid}>
                {categories.map((cat) => (
                    <Link key={cat.id} href={`/categories/${cat.slug}`} className={styles.card}>
                        <div className={styles.cardIcon}>
                            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
                                {categoryIcons[cat.slug] || 'inventory_2'}
                            </span>
                        </div>
                        <h2 className={styles.cardName}>{cat.nama}</h2>
                    </Link>
                ))}
            </div>
        </main>
    );
}
