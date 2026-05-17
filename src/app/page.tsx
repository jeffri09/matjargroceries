import Image from 'next/image';
import Link from 'next/link';
import ProductGridLoadMore from '@/components/product/ProductGridLoadMore';
import PromoSlider from '@/components/home/PromoSlider';
import type { Product, Category } from '@/types';
import styles from './page.module.css';
import productsData from '../../public/data/products.json';
import categoriesData from '../../public/data/categories.json';
import slidersData from '../../public/data/sliders.json';

export default function HomePage() {
  const products = productsData as Product[];
  const categories = categoriesData as Category[];

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Matjar Groceries',
        url: 'https://matjargroceries.com',
        logo: 'https://matjargroceries.com/icons/logo.png',
        description: 'Online halal grocery store. Fresh daily groceries delivered fast.',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: 'United Statesn',
        },
      },
      {
        '@type': 'WebSite',
        name: 'Matjar Groceries',
        url: 'https://matjargroceries.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://matjargroceries.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        name: 'Featured Products',
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.nama,
            url: `https://matjargroceries.com/product/${p.slug}`,
            image: p.foto_utama,
            offers: {
              '@type': 'Offer',
              price: p.harga_diskon || p.harga,
              priceCurrency: 'IDR',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
    ],
  };

  const menuItems = [
    { icon: 'home', label: 'Home', active: true, filled: true },
    { icon: 'local_offer', label: 'Special Offers', active: false },
    { icon: 'trending_up', label: 'Best Sellers', active: false },
    { icon: 'new_releases', label: 'Newest', active: false },
  ];

  const categoryColors: Record<string, string> = {
    'nutrition': '#16a34a',
    'emoji_nature': '#f97316',
    'set_meal': '#ef4444',
    'soup_kitchen': '#ca8a04',
    'local_cafe': '#3b82f6',
    'cookie': '#a855f7',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.main}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} custom-scrollbar`} aria-label="Category navigation">
          <nav>
            {/* Main Menu */}
            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarLabel}>Main Menu</h2>
              <div className={styles.sidebarNav}>
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href="#"
                    className={`${styles.sidebarLink} ${item.active ? styles.sidebarLinkActive : ''}`}
                  >
                    <span
                      className={`material-symbols-outlined ${item.filled ? 'filled' : ''} ${styles.sidebarIcon}`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarLabel}>Categories</h2>
              <div className={styles.sidebarNav}>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className={styles.sidebarLink}
                  >
                    <span
                      className={`material-symbols-outlined ${styles.sidebarIcon}`}
                      style={{ '--hover-color': categoryColors[cat.icon_url] || '#16a34a' } as React.CSSProperties}
                    >
                      {cat.icon_url}
                    </span>
                    {cat.nama}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Member Plus */}
          <div className={styles.memberBox}>
            <div className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>
                  workspace_premium
                </span>
                <h3 className={styles.memberTitle}>Member Plus</h3>
              </div>
              <p className={styles.memberDesc}>
                Get free shipping with no minimum order.
              </p>
              <button className={styles.memberBtn}>Upgrade Now</button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          {/* Promo Slider */}
          <PromoSlider slides={slidersData} />

          {/* Featured Products */}
          <section aria-label="Product unggulan">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined filled" style={{ color: 'var(--color-primary)' }}>
                  verified
                </span>
                Featured Products
              </h2>
              <Link href="/categories/semua" className={styles.sectionLink}>
                View All
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  chevron_right
                </span>
              </Link>
            </div>

            <ProductGridLoadMore products={products} />
          </section>

          {/* Trust Badges */}
          <section className={styles.trustSection} aria-label="Service highlights">
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  local_shipping
                </span>
              </div>
              <div>
                <h3 className={styles.trustTitle}>Fast Delivery</h3>
                <p className={styles.trustDesc}>Your order ships out the same day.</p>
              </div>
            </div>

            <div className={styles.trustDivider} />

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  verified_user
                </span>
              </div>
              <div>
                <h3 className={styles.trustTitle}>Quality Guarantee</h3>
                <p className={styles.trustDesc}>Fresh, high-quality products.</p>
              </div>
            </div>

            <div className={styles.trustDivider} />

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  support_agent
                </span>
              </div>
              <div>
                <h3 className={styles.trustTitle}>24/7 Support</h3>
                <p className={styles.trustDesc}>Our customer support is ready to help you.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
