import { auth, db, storage } from '../script.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// LUHN ALGORITHM: 02 Prefix for eCommerce
function generateEcomBarcode() {
    const prefix = "02"; // 02 = eCom Items
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
    // 1. Terminal Security Sweep
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        window.location.href = '../index.html';
        return; 
    }

    // 2. UI Elements & Tab Navigation
    const tabs = {
        draft: document.getElementById('tab-draft'),
        fulfill: document.getElementById('tab-fulfill'),
        history: document.getElementById('tab-history')
    };
    const views = {
        draft: document.getElementById('view-draft'),
        fulfill: document.getElementById('view-fulfill'),
        history: document.getElementById('view-history')
    };
    const statusIndicator = document.getElementById('status-indicator');
    
    function switchTab(target) {
        Object.keys(tabs).forEach(key => {
            tabs[key].classList.remove('active-mode');
            views[key].classList.add('hidden');
        });
        tabs[target].classList.add('active-mode');
        views[target].classList.remove('hidden');
        statusIndicator.textContent = `MODE: ${target.toUpperCase()}`;
    }

    tabs.draft.addEventListener('click', () => switchTab('draft'));
    tabs.fulfill.addEventListener('click', () => switchTab('fulfill'));
    tabs.history.addEventListener('click', () => switchTab('history'));

    // 3. --- DRAFTING & LISTING WORKFLOW ---
    const pendingQueue = document.getElementById('pending-queue');
    const ecomForm = document.getElementById('ecom-form');
    const prodTitle = document.getElementById('prod-title');
    const printZone = document.getElementById('print-zone');

    async function loadEcomQueue() {
        pendingQueue.innerHTML = '<option value="" disabled selected>-- SELECT E-COM ITEM --</option>';
        
        // Fetch items routed specifically to ecom_tote from Donations
        const q = query(
            collection(db, "inventory"), 
            where("status", "==", "PENDING_PROCESSING"),
            where("routing", "==", "ecom_tote")
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
            console.error("SYS.ERR :: ECOM QUEUE LOAD FAILED:", error);
        }
    }

    await loadEcomQueue();

    // Auto-fill title based on queue selection
    pendingQueue.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption && selectedOption.dataset.desc) {
            prodTitle.value = selectedOption.dataset.desc.toUpperCase();
        }
    });

    if (ecomForm) {
        ecomForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const docId = pendingQueue.value;
            const title = prodTitle.value;
            const price = parseFloat(document.getElementById('prod-price').value).toFixed(2);
            const desc = document.getElementById('prod-desc').value;
            const stagingTote = document.getElementById('staging-tote').value.toUpperCase();
            
            const barcode = generateEcomBarcode();
            const dateListed = new Date().toLocaleDateString('en-US');

            try {
                // Visually lock the form during upload
                const submitBtn = document.querySelector('#ecom-form .action-key');
                submitBtn.textContent = "UPLOADING MEDIA... PLEASE WAIT";
                submitBtn.disabled = true;

                // Process and Upload Images to Firebase Storage
                const photoInput = document.getElementById('prod-photos');
                const files = Array.from(photoInput.files);
                const imageUrls = [];

                for (const file of files) {
                    const uniqueRef = ref(storage, `ecom_images/${barcode}_${Date.now()}_${file.name}`);
                    const uploadResult = await uploadBytes(uniqueRef, file);
                    const downloadUrl = await getDownloadURL(uploadResult.ref);
                    imageUrls.push(downloadUrl);
                }

                // Push finalized data to Firestore
                const itemRef = doc(db, "inventory", docId);
                await updateDoc(itemRef, {
                    webTitle: title,
                    webPrice: price,
                    webDescription: desc,
                    photos: imageUrls, 
                    barcode: barcode,
                    toteLocation: stagingTote,
                    processedBy: activeUser,
                    staffBarcode: activeUser, // Required for security rules
                    status: "ACTIVE_LISTING", // Flags for frontend storefront display
                    updatedAt: serverTimestamp()
                });

                // Build A2 Thermal Label HTML
                printZone.innerHTML = `
                    <div class="thermal-label">
                        <div class="label-header">
                            <span style="font-size: 14px;">${title.substring(0, 25)}</span>
                            <span style="font-size: 10px;">${dateListed}</span>
                        </div>
                        <div class="tote-id">TOTE: ${stagingTote}</div>
                        <div class="label-barcode"><svg class="barcode-svg"></svg></div>
                    </div>
                `;

                // Render Code 128 Barcode
                JsBarcode(".barcode-svg", barcode, {
                    format: "CODE128",
                    displayValue: true, 
                    fontSize: 14,
                    fontOptions: "bold",
                    font: "monospace",
                    margin: 0,
                    height: 50,
                    width: 2
                });

                // Fire Printer
                window.print();
                
                // Reset Form & Queue
                ecomForm.reset();
                submitBtn.textContent = "PUBLISH TO WEB & PRINT A2 TAG";
                submitBtn.disabled = false;
                await loadEcomQueue();

            } catch (error) {
                console.error("SYS.ERR :: WEB PUBLISH FAILED:", error);
                alert("DATABASE OR UPLOAD ERROR. CHECK NETWORK.");
                document.querySelector('#ecom-form .action-key').disabled = false;
            }
        });
    }

    // 4. --- NAVIGATION & E-STOP ---
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