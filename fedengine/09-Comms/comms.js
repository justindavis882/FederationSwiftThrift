import { auth, db } from '../script.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const activeUser = localStorage.getItem('activeStaffId');
    if (!activeUser) {
        window.location.href = '../index.html';
        return; 
    }

    const commsForm = document.getElementById('comms-form');
    
    if (commsForm) {
        commsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('article-title').value;
            const imageUrl = document.getElementById('article-image').value || null;
            const content = document.getElementById('article-content').value;

            try {
                const submitBtn = document.querySelector('#comms-form .action-key');
                submitBtn.textContent = "TRANSMITTING...";
                submitBtn.disabled = true;

                await addDoc(collection(db, "articles"), {
                    title: title,
                    imageUrl: imageUrl,
                    content: content,
                    authorId: activeUser,
                    status: "PUBLISHED",
                    timestamp: serverTimestamp()
                });

                alert("SYS.MSG :: BROADCAST SUCCESSFUL.");
                commsForm.reset();
                submitBtn.textContent = "BROADCAST TO FEDERATION";
                submitBtn.disabled = false;

            } catch (error) {
                console.error("SYS.ERR :: TRANSMISSION FAILED:", error);
                alert("DATABASE WRITE ERROR.");
            }
        });
    }

    const btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', () => window.location.href = '../00-Main/home.html');
});