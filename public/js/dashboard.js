// Dashboard functionality for Bookstore Management System

class Dashboard {
    constructor() {
        this.books = [];
        this.orders = [];
        this.categories = [];
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.updateStatistics();
            this.renderCharts();
            this.renderRecentOrders();
            this.renderBestSellers();
            this.checkLowStock();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            utils.showNotification('Lỗi khi tải dashboard', 'danger');
        }
    }

    async loadData() {
        try {
            const [books, orders, categories] = await Promise.all([
                apiService.get('/books'),
                apiService.get('/orders'),
                apiService.get('/categories')
            ]);
            
            this.books = books;
            this.orders = orders;
            this.categories = categories;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    updateStatistics() {
        // Total books
        const totalBooks = this.books.length;
        document.getElementById('totalBooks').textContent = totalBooks;

        // Total orders
        const totalOrders = this.orders.length;
        document.getElementById('totalOrders').textContent = totalOrders;

        // Total revenue
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        document.getElementById('totalRevenue').textContent = utils.formatCurrency(totalRevenue);

        // Low stock books (quantity <= 5)
        const lowStockBooks = this.books.filter(book => book.quantity <= 5).length;
        document.getElementById('lowStockBooks').textContent = lowStockBooks;
    }

    renderCharts() {
        this.renderRevenueChart();
        this.renderCategoryChart();
    }

    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Get last 7 days revenue data
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date;
        });

        const revenueData = last7Days.map(date => {
            const dayOrders = this.orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate.toDateString() === date.toDateString();
            });
            return dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        });

        const labels = last7Days.map(date => 
            date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        );

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    minimumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 6,
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Calculate books per category
        const categoryData = this.categories.map(category => {
            const categoryBooks = this.books.filter(book => book.category === category.name);
            return {
                name: category.name,
                count: categoryBooks.length
            };
        }).filter(item => item.count > 0);

        const labels = categoryData.map(item => item.name);
        const data = categoryData.map(item => item.count);
        const colors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', 
            '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'
        ];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    renderRecentOrders() {
        const recentOrders = this.orders
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const container = document.getElementById('recentOrders');
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Chưa có đơn hàng nào</p>';
            return;
        }

        const tableHTML = `
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Khách hàng</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentOrders.map(order => `
                        <tr>
                            <td>
                                <strong>${order.customerName}</strong><br>
                                <small class="text-muted">${utils.formatDate(order.date)}</small>
                            </td>
                            <td>${utils.formatCurrency(order.totalAmount)}</td>
                            <td>
                                <span class="badge status-${order.status}">
                                    ${order.status === 'completed' ? 'Hoàn thành' : 
                                      order.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderBestSellers() {
        // Calculate book sales from orders
        const bookSales = {};
        
        this.orders.forEach(order => {
            order.items.forEach(item => {
                if (!bookSales[item.bookId]) {
                    bookSales[item.bookId] = {
                        title: item.title,
                        totalSold: 0
                    };
                }
                bookSales[item.bookId].totalSold += item.quantity;
            });
        });

        // Sort by total sold and get top 5
        const bestSellers = Object.values(bookSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5);

        const container = document.getElementById('bestSellers');
        
        if (bestSellers.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Chưa có dữ liệu bán hàng</p>';
            return;
        }

        const listHTML = bestSellers.map((book, index) => `
            <div class="d-flex justify-content-between align-items-center py-2 ${index < bestSellers.length - 1 ? 'border-bottom' : ''}">
                <div>
                    <span class="badge bg-primary me-2">${index + 1}</span>
                    <strong>${book.title}</strong>
                </div>
                <span class="text-primary fw-bold">${book.totalSold} bán</span>
            </div>
        `).join('');

        container.innerHTML = listHTML;
    }

    checkLowStock() {
        const lowStockBooks = this.books.filter(book => book.quantity <= 5);
        const alertContainer = document.getElementById('lowStockAlert');
        const countElement = document.getElementById('lowStockCount');
        const listElement = document.getElementById('lowStockList');

        if (lowStockBooks.length === 0) {
            alertContainer.classList.add('d-none');
            return;
        }

        countElement.textContent = lowStockBooks.length;
        
        const listHTML = lowStockBooks.map(book => `
            <div class="d-flex justify-content-between align-items-center py-1">
                <span><strong>${book.title}</strong> - ${book.author}</span>
                <span class="badge ${book.quantity === 0 ? 'bg-danger' : 'bg-warning text-dark'}">
                    ${book.quantity === 0 ? 'Hết hàng' : `Còn ${book.quantity}`}
                </span>
            </div>
        `).join('');

        listElement.innerHTML = listHTML;
        alertContainer.classList.remove('d-none');
    }

    // Method to refresh dashboard data
    async refresh() {
        try {
            await this.loadData();
            this.updateStatistics();
            
            // Update charts
            this.charts.revenue.destroy();
            this.charts.category.destroy();
            this.renderCharts();
            
            this.renderRecentOrders();
            this.renderBestSellers();
            this.checkLowStock();
            
            utils.showNotification('Dashboard đã được cập nhật', 'success');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            utils.showNotification('Lỗi khi cập nhật dashboard', 'danger');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Add refresh button functionality
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn btn-outline-primary btn-sm position-fixed';
    refreshButton.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000;';
    refreshButton.innerHTML = '<i class="fas fa-refresh me-1"></i> Làm mới';
    refreshButton.onclick = () => window.dashboard.refresh();
    document.body.appendChild(refreshButton);
});