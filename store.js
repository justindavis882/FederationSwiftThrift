import { db } from './fedengine/script.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // State Management
    let cart = [];

    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartModal = document.getElementById('cart-modal');
    const cartItemsContainer = document.getElementById('cart-items');
    
    // Buttons
    const btnCartToggle = document.getElementById('btn-cart-toggle');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const btnCheckout = document.getElementById('btn-checkout');

    // 1. State Management for Inventory
    let allProducts = [];
    let activeCategory = "ALL";
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // 2. Fetch Live Products Once
    async function fetchInventory() {
        productGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; font-family: monospace;">ACCESSING DATABANKS...</div>';
        
        try {
            const q = query(collection(db, "inventory"), where("status", "==", "ACTIVE_LISTING"));
            const querySnapshot = await getDocs(q);
            
            allProducts = []; // Clear array
            
            if (querySnapshot.empty) {
                productGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; font-family: monospace;">NO ACTIVE LISTINGS IN SECTOR.</div>';
                return;
            }

            querySnapshot.forEach((doc) => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });

            applyFilters(); // Renders the initial grid

        } catch (error) {
            console.error("SYS.ERR :: FAILED TO FETCH INVENTORY:", error);
            productGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; font-family: monospace; color: red;">UPLINK SEVERED. UNABLE TO LOAD ITEMS.</div>';
        }
    }

    // 3. Filter Engine
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredProducts = allProducts.filter(item => {
            // Check Search (Title or Description)
            const titleMatch = item.webTitle ? item.webTitle.toLowerCase().includes(searchTerm) : false;
            const descMatch = item.webDescription ? item.webDescription.toLowerCase().includes(searchTerm) : false;
            const matchesSearch = titleMatch || descMatch;

            // Check Category (Fallback to 'MISC' if older items lack a category field)
            const itemCategory = item.category ? item.category.toUpperCase() : "MISC";
            const matchesCategory = activeCategory === "ALL" || itemCategory === activeCategory;

            return matchesSearch && matchesCategory;
        });

        renderGrid(filteredProducts);
    }

    // 4. Render the Grid
    function renderGrid(productsToDisplay) {
        productGrid.innerHTML = '';

        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; font-family: monospace;">NO MATCHING ARTIFACTS DETECTED.</div>';
            return;
        }

        productsToDisplay.forEach((item) => {
            const photos = (item.photos && item.photos.length > 0) ? item.photos : ["https://via.placeholder.com/400x300?text=NO+VISUAL+DATA"];
            const hasMultiple = photos.length > 1;
            const photosJson = encodeURIComponent(JSON.stringify(photos));
            const priceNum = parseFloat(item.webPrice).toFixed(2);
            
            const carouselHTML = `
                <div class="carousel-container" data-photos="${photosJson}" data-index="0">
                    <img src="${photos[0]}" class="product-image" alt="${item.webTitle}">
                    ${hasMultiple ? `
                        <button class="carousel-btn prev-btn">&#10094;</button>
                        <button class="carousel-btn next-btn">&#10095;</button>
                        <div class="carousel-indicator">1 / ${photos.length}</div>
                    ` : ''}
                </div>
            `;
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                ${carouselHTML}
                <div class="product-info">
                    <h3 class="product-title">${item.webTitle}</h3>
                    <p class="product-desc">${item.webDescription}</p>
                    <div class="product-price">$${priceNum}</div>
                    <button class="btn-add-cart" data-id="${item.id}" data-title="${item.webTitle}" data-price="${priceNum}">
                        ADD TO CART
                    </button>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Re-attach Add to Cart Listeners
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const title = e.target.getAttribute('data-title');
                const price = parseFloat(e.target.getAttribute('data-price'));
                addToCart(id, title, price);
            });
        });
    }

    // 5. Filter & Search Event Listeners
    searchInput.addEventListener('input', applyFilters);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-category');
            applyFilters();
        });
    });

    // 6. Image Carousel Logic (Unchanged from before, just sits below renderGrid)
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('carousel-btn')) {
            const container = e.target.closest('.carousel-container');
            const img = container.querySelector('.product-image');
            const indicator = container.querySelector('.carousel-indicator');
            const photos = JSON.parse(decodeURIComponent(container.getAttribute('data-photos')));
            let currentIndex = parseInt(container.getAttribute('data-index'));

            if (e.target.classList.contains('prev-btn')) {
                currentIndex = (currentIndex === 0) ? photos.length - 1 : currentIndex - 1;
            } else if (e.target.classList.contains('next-btn')) {
                currentIndex = (currentIndex === photos.length - 1) ? 0 : currentIndex + 1;
            }

            container.setAttribute('data-index', currentIndex);
            img.src = photos[currentIndex];
            if(indicator) indicator.textContent = `${currentIndex + 1} / ${photos.length}`;
        }
    });

    // Change Boot Up call to the new fetch function
    fetchInventory();

    // 2. Cart Logic
    function addToCart(id, title, price) {
        const exists = cart.find(item => item.id === id);
        if (exists) {
            alert("ITEM ALREADY LOGGED IN CART.");
            return;
        }

        cart.push({ id, title, price });
        updateCartUI();
        cartModal.classList.remove('hidden'); 
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }

    function updateCartUI() {
        cartCount.textContent = cart.length;
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 20px; font-family: monospace;">YOUR CART IS EMPTY.</div>';
        } else {
            cart.forEach(item => {
                total += item.price;
                const cartEl = document.createElement('div');
                cartEl.className = 'cart-item';
                cartEl.innerHTML = `
                    <div>
                        <div class="cart-item-title" style="font-family: monospace; text-transform: uppercase;">${item.title}</div>
                        <button class="cart-item-remove" data-id="${item.id}">REMOVE</button>
                    </div>
                    <div style="font-weight: bold; font-family: monospace; font-size: 1.1rem;">$${item.price.toFixed(2)}</div>
                `;
                cartItemsContainer.appendChild(cartEl);
            });
        }

        cartTotalPrice.textContent = total.toFixed(2);

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeFromCart(e.target.getAttribute('data-id'));
            });
        });
    }

    // 3. UI Toggles
    btnCartToggle.addEventListener('click', () => cartModal.classList.remove('hidden'));
    btnCloseCart.addEventListener('click', () => cartModal.classList.add('hidden'));

    // 4. Checkout Handshake
    btnCheckout.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("CART REQUIRES CONTENTS FOR CHECKOUT SEQUENCE.");
            return;
        }
        
        // TEMPORARY: Routing to success page manually to test the loop before Netlify/Stripe integration
        console.log("PAYLOAD QUEUED FOR STRIPE:", cart);
        alert("SIMULATING STRIPE HANDSHAKE...");
        window.location.href = "success.html?session_id=sim_test_offline_999";
    });

    // Boot Up
    renderProducts();
});