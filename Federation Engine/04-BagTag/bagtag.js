import { auth, db } from '../script.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// LUHN ALGORITHM: Generates the 12th Checksum Digit
function generateBarcode() {
    const prefix = "01";
    const itemId = Math.floor(100000000 + Math.random() * 900000000).toString();
    const base = prefix + itemId;
    
    let sum = 0;
    let isEven = false;
    for (let i = base.length - 1; i >= 0; i--) {
        let digit = parseInt(base.charAt(i), 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return base + checksum.toString();
}

document.addEventListener('DOMContentLoaded', async () => {
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        window.location.href = '../index.html';
        return; 
    }

    // UI Elements
    const btnModeFast = document.getElementById('btn-mode-fast');
    const btnModeQueue = document.getElementById('btn-mode-queue');
    const queueContainer = document.getElementById('queue-container');
    const categoryContainer = document.getElementById('category-container');
    const pendingQueue = document.getElementById('pending-queue');
    const itemCategory = document.getElementById('item-category');
    const prodName = document.getElementById('prod-name');
    const tagForm = document.getElementById('tag-form');
    const btnSubmit = document.getElementById('btn-submit');
    const printZone = document.getElementById('print-zone');

    let currentMode = 'fast-track';

    // --- UI MODE TOGGLES ---
    btnModeFast.addEventListener('click', () => {
        currentMode = 'fast-track';
        btnModeFast.classList.add('active-mode');
        btnModeQueue.classList.remove('active-mode');
        queueContainer.classList.add('hidden');
        categoryContainer.classList.remove('hidden');
        pendingQueue.removeAttribute('required');
        itemCategory.setAttribute('required', 'true');
        btnSubmit.textContent = "FAST-TRACK & PRINT";
        tagForm.reset();
    });

    btnModeQueue.addEventListener('click', () => {
        currentMode = 'queue';
        btnModeQueue.classList.add('active-mode');
        btnModeFast.classList.remove('active-mode');
        queueContainer.classList.remove('hidden');
        categoryContainer.classList.add('hidden');
        pendingQueue.setAttribute('required', 'true');
        itemCategory.removeAttribute('required');
        btnSubmit.textContent = "UPDATE QUEUE & PRINT";
        tagForm.reset();
        loadQueue(); // Refresh queue when mode is selected
    });

    // --- PENDING QUEUE LOGIC ---
    async function loadQueue() {
        pendingQueue.innerHTML = '<option value="" disabled selected>-- SELECT PENDING ITEM --</option>';
        const q = query(
            collection(db, "inventory"), 
            where("status", "==", "PENDING_PROCESSING"),
            where("routing", "==", "bag_tag")
        );

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                pendingQueue.innerHTML = '<option value="" disabled selected>-- QUEUE EMPTY --</option>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${data.description.toUpperCase()} (${data.condition.toUpperCase()})`;
                option.dataset.desc = data.description; 
                pendingQueue.appendChild(option);
            });
        } catch (error) {
            console.error("SYS.ERR :: QUEUE LOAD FAILED:", error);
        }
    }

    pendingQueue.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption && selectedOption.dataset.desc) {
            prodName.value = selectedOption.dataset.desc.toUpperCase();
        }
    });

    // --- SUBMISSION ENGINE ---
    if (tagForm) {
        tagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = prodName.value.toUpperCase();
            const price = parseFloat(document.getElementById('prod-price').value).toFixed(2);
            let size = document.getElementById('prod-size').value.toUpperCase();
            if (!size) size = "N/A";
            const labelType = document.getElementById('label-type').value;
            
            const barcode = generateBarcode();
            const datePrinted = new Date().toLocaleDateString('en-US');

            try {
                if (currentMode === 'fast-track') {
                    // Create a brand new database entry
                    await addDoc(collection(db, "inventory"), {
                        description: name,
                        category: itemCategory.value,
                        price: price,
                        size: size,
                        barcode: barcode,
                        labelFormat: labelType,
                        processedBy: activeUser,
                        staffBarcode: activeUser, // Hardware ID for the role check
                        intakeStaffId: auth.currentUser.uid, // <-- ADDED: Digital signature to pass Firestore rules
                        status: "FLOOR_READY",
                        timestamp: serverTimestamp()
                    });
                } else {
                    // Update an existing high-value entry
                    const docId = pendingQueue.value;
                    const itemRef = doc(db, "inventory", docId);
                    await updateDoc(itemRef, {
                        description: name,
                        price: price,
                        size: size,
                        barcode: barcode,
                        labelFormat: labelType,
                        processedBy: activeUser,
                        staffBarcode: activeUser, // Pass security rules
                        status: "FLOOR_READY",
                        updatedAt: serverTimestamp()
                    });
                }

                // Build the physical label HTML based on format
                let labelHTML = '';

                if (labelType === 'A3') {
                    // Dual Rip & Pay Layout
                    labelHTML = `
                        <div class="thermal-label label-A3">
                            <div class="a3-half">
                                <div class="label-header"><span>${name}</span><span>${datePrinted}</span></div>
                                <div class="label-price">$${price}</div>
                                <div class="label-barcode"><svg class="barcode-svg"></svg></div>
                                <div class="label-meta"><span>SIZE: ${size}</span></div>
                            </div>
                            
                            <div class="rip-line">
                                ✂ - - - RIP & BRING TO REGISTER - - - ✂
                            </div>
                            
                            <div class="a3-half">
                                <div class="label-header"><span>${name}</span><span>${datePrinted}</span></div>
                                <div class="label-price">$${price}</div>
                                <div class="label-barcode"><svg class="barcode-svg"></svg></div>
                                <div class="label-meta"><span>SIZE: ${size}</span></div>
                            </div>
                        </div>
                    `;
                } else {
                    // Standard Single Layout (A1 & A2)
                    labelHTML = `
                        <div class="thermal-label label-${labelType}">
                            <div class="label-header"><span>${name}</span><span>${datePrinted}</span></div>
                            <div class="label-price">$${price}</div>
                            <div class="label-barcode"><svg class="barcode-svg"></svg></div>
                            <div class="label-meta"><span>SIZE: ${size}</span></div>
                        </div>
                    `;
                }

                printZone.innerHTML = labelHTML;

                // Dynamically scale the barcode based on the label size
                let barHeight = (labelType === 'A1') ? 24 : 40;
                let barWidth = (labelType === 'A1') ? 1.5 : 2;
                let barFontSize = (labelType === 'A1') ? 11 : 14;

                // Command JsBarcode to draw the Code 128 symbology into ALL matching SVGs
                JsBarcode(".barcode-svg", barcode, {
                    format: "CODE128",
                    displayValue: true, 
                    fontSize: barFontSize,
                    fontOptions: "bold",
                    font: "monospace",
                    margin: 0,
                    height: barHeight,
                    width: barWidth
                });

                // Trigger the hardware printer
                window.print();

                // Reset and prep for next item
                tagForm.reset();
                if (currentMode === 'queue') await loadQueue();
                prodName.focus();

            } catch (error) {
                console.error("SYS.ERR :: SUBMISSION FAILED:", error);
                alert("DATABASE ERROR. CHECK NETWORK OR PERMISSIONS.");
            }
        });
    }

    // --- NAV & ESTOP ---
    const btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', () => window.location.href = '../00-Main/home.html');

    const btnEstop = document.getElementById('btn-estop');
    if (btnEstop) {
        btnEstop.addEventListener('click', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem('activeStaffId');
                window.location.href = '../index.html';
            } catch (error) {
                console.error("SYS.ERR :: Logout Sequence Failed:", error);
            }
        });
    }
});