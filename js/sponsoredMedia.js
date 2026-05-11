// ===================================
// SponsoredMedia — render display creatives by IAB-style format
// ===================================
//
// Tracking.renderDisplayAds calls SponsoredMedia.render(creative) for each
// element in adsData.display[]. We support four formats and gracefully no-op
// for anything else.
//
// Formats:
//   - BANNER                full-bleed image
//   - DISPLAY_BANNER        split content (text + CTA) / art (image)
//   - SPONSORED_BRAND_IMAGE shoppable carousel (re-uses .sm-shoppable band)
//   - NATIVE_BANNER         image with overlay text and auto-CTA
//
// Click + impression tracking is wired via data-ad-click and
// data-ad-impression attributes — same convention as renderSponsoredProduct.

import { escapeHtml, formatPrice } from './utils.js';
import { CatalogManager } from './catalog.js';

class SponsoredMedia {
    // Map every accepted creativeFormat string to the renderer it should use.
    // Mirakl Ads emits BANNER_IMAGE / NATIVE_IMAGE in real responses; the
    // design prototype used the shorter aliases. We normalize both.
    static FORMAT_ALIASES = {
        BANNER: 'BANNER',
        BANNER_IMAGE: 'BANNER',
        DISPLAY_BANNER: 'DISPLAY_BANNER',
        DISPLAY_BANNER_IMAGE: 'DISPLAY_BANNER',
        NATIVE_BANNER: 'NATIVE_BANNER',
        NATIVE_IMAGE: 'NATIVE_BANNER',
        SPONSORED_BRAND_IMAGE: 'SPONSORED_BRAND_IMAGE',
        SHOPPABLE: 'SPONSORED_BRAND_IMAGE'
    };

    static #unsupportedLogged = new Set();

    /**
     * Render a single display creative.
     * @param {Object} creative — element of adsData.display[]
     * @returns {string} HTML (empty for unsupported formats)
     */
    static render(creative) {
        if (!creative || !creative.creativeFormat) return '';
        const raw = creative.creativeFormat;
        const fmt = this.FORMAT_ALIASES[raw];

        if (!fmt) {
            if (!this.#unsupportedLogged.has(raw)) {
                console.warn('⚠️ [SPONSORED MEDIA] Unsupported creativeFormat:', raw);
                this.#unsupportedLogged.add(raw);
            }
            return '';
        }

        switch (fmt) {
            case 'BANNER':
                return this.renderBanner(creative);
            case 'DISPLAY_BANNER':
                return this.renderDisplayBanner(creative);
            case 'SPONSORED_BRAND_IMAGE':
                return this.renderShoppable(creative);
            case 'NATIVE_BANNER':
                return this.renderNativeBanner(creative);
            default:
                return '';
        }
    }

    /**
     * Pick the first field that looks like an image URL.
     * Tolerates varied API payload shapes — including the Mirakl Ads
     * creativeSet.asset.url path used by SPONSORED_BRAND_IMAGE responses.
     * @param {Object} payload
     * @returns {string|null}
     */
    static detectImageField(payload) {
        if (!payload) return null;
        // Mirakl Ads SBI: creativeSet.asset.url is the brand asset.
        const fromCreativeSet = payload.creativeSet?.asset?.url;
        if (fromCreativeSet) return fromCreativeSet;
        const direct = payload.imageUrl || payload.image || payload.url;
        if (direct) return direct;
        for (const k of Object.keys(payload)) {
            if (/image/i.test(k) && typeof payload[k] === 'string' && payload[k].startsWith('http')) {
                return payload[k];
            }
        }
        return null;
    }

    /**
     * Pick the first field that looks like a CTA label.
     * @param {Object} payload
     * @returns {string|null}
     */
    static detectCtaField(payload) {
        if (!payload) return null;
        const direct = payload.cta || payload.ctaText || payload.callToAction || payload.buttonText;
        if (direct) return direct;
        for (const k of Object.keys(payload)) {
            if (/cta|button|call/i.test(k) && typeof payload[k] === 'string') {
                return payload[k];
            }
        }
        return null;
    }

