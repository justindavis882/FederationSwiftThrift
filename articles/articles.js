import { db } from '../fedengine/script.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const timelineFeed = document.getElementById('timeline-feed');

    try {
        const q = query(collection(db, "articles"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        timelineFeed.innerHTML = ''; // Clear loader

        if (querySnapshot.empty) {
            timelineFeed.innerHTML = '<div style="color: white; font-family: monospace;">NO TRANSMISSIONS LOGGED.</div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'UNKNOWN DATE';
            
            const logEntry = document.createElement('article');
            logEntry.className = 'log-entry';
            
            let imageHTML = '';
            if (data.imageUrl) {
                imageHTML = `<img src="${data.imageUrl}" class="log-image" alt="Transmission Visual">`;
            }

            logEntry.innerHTML = `
                ${imageHTML}
                <div class="log-header">
                    <h2 class="log-title">${data.title}</h2>
                    <span class="log-date">LOGGED: ${dateStr}</span>
                </div>
                <div class="log-body">${data.content}</div>
            `;
            timelineFeed.appendChild(logEntry);
        });

    } catch (error) {
        console.error("SYS.ERR :: DATALOG PULL FAILED:", error);
        timelineFeed.innerHTML = '<div style="color: red; font-family: monospace;">UPLINK SEVERED. UNABLE TO LOAD LOGS.</div>';
    }
});