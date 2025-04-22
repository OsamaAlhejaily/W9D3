document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("productList");
    const productForm = document.getElementById("productForm");
    const searchInput = document.getElementById("searchInput");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    let searchTimeout;
    let currentPage = 1;
    const pageSize = 5;
    loadUsers();

    // Search with Debounce
    searchInput.addEventListener("input", function (e) {
        const searchTerm = e.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(searchTerm), 500);
    });

    // Load More Button
    loadMoreBtn.addEventListener("click", loadPaginatedProducts);

    // Load user + posts together (batching)

    // Submit New Product
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("productTitle").value;
        const body = document.getElementById("productBody").value;

        try {
            const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, userId: 1 })
            });
            const newProduct = await res.json();
            alert("Product added!");

            renderProducts([newProduct], true);
            productForm.reset();
        } catch (err) {
            console.error("Add error:", err);
            alert("Failed to add product.");
        }
    });

    // Handle Update/Delete
    productList.addEventListener("click", async (e) => {
        const btn = e.target;
        const productEl = btn.closest(".product");
        if (!productEl) return;

        const productId = productEl.getAttribute("data-id");
        const title = productEl.querySelector(".editable-title").innerText;
        const body = productEl.querySelector(".editable-body").innerText;

        if (btn.classList.contains("update-btn")) {
            try {
                const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${productId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: productId, title, body, userId: 1 })
                });
                const updated = await res.json();
                alert(`Product ${updated.id} updated!`);
            } catch (err) {
                console.error("Update error:", err);
                alert("Failed to update product.");
            }
        }

        if (btn.classList.contains("delete-btn")) {
            try {
                await fetch(`https://jsonplaceholder.typicode.com/posts/${productId}`, {
                    method: "DELETE"
                });
                productEl.remove();
                alert(`Product ${productId} deleted.`);
            } catch (err) {
                console.error("Delete error:", err);
                alert("Failed to delete product.");
            }
        }
    });
    userSelect.addEventListener("change", async function () {
        const userId = this.value;
        const userDataDiv = document.getElementById("userData");

        if (userId === "") {
            // Reset to all users
            userDataDiv.innerHTML = "";
            currentPage = 1;
            loadPaginatedProducts();
            return;
        }

        try {
            // 🔁 Fetch user and their posts in parallel
            const [userRes, postsRes] = await Promise.all([
                fetch(`https://jsonplaceholder.typicode.com/users/${userId}`),
                fetch(`https://jsonplaceholder.typicode.com/users/${userId}/posts`)
            ]);

            const user = await userRes.json();
            const posts = await postsRes.json();

            // ✅ Dynamically update user box
            userDataDiv.innerHTML = `
            <div style="background-color: #fff8dc; padding: 16px; border: 1px dashed #e0c97f; border-radius: 6px; margin-top: 15px;">
                <h3 style="margin: 0 0 8px;">User: ${user.name}</h3>
                <p style="margin: 0;">Email: ${user.email}</p>
            </div>
        `;

            // ✅ Render user's posts
            renderProducts(posts);
        } catch (err) {
            console.error("Error updating user info:", err);
            alert("Failed to update user info.");
        }
    });

    productList.addEventListener("click", async (e) => {
        const btn = e.target;
        const productEl = btn.closest(".product");
        if (!productEl) return;

        const productId = productEl.getAttribute("data-id");

        const viewMode = productEl.querySelector(".view-mode");
        const editMode = productEl.querySelector(".edit-mode");

        if (btn.classList.contains("edit-btn")) {
            viewMode.style.display = "none";
            editMode.style.display = "block";
        }

        if (btn.classList.contains("cancel-btn")) {
            editMode.style.display = "none";
            viewMode.style.display = "block";
        }

        if (btn.classList.contains("save-btn")) {
            const title = productEl.querySelector(".title-input").value;
            const body = productEl.querySelector(".body-input").value;

            try {
                const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${productId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: productId, title, body, userId: 1 })
                });

                const updated = await res.json();

                productEl.querySelector(".title-text").innerText = updated.title;
                productEl.querySelector(".body-text").innerText = updated.body;

                editMode.style.display = "none";
                viewMode.style.display = "block";

                alert(`Product ${updated.id} updated!`);
            } catch (err) {
                console.error("Update error:", err);
                alert("Failed to update product.");
            }
        }

        if (btn.classList.contains("delete-btn")) {
            try {
                await fetch(`https://jsonplaceholder.typicode.com/posts/${productId}`, {
                    method: "DELETE"
                });
                productEl.remove();
                alert(`Product ${productId} deleted.`);
            } catch (err) {
                console.error("Delete error:", err);
                alert("Failed to delete product.");
            }
        }
    });

    // Load paginated products
    async function loadPaginatedProducts() {
        try {
            const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${currentPage}&_limit=${pageSize}`);
            const data = await res.json();
            renderProducts(data, true);
            currentPage++;
        } catch (err) {
            console.error("Pagination error:", err);
            alert("Failed to load more products.");
        }
    }

    // Debounced search
    async function performSearch(term) {
        try {
            const res = await fetch(`https://jsonplaceholder.typicode.com/posts?q=${encodeURIComponent(term)}`);
            const results = await res.json();
            renderProducts(results);
        } catch (err) {
            console.error("Search error:", err);
            alert("Failed to search.");
        }
    }

    // Render product cards
    function renderProducts(products, append = false) {
        if (!append) productList.innerHTML = "";

        products.forEach(p => {
            productList.innerHTML += `
            <div class="product" data-id="${p.id}">
                <div class="view-mode">
                    <h4 class="title-text">${p.title}</h4>
                    <p class="body-text">${p.body}</p>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
                <div class="edit-mode" style="display:none;">
                    <input type="text" class="title-input" value="${p.title}" />
                    <textarea class="body-input">${p.body}</textarea>
                    <button class="save-btn">Save</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>`;
        });
    }
    async function loadUsers() {
        try {
            const res = await fetch("https://jsonplaceholder.typicode.com/users");
            const users = await res.json();
            const select = document.getElementById("userSelect");

            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.id;
                option.textContent = `${user.name} (${user.email})`;
                select.appendChild(option);
            });
        } catch (err) {
            console.error("Error loading users:", err);
        }
    }


    
});
