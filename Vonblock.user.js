// ==UserScript==
// @name        Internal Rate Helper B
// @namespace   Violentmonkey Scripts
// @match       *://vanguard.heyprimo.com/*
// @updateURL   https://raw.githubusercontent.com/Cmphl/Quoteproto1/refs/heads/main/Vonblock.user.js
// @downloadURL https://raw.githubusercontent.com/Cmphl/Quoteproto1/refs/heads/main/Vonblock.user.js
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('payload')) return;

    const freightData = JSON.parse(atob(decodeURIComponent(urlParams.get('payload'))));

    const startBtn = document.createElement('button');
    startBtn.innerText = "🚀 RUN DATA INJECTION";
    startBtn.style.cssText = "position: fixed; bottom: 30px; right: 30px; z-index: 999999; padding: 20px 30px; background-color: #0056b3; color: white; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);";
    document.body.appendChild(startBtn);

    startBtn.onclick = async () => {
        startBtn.style.display = 'none';
        console.log("Commencing v11 Resilient Injection...");

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        function setZipValue(el, value) {
            if (!el) return false;
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeSetter.call(el, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }

        function setDimValue(el, value) {
            if (!el) return false;
            try {
                el.focus();
                if (el._valueTracker) el._valueTracker.setValue('');
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeSetter.call(el, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.blur();
                return true;
            } catch (error) {
                console.error("React dimension setter failed.", error);
                return false;
            }
        }

        async function handleAutocomplete(selector, zipCode) {
            const input = document.querySelector(selector);
            if (!input) return false;

            input.focus();
            input.click();

            setZipValue(input, zipCode);
            await sleep(600);

            input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown', keyCode: 40 }));

            let optionFound = false;
            for (let i = 0; i < 20; i++) {
                await sleep(250);
                const options = document.querySelectorAll('.MuiAutocomplete-option, li[role="option"]');

                if (options.length > 0) {
                    const targetOption = options[0];
                    targetOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    targetOption.click();
                    targetOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
                    optionFound = true;
                    break;
                }
            }
            return optionFound;
        }

        let formReady = false;
        for (let i = 0; i < 20; i++) {
            if (document.querySelector('#origin')) { formReady = true; break; }
            await sleep(250);
        }
        if (!formReady) return alert("Vanguard form not found.");

        await handleAutocomplete('#origin', freightData.originZip);
        await sleep(800);
        await handleAutocomplete('#destination', freightData.destinationZip);

        console.log("Routing locked. Waiting for Vanguard API...");
        await sleep(2500);

        if (freightData.pallets && freightData.pallets.length > 0) {
            for (let i = 0; i < freightData.pallets.length; i++) {
                try {
                    const p = freightData.pallets[i];

                    if (i > 0) {
                        // 1. Precise Text Targeting
                        const pTags = Array.from(document.querySelectorAll('p'));
                        const addText = pTags.find(el => el.textContent.includes("Add an extra piece"));

                        if (addText) {
                            console.log("Clicking 'Add an extra piece'...");

                            // 2. Click the text and its button wrapper to guarantee interaction
                            addText.click();
                            const wrapper = addText.closest('button') || addText.parentElement || addText.closest('div');
                            if (wrapper) wrapper.click();

                            // 3. Extended 10-Second Smart Watch
                            let rowSpawned = false;
                            for (let j = 0; j < 40; j++) {
                                if (document.querySelectorAll('input[name="length"]').length > i) {
                                    rowSpawned = true;
                                    await sleep(800); // Give the new row time to animate in
                                    break;
                                }
                                await sleep(250);
                            }

                            // 4. Removed the 'break;' so it never aborts early
                            if (!rowSpawned) {
                                console.warn("Script timed out waiting for row, but attempting injection anyway...");
                            }
                        } else {
                            console.error("Could not find the 'Add an extra piece' text.");
                        }
                    }

                    const items = document.querySelectorAll('input[name="itemName"]');
                    const qtys = document.querySelectorAll('input[placeholder="Quantity"]');
                    const lengths = document.querySelectorAll('input[name="length"]');
                    const widths = document.querySelectorAll('input[name="width"]');
                    const heights = document.querySelectorAll('input[name="height"]');
                    const weights = document.querySelectorAll('input[name="weight"]');

                    const commodity = p.commodity && p.commodity.trim() !== "" ? p.commodity : "FAK";

                    console.log(`Injecting Pallet ${i + 1}...`);

                    // Added 100ms micro-pauses between fields to ensure React catches every single input cleanly
                    if (items[i]) { setDimValue(items[i], commodity); await sleep(100); }
                    if (qtys[i]) { setDimValue(qtys[i], p.quantity || 1); await sleep(100); }
                    if (lengths[i]) { setDimValue(lengths[i], p.length); await sleep(100); }
                    if (widths[i]) { setDimValue(widths[i], p.width); await sleep(100); }
                    if (heights[i]) { setDimValue(heights[i], p.height); await sleep(100); }
                    if (weights[i]) { setDimValue(weights[i], p.weight); }

                    // A hefty pause at the end of the row so Vanguard's density API can finish
                    // before the loop repeats and clicks "Add piece" again.
                    await sleep(1500);

                } catch (err) {
                    console.error(`Crashed on pallet ${i+1}:`, err);
                }
            }
        }
        console.log("Injection Complete.");
    };
})();
