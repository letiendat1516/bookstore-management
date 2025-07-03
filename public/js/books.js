// Books management functionality

class BooksManager {
    constructor() {
        this.books = [];
        this.categories = [];
        this.filteredBooks = [];
        this.currentEditId = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.populateCategories();
            this.renderBooks();
        } catch (error) {
            console.error('Error initializing books manager:', error);
            utils.showNotification('Lỗi khi tải danh sách sách', 'danger');
        }
    }

    async loadData() {
        try {
            const [books, categories] = await Promise.all([
                apiService.get('/books'),
                apiService.get('/categories')
            ]);
            
            this.books = books;
            this.categories = categories;
            this.filteredBooks = [...books];
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const debouncedSearch = utils.debounce(() => this.filterBooks(), 300);
        searchInput.addEventListener('input', debouncedSearch);

        // Filter selects
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterBooks());
        document.getElementById('stockFilter').addEventListener('change', () => this.filterBooks());

        // Book form
        document.getElementById('bookForm').addEventListener('submit', (e) => this.handleBookSubmit(e));

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());
    }

    populateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const bookCategory = document.getElementById('bookCategory');
        
        // Clear existing options
        categoryFilter.innerHTML = '<option value="">Tất cả thể loại</option>';
        bookCategory.innerHTML = '<option value="">Chọn thể loại</option>';
        
        // Add category options
        this.categories.forEach(category => {
            const option1 = new Option(category.name, category.name);
            const option2 = new Option(category.name, category.name);
            categoryFilter.appendChild(option1);
            bookCategory.appendChild(option2);
        });
    }

    filterBooks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        this.filteredBooks = this.books.filter(book => {
            // Search filter
            const matchesSearch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.category.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = !categoryFilter || book.category === categoryFilter;

            // Stock filter
            let matchesStock = true;
            if (stockFilter === 'in-stock') {
                matchesStock = book.quantity > 5;
            } else if (stockFilter === 'low-stock') {
                matchesStock = book.quantity > 0 && book.quantity <= 5;
            } else if (stockFilter === 'out-of-stock') {
                matchesStock = book.quantity === 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.renderBooks();
    }

    renderBooks() {
        const container = document.getElementById('booksContainer');
        const noBookMessage = document.getElementById('noBooksMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // Hide loading spinner
        loadingSpinner.classList.add('d-none');

        if (this.filteredBooks.length === 0) {
            container.innerHTML = '';
            noBookMessage.classList.remove('d-none');
            return;
        }

        noBookMessage.classList.add('d-none');

        const booksHTML = this.filteredBooks.map(book => this.createBookCard(book)).join('');
        container.innerHTML = booksHTML;
    }

    createBookCard(book) {
        const stockClass = book.quantity === 0 ? 'out-of-stock' : 
                          book.quantity <= 5 ? 'low-stock' : '';
        
        const stockText = book.quantity === 0 ? 'Hết hàng' : 
                         book.quantity <= 5 ? `Còn ${book.quantity}` : 
                         `Còn ${book.quantity}`;

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card book-card fade-in">
                    <div class="book-image">
                        ${book.image && book.image !== 'images/placeholder-book.jpg' ? 
                            `<img src="${book.image}" alt="${book.title}" style="width: 100%; height: 200px; object-fit: cover;">` :
                            `<div class="d-flex flex-column align-items-center justify-content-center h-100">
                                <i class="fas fa-book text-muted" style="font-size: 3rem;"></i>
                                <span class="text-muted mt-2">Chưa có ảnh</span>
                            </div>`
                        }
                    </div>
                    <div class="card-body">
                        <h6 class="card-title fw-bold" title="${book.title}">${this.truncateText(book.title, 50)}</h6>
                        <p class="text-muted mb-2">
                            <i class="fas fa-user me-1"></i>
                            ${book.author}
                        </p>
                        <p class="text-muted mb-2">
                            <i class="fas fa-tag me-1"></i>
                            ${book.category}
                        </p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="book-price">${utils.formatCurrency(book.price)}</span>
                            <span class="book-quantity ${stockClass}">${stockText}</span>
                        </div>
                        ${book.description ? `
                            <p class="card-text text-muted small mb-3" title="${book.description}">
                                ${this.truncateText(book.description, 80)}
                            </p>
                        ` : ''}
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editBook(${book.id})">
                                <i class="fas fa-edit me-1"></i>
                                Sửa
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${book.id}, '${book.title}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    openBookModal(book = null) {
        const modal = new bootstrap.Modal(document.getElementById('bookModal'));
        const title = document.getElementById('bookModalTitle');
        const form = document.getElementById('bookForm');

        // Reset form
        form.reset();
        validation.clearValidation(form);

        if (book) {
            // Edit mode
            this.currentEditId = book.id;
            title.textContent = 'Chỉnh sửa sách';
            
            // Populate form
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookCategory').value = book.category;
            document.getElementById('bookPrice').value = book.price;
            document.getElementById('bookQuantity').value = book.quantity;
            document.getElementById('bookImage').value = book.image || '';
            document.getElementById('bookDescription').value = book.description || '';
        } else {
            // Add mode
            this.currentEditId = null;
            title.textContent = 'Thêm sách mới';
        }

        modal.show();
    }

    async handleBookSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const saveBtn = document.getElementById('saveBookBtn');
        
        // Validate form
        if (!validation.validateRequired(form)) {
            utils.showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            return;
        }

        // Validate price and quantity
        const price = parseFloat(document.getElementById('bookPrice').value);
        const quantity = parseInt(document.getElementById('bookQuantity').value);

        if (!validation.validateNumber(price, 0)) {
            utils.showNotification('Giá sách phải là số dương', 'warning');
            return;
        }

        if (!validation.validateNumber(quantity, 0)) {
            utils.showNotification('Số lượng phải là số nguyên không âm', 'warning');
            return;
        }

        // Show loading
        const originalContent = utils.showLoading(saveBtn);

        try {
            const bookData = {
                title: document.getElementById('bookTitle').value.trim(),
                author: document.getElementById('bookAuthor').value.trim(),
                category: document.getElementById('bookCategory').value,
                price: price,
                quantity: quantity,
                image: document.getElementById('bookImage').value.trim() || 'images/placeholder-book.jpg',
                description: document.getElementById('bookDescription').value.trim()
            };

            let result;
            if (this.currentEditId) {
                // Update existing book
                result = await apiService.put(`/books/${this.currentEditId}`, bookData);
                utils.showNotification('Cập nhật sách thành công!', 'success');
            } else {
                // Create new book
                result = await apiService.post('/books', bookData);
                utils.showNotification('Thêm sách mới thành công!', 'success');
            }

            // Refresh data and close modal
            await this.loadData();
            this.filterBooks();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookModal'));
            modal.hide();

        } catch (error) {
            console.error('Error saving book:', error);
        } finally {
            utils.hideLoading(saveBtn, originalContent);
        }
    }

    async deleteBook(id, title) {
        this.currentDeleteId = id;
        this.currentDeleteTitle = title;
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async confirmDelete() {
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        const originalContent = utils.showLoading(deleteBtn);

        try {
            await apiService.delete(`/books/${this.currentDeleteId}`);
            
            // Refresh data
            await this.loadData();
            this.filterBooks();
            
            utils.showNotification('Xóa sách thành công!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();

        } catch (error) {
            console.error('Error deleting book:', error);
        } finally {
            utils.hideLoading(deleteBtn, originalContent);
        }
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        this.filterBooks();
        utils.showNotification('Đã xóa bộ lọc', 'info');
    }

    // Export books data (optional feature)
    exportBooks() {
        const dataStr = JSON.stringify(this.books, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `books_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        utils.showNotification('Xuất dữ liệu thành công!', 'success');
    }
}

// Global functions for onclick handlers
function openBookModal(book = null) {
    window.booksManager.openBookModal(book);
}

function editBook(id) {
    const book = window.booksManager.books.find(b => b.id === id);
    if (book) {
        window.booksManager.openBookModal(book);
    }
}

function deleteBook(id, title) {
    window.booksManager.deleteBook(id, title);
}

function clearFilters() {
    window.booksManager.clearFilters();
}

// Initialize books manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.booksManager = new BooksManager();
});