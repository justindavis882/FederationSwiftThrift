// ==========================================
// MOCK DATA: For offline aesthetic testing
// ==========================================
const mockInventory = [
    {
        id: "docId_1",
        webTitle: "VINTAGE LEATHER JACKET",
        webDescription: "Heavyweight genuine leather. Minor scuffing on the left sleeve. Size Large. Perfect distressed look.",
        webPrice: "45.00",
        photo: "https://via.placeholder.com/400x300?text=LEATHER+JACKET"
    },
    {
        id: "docId_2",
        webTitle: "SONY DISCMAN D-EJ011",
        webDescription: "Tested and fully functional. Includes original anti-skip protection. No headphones included.",
        webPrice: "22.50",
        photo: "https://via.placeholder.com/400x300?text=SONY+DISCMAN"
    },
    {
        id: "docId_3",
        webTitle: "MID-CENTURY CERAMIC LAMP",
        webDescription: "Orange glaze ceramic base with original wiring. Bulb not included. No chips or cracks.",
        webPrice: "60.00",
        photo: "https://via.placeholder.com/400x300?text=CERAMIC+LAMP"
    },
    {
        id: "docId_4",
        webTitle: "LEVI'S 501 ORIGINAL FIT",
        webDescription: "Light wash denim. Waist 32, Length 30. Excellent condition, minimal fading.",
        webPrice: "35.00",
        photo: "https://via.placeholder.com/400x300?text=LEVIS+501"
    }
];

// ==========================================
// STOREFRONT ENGINE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
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

    // 1. Render Products (Offline Mock)
    function renderProducts() {
        productGrid.innerHTML = '';
        
        mockInventory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${item.photo}" class="product-image" alt="${item.webTitle}">
                <div class="product-info">
                    <h3 class="product-title">${item.webTitle}</h3>
                    <p class="product-desc">${item.webDescription}</p>
                    <div class="product-price">$${item.webPrice}</div>
                    <button class="btn-add-cart" data-id="${item.id}" data-title="${item.webTitle}" data-price="${item.webPrice}">
                        ADD TO CART
                    </button>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Attach listeners to newly created buttons
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const title = e.target.getAttribute('data-title');
                const price = parseFloat(e.target.getAttribute('data-price'));
                addToCart(id, title, price);
            });
        });
    }

    // 2. Cart Logic
    function addToCart(id, title, price) {
        // Prevent duplicates (assuming 1 quantity per unique thrift item)
        const exists = cart.find(item => item.id === id);
        if (exists) {
            alert("Item is already in your cart.");
            return;
        }

        cart.push({ id, title, price });
        updateCartUI();
        cartModal.classList.remove('hidden'); // Auto-open cart on add
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }

    function updateCartUI() {
        // Update Count
        cartCount.textContent = cart.length;

        // Render List
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 20px;">YOUR CART IS EMPTY.</div>';
        } else {
            cart.forEach(item => {
                total += item.price;
                const cartEl = document.createElement('div');
                cartEl.className = 'cart-item';
                cartEl.innerHTML = `
                    <div>
                        <div class="cart-item-title">${item.title}</div>
                        <button class="cart-item-remove" data-id="${item.id}">REMOVE</button>
                    </div>
                    <div style="font-weight: bold;">$${item.price.toFixed(2)}</div>
                `;
                cartItemsContainer.appendChild(cartEl);
            });
        }

        // Update Total
        cartTotalPrice.textContent = total.toFixed(2);

        // Re-attach remove listeners
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeFromCart(e.target.getAttribute('data-id'));
            });
        });
    }

    // 3. UI Toggles
    btnCartToggle.addEventListener('click', () => cartModal.classList.remove('hidden'));
    btnCloseCart.addEventListener('click', () => cartModal.classList.add('hidden'));

    // 4. Checkout Handshake (Placeholder)
    btnCheckout.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Add items to your cart before checking out.");
            return;
        }
        
        // This is where we will ping Netlify Functions to build the Stripe URL
        console.log("PAYLOAD TO SEND TO NETLIFY/STRIPE:", cart);
        alert("OFFLINE MODE: Stripe Handshake simulated. Check console for payload.");
    });

    // Boot Up
    renderProducts();
    updateCartUI();
});