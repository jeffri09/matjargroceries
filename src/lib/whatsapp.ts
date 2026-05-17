import type { CartItem } from '@/types';
import { formatHarga } from './utils';

interface CheckoutData {
    orderId: string;
    nama: string;
    telepon: string;
    alamat: string;
    catatan?: string;
    jadwal: string;
    metodePay: string;
    items: CartItem[];
    subtotal: number;
    ongkir: number;
    total: number;
    diskon?: number;
    kupon?: string;
    linkMaps?: string;
}

/**
 * Generate formatted WhatsApp order message (English, USD)
 */
export function generateWAMessage(data: CheckoutData): string {
    const orderId = data.orderId;
    const tanggal = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let msg = `🛒 *NEW ORDER — MATJAR GROCERIES*\n`;
    msg += `━━━━━━━━━━━━━━━━\n`;
    msg += `📋 ID: *${orderId}*\n`;
    msg += `📅 ${tanggal}\n\n`;

    msg += `👤 *Recipient Info*\n`;
    msg += `Name: ${data.nama}\n`;
    msg += `Phone: ${data.telepon}\n`;
    msg += `Address: ${data.alamat}\n`;
    if (data.linkMaps) {
        msg += `📍 Location: ${data.linkMaps}\n`;
    }
    msg += `\n`;

    msg += `🧺 *Order Details*\n`;
    msg += `━━━━━━━━━━━━━━━━\n`;
    data.items.forEach((item, i) => {
        const harga = item.harga + (item.tambahan || 0);
        msg += `${i + 1}. ${item.nama}`;
        if (item.variasi) msg += ` (${item.variasi})`;
        msg += `\n`;
        msg += `   ${item.qty}x ${formatHarga(harga)} = ${formatHarga(harga * item.qty)}\n`;
        if (item.catatan) msg += `   📝 ${item.catatan}\n`;
    });
    msg += `━━━━━━━━━━━━━━━━\n`;

    msg += `\n💰 *Summary*\n`;
    msg += `Subtotal: ${formatHarga(data.subtotal)}\n`;
    if (data.diskon && data.diskon > 0) {
        msg += `Discount${data.kupon ? ` (${data.kupon})` : ''}: -${formatHarga(data.diskon)}\n`;
    }
    msg += `Shipping: ${data.ongkir === 0 ? 'FREE 🎉' : formatHarga(data.ongkir)}\n`;
    msg += `*TOTAL: ${formatHarga(data.total)}*\n\n`;

    msg += `🚚 Schedule: ${data.jadwal}\n`;
    msg += `💳 Payment: ${data.metodePay}\n`;

    if (data.catatan) {
        msg += `\n📝 Note: ${data.catatan}\n`;
    }

    msg += `\n_Thank you for shopping at Matjar Groceries! 🥬_`;

    return msg;
}

/**
 * Generate WhatsApp click-to-chat URL.
 * Normalizes phone numbers to US format (+1) by default.
 * If phone starts with 1, keeps as-is. Otherwise prepends 1.
 */
export function generateWALink(phone: string, message: string): string {
    // Strip everything except digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let formatted = cleanPhone;
    // If already starts with country code (1), keep it
    if (!formatted.startsWith('1')) {
        // If it looks like US format without country code (10 digits)
        if (formatted.length === 10) {
            formatted = '1' + formatted;
        } else {
            // Trust the input — assume already has country code
            formatted = cleanPhone;
        }
    }
    return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

/**
 * Default store WhatsApp number (US format)
 */
export const DEFAULT_WA_NUMBER = '12125550123';
