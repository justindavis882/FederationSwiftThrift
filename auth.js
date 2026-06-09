import { auth, db } from './script.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('staff-id');
    const feedbackDiv = document.getElementById('auth-feedback');
    const numKeys = document.querySelectorAll('.num-key:not(.action-key)');
    const btnClear = document.getElementById('btn-clear');
    const btnEnter = document.getElementById('btn-enter');

    inputField.focus();

    document.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            inputField.focus();
        }
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processAuthCode(inputField.value);
        }
    });

    inputField.addEventListener('input', (e) => {
        inputField.value = inputField.value.replace(/[^0-9]/g, '');
    });

    numKeys.forEach(btn => {
        btn.addEventListener('click', () => {
            if (inputField.value.length < 12) {
                inputField.value += btn.getAttribute('data-val');
            }
        });
    });

    btnClear.addEventListener('click', () => {
        inputField.value = '';
        clearFeedback();
        inputField.focus();
    });

    btnEnter.addEventListener('click', () => {
        processAuthCode(inputField.value);
    });

    // Async function to handle Firebase Auth
    async function processAuthCode(code) {
        clearFeedback();

        if (code.length !== 12) {
            showFeedback('ERR: INVALID LENGTH (REQ 12)', 'error');
            return;
        }

        if (!code.startsWith('08')) {
            showFeedback('ERR: UNKNOWN PREFIX REGION', 'error');
            return;
        }

        showFeedback('AUTHENTICATING...', 'success');

        try {
            // 1. Sign in silently to generate a session
            const userCredential = await signInAnonymously(auth);
            const anonUid = userCredential.user.uid;

            // 2. Query Firestore for the physical Barcode ID
            const employeeRef = doc(db, 'employees', code);
            const employeeSnap = await getDoc(employeeRef);

            if (employeeSnap.exists()) {
                // 3. Link the session to the physical ID
                await updateDoc(employeeRef, { 
                    anonUID: anonUid,
                    lastLogin: new Date()
                });

                // 4. Store active state for the dashboard and redirect
                localStorage.setItem('activeStaffId', code);
                localStorage.setItem('staffRole', employeeSnap.data().role);
                
                showFeedback('SYS.AUTH :: GRANTED. REDIRECTING...', 'success');
                
                // Slight delay to allow the user to see the success message
                setTimeout(() => {
                    window.location.href = '00-Main/home.html';
                }, 800);

            } else {
                showFeedback('ERR: CREDENTIAL NOT FOUND IN DB', 'error');
                // Clean up the anonymous session if they aren't a real employee
                await auth.signOut();
                inputField.value = '';
            }

        } catch (error) {
            console.error("Auth Exception:", error);
            showFeedback('ERR: NETWORK TIMEOUT OR DB FAULT', 'error');
            inputField.value = '';
        }
    }

    function showFeedback(message, type) {
        feedbackDiv.textContent = message;
        if (type === 'error') {
            feedbackDiv.className = 'feedback-message feedback-error';
        } else {
            feedbackDiv.className = 'feedback-message feedback-success';
        }
    }

    function clearFeedback() {
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback-message';
    }
});