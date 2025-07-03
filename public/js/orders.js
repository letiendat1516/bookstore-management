// Orders management functionality

class OrdersManager {
    constructor() {
        this.orders = [];
        this.books = [];
        this.filteredOrders = [];
        this.currentOrderItems = [];
        this.currentEditId = null;
        this.currentViewOrder = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderOrders();
        } catch (error) {
            console.error('Error initializing orders manager:', error);
            utils.showNotification('Lỗi khi tải danh sách đơn hàng', 'danger');
        }
    }

    async loadData() {
        try {
            const [orders, books] = await Promise.all([
                apiService.get('/orders'),
                apiService.get('/books')
            ]);
            
            this.orders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.books = books;
            this.filteredOrders = [...this.orders];
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const debouncedSearch = utils.debounce(() => this.filterOrders(), 300);
        searchInput.addEventListener('input', debouncedSearch);

        // Filter selects
        document.getElementById('statusFilter').addEventListener('change', () => this.filterOrders());
        document.getElementById('dateFilter').addEventListener('change', () => this.filterOrders());

        // Order form
        document.getElementById('orderForm').addEventListener('submit', (e) => this.handleOrderSubmit(e));

        // Status update
        document.getElementById('updateStatusBtn').addEventListener('click', () => this.updateOrderStatus());

        // Customer phone validation
        document.getElementById('customerPhone').addEventListener('input', (e) => {
            const phone = e.target.value;
            if (phone && !validation.validatePhone(phone)) {
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-invalid');
            }
        });
    }

    filterOrders() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        this.filteredOrders = this.orders.filter(order => {
            // Search filter
            const matchesSearch = !searchTerm || 
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.customerPhone.includes(searchTerm) ||
                order.id.toString().includes(searchTerm);

            // Status filter
            const matchesStatus = !statusFilter || order.status === statusFilter;

            // Date filter
            let matchesDate = true;
            if (dateFilter) {
                const orderDate = new Date(order.date);
                const now = new Date();
                
                if (dateFilter === 'today') {
                    matchesDate = orderDate.toDateString() === now.toDateString();
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = orderDate >= weekAgo;
                } else if (dateFilter === 'month') {
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    matchesDate = orderDate >= monthAgo;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        this.renderOrders();
    }

    renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        const noOrderMessage = document.getElementById('noOrdersMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // Hide loading spinner
        loadingSpinner.classList.add('d-none');

        if (this.filteredOrders.length === 0) {
            tbody.innerHTML = '';
            noOrderMessage.classList.remove('d-none');
            return;
        }

        noOrderMessage.classList.add('d-none');

        const ordersHTML = this.filteredOrders.map(order => this.createOrderRow(order)).join('');
        tbody.innerHTML = ordersHTML;
    }

    createOrderRow(order) {
        const statusClass = `status-${order.status}`;
        const statusText = {
            'pending': 'Chờ xử lý',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        }[order.status] || order.status;

        const itemsCount = order.items.length;
        const itemsText = itemsCount === 1 ? '1 sản phẩm' : `${itemsCount} sản phẩm`;

        return `
            <tr>
                <td>
                    <strong class="text-primary">#${order.id}</strong>
                </td>
                <td>
                    <div>
                        <strong>${order.customerName}</strong>
                    </div>
                </td>
                <td>
                    <span class="text-muted">${order.customerPhone}</span>
                </td>
                <td>
                    <span class="badge bg-info text-dark">${itemsText}</span>
                </td>
                <td>
                    <strong class="text-success">${utils.formatCurrency(order.totalAmount)}</strong>
                </td>
                <td>
                    <small class="text-muted">${utils.formatDate(order.date)}</small>
                </td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewOrderDetails(${order.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="updateOrderStatus(${order.id})" title="Cập nhật trạng thái">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="printInvoice(${order.id})" title="In hóa đơn">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    openOrderModal() {
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        const form = document.getElementById('orderForm');

        // Reset form
        form.reset();
        validation.clearValidation(form);
        
        // Reset order items
        this.currentOrderItems = [];
        this.renderOrderItems();
        this.updateOrderSummary();

        modal.show();
    }

    addOrderItem() {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'row g-2 mb-3 order-item';
        itemDiv.innerHTML = `
            <div class="col-md-5">
                <select class="form-select book-select" required>
                    <option value="">Chọn sách</option>
                    ${this.books.filter(book => book.quantity > 0).map(book => 
                        `<option value="${book.id}" data-price="${book.price}" data-available="${book.quantity}">
                            ${book.title} - ${utils.formatCurrency(book.price)} (Còn: ${book.quantity})
                        </option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control quantity-input" placeholder="Số lượng" min="1" required>
            </div>
            <div class="col-md-3">
                <span class="form-control-plaintext item-total">0đ</span>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOrderItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const bookSelect = itemDiv.querySelector('.book-select');
        const quantityInput = itemDiv.querySelector('.quantity-input');

        bookSelect.addEventListener('change', () => this.updateItemTotal(itemDiv));
        quantityInput.addEventListener('input', () => this.updateItemTotal(itemDiv));

        document.getElementById('orderItems').appendChild(itemDiv);
    }

    removeOrderItem(button) {
        const itemDiv = button.closest('.order-item');
        itemDiv.remove();
        this.updateOrderSummary();
    }

    updateItemTotal(itemDiv) {
        const bookSelect = itemDiv.querySelector('.book-select');
        const quantityInput = itemDiv.querySelector('.quantity-input');
        const totalSpan = itemDiv.querySelector('.item-total');

        const selectedOption = bookSelect.selectedOptions[0];
        if (selectedOption && quantityInput.value) {
            const price = parseFloat(selectedOption.dataset.price);
            const quantity = parseInt(quantityInput.value);
            const available = parseInt(selectedOption.dataset.available);

            // Validate quantity
            if (quantity > available) {
                quantityInput.classList.add('is-invalid');
                utils.showNotification(`Chỉ còn ${available} cuốn sách này`, 'warning');
                quantityInput.value = available;
                return;
            } else {
                quantityInput.classList.remove('is-invalid');
            }

            const total = price * quantity;
            totalSpan.textContent = utils.formatCurrency(total);
        } else {
            totalSpan.textContent = '0đ';
        }

        this.updateOrderSummary();
    }

    renderOrderItems() {
        const container = document.getElementById('orderItems');
        container.innerHTML = '';
        
        if (this.currentOrderItems.length === 0) {
            this.addOrderItem();
        }
    }

    updateOrderSummary() {
        const orderItems = document.querySelectorAll('.order-item');
        let totalQuantity = 0;
        let totalAmount = 0;

        orderItems.forEach(itemDiv => {
            const bookSelect = itemDiv.querySelector('.book-select');
            const quantityInput = itemDiv.querySelector('.quantity-input');

            if (bookSelect.value && quantityInput.value) {
                const selectedOption = bookSelect.selectedOptions[0];
                const price = parseFloat(selectedOption.dataset.price);
                const quantity = parseInt(quantityInput.value);
                
                totalQuantity += quantity;
                totalAmount += price * quantity;
            }
        });

        document.getElementById('totalQuantity').textContent = totalQuantity;
        document.getElementById('totalAmount').textContent = utils.formatCurrency(totalAmount);
    }

    async handleOrderSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const saveBtn = document.getElementById('saveOrderBtn');
        
        // Validate form
        if (!validation.validateRequired(form)) {
            utils.showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            return;
        }

        // Validate phone
        const phone = document.getElementById('customerPhone').value;
        if (!validation.validatePhone(phone)) {
            utils.showNotification('Số điện thoại không hợp lệ', 'warning');
            return;
        }

        // Validate order items
        const orderItems = this.collectOrderItems();
        if (orderItems.length === 0) {
            utils.showNotification('Vui lòng thêm ít nhất một sản phẩm', 'warning');
            return;
        }

        // Show loading
        const originalContent = utils.showLoading(saveBtn);

        try {
            const orderData = {
                customerName: document.getElementById('customerName').value.trim(),
                customerPhone: phone,
                items: orderItems,
                totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
                date: new Date().toISOString(),
                status: 'pending'
            };

            const result = await apiService.post('/orders', orderData);
            
            // Update book quantities
            await this.updateBookQuantities(orderItems);
            
            // Refresh data
            await this.loadData();
            this.filterOrders();
            
            utils.showNotification('Tạo đơn hàng thành công!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
            modal.hide();

        } catch (error) {
            console.error('Error saving order:', error);
        } finally {
            utils.hideLoading(saveBtn, originalContent);
        }
    }

    collectOrderItems() {
        const orderItems = [];
        const itemDivs = document.querySelectorAll('.order-item');

        itemDivs.forEach(itemDiv => {
            const bookSelect = itemDiv.querySelector('.book-select');
            const quantityInput = itemDiv.querySelector('.quantity-input');

            if (bookSelect.value && quantityInput.value) {
                const selectedOption = bookSelect.selectedOptions[0];
                const book = this.books.find(b => b.id === parseInt(bookSelect.value));
                
                orderItems.push({
                    bookId: parseInt(bookSelect.value),
                    title: book.title,
                    price: parseFloat(selectedOption.dataset.price),
                    quantity: parseInt(quantityInput.value)
                });
            }
        });

        return orderItems;
    }

    async updateBookQuantities(orderItems) {
        const updatePromises = orderItems.map(async item => {
            const book = this.books.find(b => b.id === item.bookId);
            if (book) {
                const updatedBook = {
                    ...book,
                    quantity: book.quantity - item.quantity
                };
                return apiService.put(`/books/${book.id}`, updatedBook);
            }
        });

        await Promise.all(updatePromises);
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentViewOrder = order;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        const content = document.getElementById('orderDetailsContent');

        const statusText = {
            'pending': 'Chờ xử lý',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        }[order.status] || order.status;

        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary-custom">Thông tin đơn hàng</h6>
                    <p><strong>Mã đơn:</strong> #${order.id}</p>
                    <p><strong>Ngày tạo:</strong> ${utils.formatDate(order.date)}</p>
                    <p><strong>Trạng thái:</strong> <span class="badge status-${order.status}">${statusText}</span></p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-primary-custom">Thông tin khách hàng</h6>
                    <p><strong>Tên:</strong> ${order.customerName}</p>
                    <p><strong>Số điện thoại:</strong> ${order.customerPhone}</p>
                </div>
            </div>
            <hr>
            <h6 class="text-primary-custom">Sản phẩm</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Tên sách</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.title}</td>
                                <td>${utils.formatCurrency(item.price)}</td>
                                <td>${item.quantity}</td>
                                <td>${utils.formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="table-success">
                            <th colspan="3">Tổng cộng</th>
                            <th>${utils.formatCurrency(order.totalAmount)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        modal.show();
    }

    openStatusModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentEditId = orderId;
        document.getElementById('orderStatus').value = order.status;
        
        const modal = new bootstrap.Modal(document.getElementById('statusModal'));
        modal.show();
    }

    async updateOrderStatus() {
        const updateBtn = document.getElementById('updateStatusBtn');
        const newStatus = document.getElementById('orderStatus').value;
        
        const originalContent = utils.showLoading(updateBtn);

        try {
            const order = this.orders.find(o => o.id === this.currentEditId);
            const updatedOrder = { ...order, status: newStatus };
            
            await apiService.put(`/orders/${this.currentEditId}`, updatedOrder);
            
            // Refresh data
            await this.loadData();
            this.filterOrders();
            
            utils.showNotification('Cập nhật trạng thái thành công!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
            modal.hide();

        } catch (error) {
            console.error('Error updating order status:', error);
        } finally {
            utils.hideLoading(updateBtn, originalContent);
        }
    }

    printInvoice(orderId) {
        const order = orderId ? this.orders.find(o => o.id === orderId) : this.currentViewOrder;
        if (!order) return;

        // Create print window
        const printWindow = window.open('', '_blank');
        const invoiceHTML = this.generateInvoiceHTML(order);
        
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.print();
    }

    generateInvoiceHTML(order) {
        const statusText = {
            'pending': 'Chờ xử lý',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        }[order.status] || order.status;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn #${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-info { margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { text-align: right; font-weight: bold; font-size: 1.2em; }
                    .footer { margin-top: 30px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CỬA HÀNG SÁCH</h1>
                    <h2>HÓA ĐƠN BÁN HÀNG</h2>
                </div>
                
                <div class="invoice-info">
                    <p><strong>Số hóa đơn:</strong> #${order.id}</p>
                    <p><strong>Ngày tạo:</strong> ${utils.formatDate(order.date)}</p>
                    <p><strong>Trạng thái:</strong> ${statusText}</p>
                </div>
                
                <div class="customer-info">
                    <h3>THÔNG TIN KHÁCH HÀNG</h3>
                    <p><strong>Tên khách hàng:</strong> ${order.customerName}</p>
                    <p><strong>Số điện thoại:</strong> ${order.customerPhone}</p>
                </div>
                
                <h3>CHI TIẾT ĐỚN HÀNG</h3>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên sách</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.title}</td>
                                <td>${utils.formatCurrency(item.price)}</td>
                                <td>${item.quantity}</td>
                                <td>${utils.formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>TỔNG CỘNG: ${utils.formatCurrency(order.totalAmount)}</p>
                </div>
                
                <div class="footer">
                    <p>Cảm ơn quý khách đã mua hàng!</p>
                    <p>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</p>
                </div>
            </body>
            </html>
        `;
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';
        this.filterOrders();
        utils.showNotification('Đã xóa bộ lọc', 'info');
    }
}

// Global functions for onclick handlers
function openOrderModal() {
    window.ordersManager.openOrderModal();
}

function addOrderItem() {
    window.ordersManager.addOrderItem();
}

function removeOrderItem(button) {
    window.ordersManager.removeOrderItem(button);
}

function viewOrderDetails(orderId) {
    window.ordersManager.viewOrderDetails(orderId);
}

function updateOrderStatus(orderId) {
    window.ordersManager.openStatusModal(orderId);
}

function printInvoice(orderId) {
    window.ordersManager.printInvoice(orderId);
}

function clearFilters() {
    window.ordersManager.clearFilters();
}

// Initialize orders manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ordersManager = new OrdersManager();
});