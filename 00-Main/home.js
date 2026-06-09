// Terminal Security Sweep
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        console.warn("SYS.WARN :: UNAUTHORIZED ACCESS ATTEMPT DETECTED.");
        window.location.href = '../index.html';
        return; // Halt further execution
    }

import { auth } from '../script.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const btnEstop = document.getElementById('btn-estop');

    if (btnEstop) {
        btnEstop.addEventListener('click', async () => {
            try {
                // 1. Terminate the active Firebase Auth session
                await signOut(auth);
                
                // 2. Wipe the terminal's local memory cache
                localStorage.removeItem('activeStaffId');
                localStorage.removeItem('staffRole');
                
                // 3. Reroute back to the primary authentication screen
                window.location.href = '../index.html';
                
            } catch (error) {
                console.error("SYS.ERR :: Logout Sequence Failed:", error);
                alert("E-STOP MALFUNCTION. PLEASE CONTACT SYSTEM ADMIN.");
            }
        });
    }
});