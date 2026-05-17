import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import type { Product, Category } from '@/types';
import productsData from '../../../../public/data/products.json';
import categoriesData from '../../../../public/data/categories.json';
import styles from './page.module.css';

const products = productsData as Product[];
const categories = categoriesData as Category[];

export function generateStaticParams() {
    return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const cat = categories.find(c => c.slug === slug);
    return {
        title: cat ? `${cat.nama} — Matjar Groceries` : 'Categories — Matjar Groceries',
        description: cat
            ? `Shop fresh ${cat.nama} online at Matjar Groceries. Fast delivery to your door!`
            : 'Browse product categories at Matjar Groceries',
    };
}

export default async function CategoriesSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const category = categories.find(c => c.slug === slug);
    const catProducts = category
        ? products.filter(p => p.kategori_id === category.id && p.aktif)
        : [];

    return (
        <main className={styles.page}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <Link href="/" className={styles.breadcrumbLink}>Home</Link>
                <span>›</span>
                <Link href="/categories" className={styles.breadcrumbLink}>Categories</Link>
                <span>›</span>
                <span className={styles.breadcrumbCurrent}>{category?.nama || slug}</span>
            </nav>

            <h1 className={styles.title}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>category</span>
                {category?.nama || slug}
            </h1>

            {catProducts.length > 0 ? (
                <>
                    <p className={styles.productCount}>
                        Showing <strong>{catProducts.length}</strong> products
                    </p>
                    <div className={styles.grid}>
                        {catProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.empty}>
                    <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-muted)' }}>
                        inventory_2
                    </span>
                    <h2>No Products Yet</h2>
                    <p>Products for this category are being prepared. Check back later!</p>
                    <Link href="/categories" className={styles.backBtn}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        See Other Categories
                    </Link>
                </div>
            )}
        </main>
    );
}
