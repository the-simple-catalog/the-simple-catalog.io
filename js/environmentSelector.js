// ===================================
// Environment Selector
// Loads config/environments.json and renders a two-dropdown preset selector
// inside the T2S Configuration section of the Admin page.
//
// Both dropdowns include an "Other (manual)" option:
//   - Env "Other": hides the customer picker, invites the user to fill T2S fields below.
//   - Customer "Other": shows an inline text input for a custom customer ID.
// ===================================

import { escapeHtml } from './utils.js';
import { Settings } from './catalog.js';

const OTHER = '__other__';

class EnvironmentSelector {
    static #envs = [];

    // ===================================
    // Public API
    // ===================================

    /**
     * Fetch config/environments.json.
     * Returns [] on any error (missing file, bad JSON, wrong shape).
     * @returns {Promise<Array>}
     */
    static async load() {
        try {
            const response = await fetch('config/environments.json');
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    /**
     * Render the selector (or empty-state hint) into containerId.
     * Attaches all event listeners — no inline onclick handlers.
     * @param {string} containerId
     * @param {Array} envs
     */
    static render(containerId, envs) {
        const container = document.getElementById(containerId);
        if (!container) return;

        EnvironmentSelector.#envs = envs;

        if (!envs || envs.length === 0) {
            container.innerHTML = `
                <div style="
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 14px; margin-bottom: 20px;
                    background: var(--bg-secondary); border-radius: var(--radius-md);
                    font-size: 13px; color: var(--text-secondary);
                ">
                    <span style="font-size: 16px;">🌍</span>
                    <span>No environments configured — edit
                        <code style="background: var(--border); padding: 1px 5px; border-radius: 4px; font-size: 12px;">config/environments.json</code>
                        to add presets. See <code style="background: var(--border); padding: 1px 5px; border-radius: 4px; font-size: 12px;">config/environments.example.json</code> for the format.
                    </span>
                </div>`;
            return;
        }

        const envOptions = envs
            .map((env, i) => `<option value="${i}">${escapeHtml(env.name)}</option>`)
            .join('');

        container.innerHTML = `
            <div style="
                padding: 14px 16px; margin-bottom: 20px;
                background: var(--bg-secondary); border-radius: var(--radius-md);
                border: 1px solid var(--border);
            ">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary);
                            text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
                    🌍 Quick Preset
                </div>
                <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;">
                        <label class="form-label" style="font-size: 12px;">Environment</label>
                        <select id="env-sel-env" class="form-input" style="padding: 8px 10px;">
                            <option value="">— choose —</option>
                            ${envOptions}
                            <option value="${OTHER}">— Other (manual) —</option>
                        </select>
                    </div>
                    <div style="padding-bottom: 10px; color: var(--text-secondary); font-size: 16px;">→</div>
                    <div id="env-sel-customer-wrap" style="flex: 1; min-width: 150px;">
                        <label class="form-label" style="font-size: 12px;">Customer</label>
                        <select id="env-sel-customer" class="form-input" style="padding: 8px 10px;" disabled>
                            <option value="">— choose —</option>
                        </select>
                    </div>
                    <div>
                        <button id="env-sel-apply" class="btn btn-primary" disabled
                                style="white-space: nowrap; padding: 9px 18px;">
                            Apply ✓
                        </button>
                    </div>
                </div>
                <div id="env-sel-message" style="margin-top: 10px;"></div>
            </div>`;

        document.getElementById('env-sel-env')
            .addEventListener('change', () => EnvironmentSelector.#onEnvChange());
        document.getElementById('env-sel-customer')
            .addEventListener('change', () => EnvironmentSelector.#onCustomerChange());
        document.getElementById('env-sel-apply')
            .addEventListener('click', () => EnvironmentSelector.#apply());
    }

    // ===================================
    // Private handlers
    // ===================================

    static #onEnvChange() {
        const envSelect = document.getElementById('env-sel-env');
        const customerWrap = document.getElementById('env-sel-customer-wrap');
        const applyBtn = document.getElementById('env-sel-apply');

        // Reset customer area
        EnvironmentSelector.#resetCustomerArea();
        applyBtn.disabled = true;

        if (envSelect.value === OTHER) {
            // "Other" env: hide customer picker, invite manual editing below
            customerWrap.style.display = 'none';
            EnvironmentSelector.#showMsg(
                '📝 Enter T2S Tracking URL, Ads Server URL and Customer ID in the fields below.',
                'info'
            );
            applyBtn.style.display = 'none';
            return;
        }

        customerWrap.style.display = '';
        applyBtn.style.display = '';
        EnvironmentSelector.#clearMsg();

        const envIdx = parseInt(envSelect.value);
        if (isNaN(envIdx)) return;

        const env = EnvironmentSelector.#envs[envIdx];
        if (!env?.customers?.length) return;

        const customerSelect = document.getElementById('env-sel-customer');
        env.customers.forEach((c, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = c.name;
            customerSelect.appendChild(opt);
        });
        // "Other" option for customers not in the list
        const otherOpt = document.createElement('option');
        otherOpt.value = OTHER;
        otherOpt.textContent = '— Other (manual) —';
        customerSelect.appendChild(otherOpt);

        customerSelect.disabled = false;
    }

    static #onCustomerChange() {
        const customerSelect = document.getElementById('env-sel-customer');
        const applyBtn = document.getElementById('env-sel-apply');

        if (customerSelect.value === OTHER) {
            // Replace dropdown with an inline text input for custom customer ID
            const wrap = document.getElementById('env-sel-customer-wrap');
            wrap.innerHTML = `
                <label class="form-label" style="font-size: 12px;">Customer ID</label>
                <input
                    id="env-sel-custom-customer"
                    class="form-input"
                    style="padding: 8px 10px;"
                    placeholder="Enter customer ID"
                    autocomplete="off"
                />`;
            const customInput = document.getElementById('env-sel-custom-customer');
            customInput.addEventListener('input', () => {
                applyBtn.disabled = customInput.value.trim() === '';
            });
            applyBtn.disabled = true;
            return;
        }

        applyBtn.disabled = customerSelect.value === '';
    }

    static #apply() {
        const envSelect = document.getElementById('env-sel-env');
        const envIdx = parseInt(envSelect.value);
        if (isNaN(envIdx)) return;

        const env = EnvironmentSelector.#envs[envIdx];
        if (!env) return;

        // Resolve customer ID — either from dropdown or inline input
        let customerId, customerLabel;
        const customInput = document.getElementById('env-sel-custom-customer');
        if (customInput) {
            customerId = customInput.value.trim();
            customerLabel = customerId;
            if (!customerId) return;
        } else {
            const customerSelect = document.getElementById('env-sel-customer');
            const customerIdx = parseInt(customerSelect.value);
            if (isNaN(customerIdx)) return;
            const customer = env.customers?.[customerIdx];
            if (!customer) return;
            customerId = customer.customerId;
            customerLabel = customer.name;
        }

        Settings.save({
            trackingUrl: env.trackingUrl,
            adsServerUrl: env.adsServerUrl,
            t2sCustomerId: customerId,
        });

        // Update T2S form inputs live
        const trackingInput = document.getElementById('setting-tracking-url');
        const adsInput = document.getElementById('setting-ads-url');
        const customerInput = document.getElementById('setting-customer-id');
        if (trackingInput) trackingInput.value = env.trackingUrl;
        if (adsInput) adsInput.value = env.adsServerUrl;
        if (customerInput) customerInput.value = customerId;

        EnvironmentSelector.#showMsg(
            `✓ Settings saved — ${escapeHtml(env.name)} / ${escapeHtml(customerLabel)} applied.`,
            'success'
        );
        setTimeout(() => EnvironmentSelector.#clearMsg(), 3000);
    }

    // ===================================
    // Helpers
    // ===================================

    static #resetCustomerArea() {
        const wrap = document.getElementById('env-sel-customer-wrap');
        if (!wrap) return;
        wrap.style.display = '';
        wrap.innerHTML = `
            <label class="form-label" style="font-size: 12px;">Customer</label>
            <select id="env-sel-customer" class="form-input" style="padding: 8px 10px;" disabled>
                <option value="">— choose —</option>
            </select>`;
        document.getElementById('env-sel-customer')
            .addEventListener('change', () => EnvironmentSelector.#onCustomerChange());
    }

    static #showMsg(text, type) {
        const msg = document.getElementById('env-sel-message');
        if (!msg) return;
        const styles = type === 'success'
            ? 'background:#dcfce7; color:#16a34a;'
            : 'background:var(--bg-secondary); color:var(--text-secondary);';
        msg.innerHTML = `
            <div style="padding:8px 12px; border-radius:6px; font-size:13px; font-weight:500; ${styles}">
                ${escapeHtml(text)}
            </div>`;
    }

    static #clearMsg() {
        const msg = document.getElementById('env-sel-message');
        if (msg) msg.innerHTML = '';
    }
}

export { EnvironmentSelector };
