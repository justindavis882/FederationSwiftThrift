import { auth } from '../script.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Terminal Security Sweep
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        console.warn("SYS.WARN :: UNAUTHORIZED ACCESS ATTEMPT DETECTED.");
        window.location.href = '../index.html';
        return; // Halt further execution of this function
    }

    // 2. Wire up the E-STOP / LOGOUT button
    const btnEstop = document.getElementById('btn-estop');

    // -- MODULE ROUTING --

    // Route to 03 - DONATIONS
    const btnDono = document.getElementById('btn-dono');
    if (btnDono) {
        btnDono.addEventListener('click', () => {
            // Step out of 00-Main and into 03-Dono
            window.location.href = '../03-Dono/index.html';
        });
    }

    // Route to 04 - BAG & TAG
    const btnBagTag = document.getElementById('btn-bagtag');
    if (btnBagTag) {
        btnBagTag.addEventListener('click', () => {
            window.location.href = '../04-BagTag/index.html';
        });
    }

    // Route to 07 - ECOMMERCE
    const btnEcom = document.getElementById('btn-ecom');
    if (btnEcom) {
        btnEcom.addEventListener('click', () => {
            // Step out of 00-Main and into 07-eCom
            window.location.href = '../07-eCom/index.html';
        });
    }
    
    // E-STOP / LOGOUT Sequence
    if (btnEstop) {
        btnEstop.addEventListener('click', async () => {
            try {
                // Terminate the active Firebase Auth session
                await signOut(auth);
                
                // Wipe the terminal's local memory cache
                localStorage.removeItem('activeStaffId');
                localStorage.removeItem('staffRole');
                
                // Reroute back to the primary authentication screen
                window.location.href = '../index.html';
                
            } catch (error) {
                console.error("SYS.ERR :: Logout Sequence Failed:", error);
                alert("E-STOP MALFUNCTION. PLEASE CONTACT SYSTEM ADMIN.");
            }
        });
    }
});