    static renderBanner(c) {
        const adId = c.adId || '';
        const link = c.redirectionUrl || c.clickUrl || '#';
        const image = this.detectImageField(c) || '';
        // Honor the creative's actual asset size when provided (e.g. "300:250").
        // We use the W:H pair both for aspect-ratio AND as max-width in pixels —
        // the banner displays at most at its native asset size, never larger.
        const fmtStr = c.creativeSet?.asset?.format || c.formatCode || '';
        const dims = this.#parseDimensions(fmtStr);
        const styleAttr = dims
            ? `style="aspect-ratio: ${dims.w} / ${dims.h}; max-width: ${dims.w}px;"`
            : '';
        const sizeClass = dims ? 'sm-sized' : (c.aspect === 'billboard' ? 'sm-billboard' : 'sm-leaderboard');
        return `
            <div class="ad-zone" data-creative-format="BANNER">
                <a class="sm-banner ${sizeClass} sm-fmt-banner"
                   ${styleAttr}
                   href="${escapeHtml(link)}"
                   data-ad-click="${escapeHtml(adId)}"
                   target="${link.startsWith('#') ? '_self' : '_blank'}"
                   rel="noopener">
                    <span class="sm-tag">Sponsored</span>
                    ${image ? `<img class="sm-fullimg" src="${escapeHtml(image)}" alt="${escapeHtml(c.title || 'Sponsored')}" data-ad-impression="${escapeHtml(adId)}" />` : ''}
                </a>
            </div>
        `;
    }

