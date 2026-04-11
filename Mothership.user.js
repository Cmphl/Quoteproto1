// ==UserScript==
// @name        Mothership Quote Injector (v6 - Direct Enter)
// @namespace   Violentmonkey Scripts
// @match       *://dashboard.mothership.com/*
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('payload')) return;

    const freightData = JSON.parse(atob(decodeURIComponent(urlParams.get('payload'))));

    const startBtn = document.createElement('button');
    startBtn.innerText = "🚀 RUN DATA INJECTION";
    startBtn.style.cssText = "position: fixed; bottom: 30px; right: 30px; z-index: 999999; padding: 20px 30px; background-color: #000000; color: white; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);";
    document.body.appendChild(startBtn);

    startBtn.onclick = async () => {
        startBtn.style.display = 'none'; 
        console.log("Commencing Mothership v6 Injection...");

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        function setReactValue(el, value) {
            if (!el) return false;
            try {
                el.focus();
                if (el._valueTracker) el._valueTracker.setValue(''); 
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeSetter.call(el, String(value));
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.blur(); 
                return true;
            } catch (error) {
                console.error("React value setter failed.", error);
                return false;
            }
        }

        async function simulateTyping(el, text) {
            if (!el) return false;
            el.focus();
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            let str = String(text);
            let current = "";
            for (let char of str) {
                current += char;
                nativeSetter.call(el, current);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(50); 
            }
            return true;
        }

        async function handleAutocomplete(selector, zipCode) {
            const input = document.querySelector(selector);
            if (!input) return false;

            input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            input.focus();
            input.click();
            
            await simulateTyping(input, zipCode);
            
            console.log(`Waiting for ${zipCode} dropdown to render...`);
            await sleep(2000); 

            // FIX: Removed ArrowDown. Just hitting Enter locks in the auto-highlighted top result.
            console.log("Executing Enter...");
            input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
            await sleep(800); 

            // Backup DOM clicker just in case Enter misses
            const options = document.querySelectorAll('[role="option"], li[role="option"], .pac-item, div[class*="option"], li[class*="option"]');
            if (options.length > 0) {
                options[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                options[0].click();
                options[0].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            }
            return true;
        }

        // --- 1. Aggressive Single Shipment Clicker ---
        console.log("Hunting for Single Shipment button...");
        let singleShipmentFound = false;
        for (let i = 0; i < 15; i++) {
            const elements = Array.from(document.querySelectorAll('div, p, span, h3'));
            const btnText = elements.find(el => el.textContent.trim() === "Ship cargo from one location to another");
            
            if (btnText) {
                btnText.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                btnText.click();
                btnText.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                if (btnText.parentElement) btnText.parentElement.click();
                singleShipmentFound = true;
                break;
            }
            await sleep(250);
        }

        // --- 2. Smart Wait for Form ---
        let formReady = false;
        for (let i = 0; i < 40; i++) {
            if (document.querySelector('[data-testid="quote-create-pickup-input-search"]')) {
                formReady = true;
                await sleep(1000); 
                break;
            }
            await sleep(250);
        }
        if (!formReady) return alert("Mothership form failed to load.");

        // --- 3. Routing ---
        await handleAutocomplete('[data-testid="quote-create-pickup-input-search"]', freightData.originZip);
        await sleep(1000); 
        await handleAutocomplete('[data-testid="quote-create-delivery-input-search"]', freightData.destinationZip);
        await sleep(1500); 

        // --- 4. The Accessorial Fix ---
        console.log("Hunting for Accessorials Menu Trigger...");
        const accessorialTrigger = document.querySelector('[data-testid="address-book-accessorials-trigger"]');

        if (accessorialTrigger) {
            accessorialTrigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            accessorialTrigger.click();
            accessorialTrigger.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

            await sleep(800); 

            const cfsCheckbox = document.querySelector('[data-testid="address-book-accessorials-option-cfs"]');
            if (cfsCheckbox) {
                cfsCheckbox.click();
                await sleep(400); 
                accessorialTrigger.click(); 
                await sleep(400);
            }
        }

        // --- 5. Freight Array ---
        if (freightData.pallets && freightData.pallets.length > 0) {
            for (let i = 0; i < freightData.pallets.length; i++) {
                try {
                    const p = freightData.pallets[i];
                    
                    if (i > 0) {
                        const addBtn = document.querySelector('[data-testid="cargo-add-button"]');
                        if (addBtn) {
                            addBtn.click();
                            for (let j = 0; j < 30; j++) {
                                if (document.querySelectorAll('[data-testid="cargo-quantity-input"]').length > i) {
                                    await sleep(800); 
                                    break;
                                }
                                await sleep(200);
                            }
                        }
                    }

                    const qtys = document.querySelectorAll('[data-testid="cargo-quantity-input"]');
                    const lengths = document.querySelectorAll('[data-testid="cargo-length-input"]');
                    const widths = document.querySelectorAll('[data-testid="cargo-width-input"]');
                    const heights = document.querySelectorAll('[data-testid="cargo-height-input"]');
                    const weights = document.querySelectorAll('[data-testid="cargo-weight-input"]');

                    console.log(`Injecting Pallet ${i + 1}...`);
                    const totalLineWeight = p.weight * (p.quantity || 1);

                    if (qtys[0]) { setReactValue(qtys[0], String(p.quantity || 1)); await sleep(100); }
                    if (lengths[0]) { setReactValue(lengths[0], String(p.length)); await sleep(100); }
                    if (widths[0]) { setReactValue(widths[0], String(p.width)); await sleep(100); }
                    if (heights[0]) { setReactValue(heights[0], String(p.height)); await sleep(100); }
                    if (weights[0]) { setReactValue(weights[0], String(totalLineWeight)); }
                    
                    await sleep(1000); 

                } catch (err) {
                    console.error(`Crashed on pallet ${i+1}:`, err);
                }
            }
        }
        console.log("Mothership Injection Complete.");
    };
})();