import { auth, db } from '../script.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Terminal Security Sweep
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        console.warn("SYS.WARN :: UNAUTHORIZED ACCESS ATTEMPT DETECTED.");
        window.location.href = '../index.html';
        return; 
    }

    // 2. Form Submission & Payload Injection
    const donoForm = document.getElementById('dono-form');
    
    if (donoForm) {
        donoForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard page reload
            
            // Gather hardware inputs
            const desc = document.getElementById('item-desc').value;
            const category = document.getElementById('item-category').value;
            const condition = document.getElementById('item-condition').value;
            const destination = document.getElementById('item-destination').value;

            try {
                // Write directly to the Firestore inventory collection
                await addDoc(collection(db, "inventory"), {
                    description: desc,
                    category: category,
                    condition: condition,
                    routing: destination,
                    staffBarcode: activeUser, // Your 12-digit hardware ID for physical records
                    intakeStaffId: auth.currentUser.uid, // The internal Firebase UID to pass the security rule
                    status: "PENDING_PROCESSING",
                    timestamp: serverTimestamp()
                });

                // Clear the form and reset focus for rapid scanning
                alert(`SYS.MSG :: ITEM LOGGED. ROUTE TO: ${destination.toUpperCase()}`);
                donoForm.reset();
                document.getElementById('item-desc').focus();

            } catch (error) {
                console.error("SYS.ERR :: INTAKE WRITE FAILED:", error);
                alert("DATABASE WRITE ERROR. VERIFY PERMISSIONS.");
            }
        });
    }

    // 3. Navigation Controls
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = '../00-Main/home.html';
        });
    }

    // 4. E-STOP / LOGOUT
    const btnEstop = document.getElementById('btn-estop');
    if (btnEstop) {
        btnEstop.addEventListener('click', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem('activeStaffId');
                localStorage.removeItem('staffRole');
                window.location.href = '../index.html';
            } catch (error) {
                console.error("SYS.ERR :: Logout Sequence Failed:", error);
            }
        });
    }
});