    /**
     * Parse a "WxH" / "W:H" / "W/H" format string into { w, h } integers.
     * Returns null if unparseable.
     */
    static #parseDimensions(str) {
        if (!str) return null;
        const m = String(str).match(/(\d+)\s*[:x\/]\s*(\d+)/);
        if (!m) return null;
        const w = parseInt(m[1], 10);
        const h = parseInt(m[2], 10);
        if (!w || !h) return null;
        return { w, h };
    }

    static renderDisplayBanner(c) {
        const adId = c.adId || '';
        const link = c.clickUrl || '#';
        const image = this.detectImageField(c) || '';
        const cta = this.detectCtaField(c) || 'Shop now';
        const title = c.title || c.headline || 'Sponsored';
        const subtitle = c.subtitle || c.description || '';
        return `
            <div class="ad-zone" data-creative-format="DISPLAY_BANNER">
                <div class="sm-banner sm-fmt-display">
                    <span class="sm-tag">Sponsored</span>
                    <div class="sm-content">
                        <h3>${escapeHtml(title)}</h3>
                        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
                        <a class="sm-cta"
                           href="${escapeHtml(link)}"
                           data-ad-click="${escapeHtml(adId)}"
                           target="${link.startsWith('#') ? '_self' : '_blank'}"
                           rel="noopener">
                            ${escapeHtml(cta)}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                    <div class="sm-art">
                        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" data-ad-impression="${escapeHtml(adId)}" />` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static renderNativeBanner(c) {
        const adId = c.adId || '';
        const link = c.clickUrl || '#';
        const image = this.detectImageField(c) || '';
        const cta = this.detectCtaField(c) || 'Discover';
        const title = c.title || c.headline || 'Sponsored';
        const subtitle = c.subtitle || c.description || '';
        return `
            <div class="ad-zone" data-creative-format="NATIVE_BANNER">
                <a class="sm-banner sm-billboard sm-fmt-native"
                   href="${escapeHtml(link)}"
                   data-ad-click="${escapeHtml(adId)}"
                   target="${link.startsWith('#') ? '_self' : '_blank'}"
                   rel="noopener">
                    <span class="sm-tag">Sponsored</span>
                    ${image ? `<img class="sm-fullimg" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" data-ad-impression="${escapeHtml(adId)}" />` : ''}
                    <div class="sm-overlay">
                        <div class="sm-overlay-text">
                            <h3>${escapeHtml(title)}</h3>
                            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
                            <span class="sm-cta">${escapeHtml(cta)}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    /**
     * SPONSORED_BRAND_IMAGE → shoppable carousel.
     * Layout: brand image card first (creativeSet.asset.url), then product cards.
     * The brand asset is sized via aspect-ratio so a 480:320 png never blows up the band.
     */
    static renderShoppable(c) {
        const adId = c.adId || '';
        const title = c.title || c.brandName || 'Sponsored Brand';
        const tag = 'Sponsored';
        const brandImage = this.detectImageField(c);
        const brandLink = c.redirectionUrl || c.clickUrl || '#';
        const brandLabel = c.digitalServiceAct?.behalf || c.brand || c.brandName || '';

        // resolveProduct — see Tracking.renderSponsoredBand for the why
        // (Mirakl Ads ID middle segment differs from catalog).
        const products = (c.products || []).map(p => {
            if (typeof p === 'string') {
                return CatalogManager.resolveProduct(p);
            }
            if (p && p.productId) {
                return CatalogManager.resolveProduct(p.productId) || p;
            }
            return p;
        }).filter(Boolean);

        const brandCardHtml = `
            <a class="sm-shop-brand-card"
               href="${escapeHtml(brandLink)}"
               data-ad-click="${escapeHtml(adId)}"
               target="${brandLink.startsWith('#') ? '_self' : '_blank'}"
               rel="noopener">
                ${brandImage ? `
                    <img src="${escapeHtml(brandImage)}"
                         alt="${escapeHtml(brandLabel || 'Sponsored brand')}"
                         data-ad-impression="${escapeHtml(adId)}"
                         onerror="this.parentElement.innerHTML='<div class=&quot;sm-shop-brand-ph&quot;>${escapeHtml(brandLabel || 'FEATURED')}</div>'" />
                ` : `
                    <div class="sm-shop-brand-ph">${escapeHtml(brandLabel || 'FEATURED')}</div>
                `}
                ${brandLabel ? `<div class="sm-shop-brand-label">${escapeHtml(brandLabel)}</div>` : ''}
            </a>
        `;

        const cardsHtml = products.map(p => this.#shopCard(p, adId)).join('');

        return `
            <div class="ad-zone" data-creative-format="SPONSORED_BRAND_IMAGE">
                <div class="sm-shoppable">
                    <div class="sm-shop-head">
                        <div class="sm-shop-title">${escapeHtml(title)}</div>
                        <div class="sm-shop-tag">${escapeHtml(tag)}</div>
                    </div>
                    <div class="sm-shop-body">
                        <button class="sm-shop-prev" type="button" aria-label="Previous" hidden>‹</button>
                        <div class="sm-shop-scroller">
                            ${brandCardHtml}
                            ${cardsHtml}
                        </div>
                        <button class="sm-shop-next" type="button" aria-label="Next" hidden>›</button>
                    </div>
                </div>
            </div>
        `;
    }

    static #shopCard(product, adId) {
        if (!product || !product.content) return '';
        const id = product.id;
        const name = product.content.name || id;
        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);
        const image = product.content.imageUrl || `https://placehold.co/220x220?text=${encodeURIComponent(id)}`;
        return `
            <div class="sm-shop-prod">
                <a href="#/product/${escapeHtml(id)}" data-ad-click="${escapeHtml(adId)}">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" data-ad-impression="${escapeHtml(adId)}"
                         onerror="this.src='https://placehold.co/220x220?text=${encodeURIComponent(id)}'" />
                    <div class="sm-shop-info">
                        ${brand ? `<div class="sm-shop-brand">${escapeHtml(brand)}</div>` : ''}
                        <div class="sm-shop-name">${escapeHtml(name)}</div>
                        <div class="sm-shop-line"></div>
                        <div class="sm-shop-prices">
                            ${price.hasPromo ? `<span class="sm-shop-strike">${escapeHtml(formatPrice(price.regular))}</span>` : ''}
                            <span class="sm-shop-price ${price.hasPromo ? 'has-promo' : ''}">
                                ${escapeHtml(formatPrice(price.hasPromo ? price.promo : price.regular))}
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    /**
     * After insertion, wire arrow buttons on shoppable carousels.
     * Idempotent — safe to call repeatedly on the same root element.
     * @param {HTMLElement} root
     */
    static activateShoppableScrollers(root) {
        if (!root) return;
        root.querySelectorAll('.sm-shop-body').forEach(body => {
            if (body.dataset.scrollerWired === '1') return;
            body.dataset.scrollerWired = '1';

            const scroller = body.querySelector('.sm-shop-scroller');
            const prev = body.querySelector('.sm-shop-prev');
            const next = body.querySelector('.sm-shop-next');
            if (!scroller || !prev || !next) return;

            const refresh = () => {
                const overflow = scroller.scrollWidth - scroller.clientWidth;
                if (overflow <= 1) {
                    prev.hidden = true;
                    next.hidden = true;
                    return;
                }
                prev.hidden = scroller.scrollLeft <= 4;
                next.hidden = scroller.scrollLeft >= overflow - 4;
            };

            prev.addEventListener('click', () => {
                scroller.scrollBy({ left: -240, behavior: 'smooth' });
            });
            next.addEventListener('click', () => {
                scroller.scrollBy({ left: 240, behavior: 'smooth' });
            });
            scroller.addEventListener('scroll', refresh, { passive: true });
            window.addEventListener('resize', refresh);
            // Initial state — defer one tick so layout settles
            requestAnimationFrame(refresh);
        });
    }
}

export { SponsoredMedia };
