// ==UserScript==
// @name        Shippingright
// @namespace   Violentmonkey Scripts
// @match       *://ondemand.shiprite.com/*
// @updateURL   https://raw.githubusercontent.com/Cmphl/Quoteproto1/refs/heads/main/Shippingright.user.js
// @downloadURL https://raw.githubusercontent.com/Cmphl/Quoteproto1/refs/heads/main/Shippingright.user.js
// @grant       none
// ==/UserScript==

(async function() {
    'use strict';

    // Utility to pause execution so Angular can update the DOM
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function setVal(targetElement, value) {
        if (!targetElement) return false;
        try {
            targetElement.value = value;
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
            targetElement.dispatchEvent(new Event('change', { bubbles: true }));
            targetElement.dispatchEvent(new Event('blur', { bubbles: true }));
            return true;
        } catch (error) {
            console.error("Injection failed on element:", targetElement, error);
            return false;
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('payload')) return;

    const freightData = JSON.parse(atob(decodeURIComponent(urlParams.get('payload'))));
    console.log("Payload acquired. Waiting for Initial DOM...");

    // 1. Wait for Header Zips to load
    let zipsFound = false;
    while (!zipsFound) {
        const zips = document.querySelectorAll('.input');
        if (zips.length >= 2) {
            setVal(zips[0], freightData.originZip);
            setVal(zips[1], freightData.destinationZip);
            zipsFound = true;
        } else {
            await sleep(250);
        }
    }

    // 2. Iterate through Freight Array asynchronously
    if (freightData.pallets && freightData.pallets.length > 0) {
        for (let i = 0; i < freightData.pallets.length; i++) {
            const p = freightData.pallets[i];

            // Wait for the specific row index [i] to physically exist on the screen
            let currentRow = null;
            let retries = 0;
            while (!currentRow && retries < 20) {
                const rows = document.querySelectorAll('.productLine');
                if (rows.length > i) {
                    currentRow = rows[i];
                } else {
                    await sleep(200);
                    retries++;
                }
            }

            if (!currentRow) {
                console.error(`Row ${i} never rendered. Halting loop.`);
                break;
            }

            // TARGET FIX: Look strictly inside the Handling Unit column for the select element
            const handlingUnitDropdown = currentRow.querySelector('.handlingUnitTypeCol select') || currentRow.querySelector('.handlingUnitTypeCol .listSelect');
            setVal(handlingUnitDropdown, "1"); // 1 = Pallet

            // Inject remaining dimensions
            setVal(currentRow.querySelector('.handlingUnitQtyCol'), p.quantity || 1);
            setVal(currentRow.querySelector('.weightCol'), p.weight * (p.quantity || 1));
            setVal(currentRow.querySelector('.lengthCol'), p.length);
            setVal(currentRow.querySelector('.widthCol'), p.width);
            setVal(currentRow.querySelector('.heightCol'), p.height);

            const commodity = p.commodity && p.commodity.trim() !== "" ? p.commodity : "FAK";
            setVal(currentRow.querySelector('.productEntry'), commodity);

            console.log(`Pallet ${i + 1} injected.`);

            // Pause before the loop repeats to ensure Angular recognizes the input and spawns the NEXT row
            await sleep(350);
        }
    }

    console.log("All data injected. Awaiting human validation.");
    // Auto-submit block has been removed entirely.

})();
