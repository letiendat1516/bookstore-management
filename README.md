"# Hệ thống Quản lý Cửa hàng Sách

Một hệ thống quản lý cửa hàng sách hoàn chỉnh được xây dựng bằng Node.js và JSON Server với giao diện trực quan và sinh động.

## 🚀 Tính năng chính

### 📚 Quản lý Sách
- Hiển thị danh sách sách với hình ảnh, tên, tác giả, giá, số lượng
- Thêm sách mới với đầy đủ thông tin
- Chỉnh sửa và xóa thông tin sách
- Tìm kiếm sách theo tên, tác giả, thể loại
- Lọc sách theo danh mục và tình trạng kho
- Cảnh báo sách sắp hết hàng

### 🛍️ Quản lý Đơn hàng
- Tạo đơn bán hàng cho khách
- Chọn sách và số lượng với validation
- Tính tổng tiền tự động
- Lưu thông tin khách hàng
- Theo dõi và cập nhật trạng thái đơn hàng
- In hóa đơn đẹp mắt

### 📊 Dashboard và Thống kê
- Tổng quan doanh thu và số liệu kinh doanh
- Biểu đồ doanh thu theo ngày (7 ngày gần nhất)
- Biểu đồ phân bố sách theo thể loại
- Danh sách đơn hàng gần đây
- Top sách bán chạy nhất
- Cảnh báo tồn kho thấp

### 🎨 Giao diện Người dùng
- Responsive design cho mobile/desktop
- Sử dụng Bootstrap 5 cho UI đẹp
- Icons Font Awesome sinh động
- Navigation menu dễ sử dụng
- Modal dialogs cho các thao tác
- Notification/alert thông báo
- Loading states và error handling

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** với Express server
- **JSON Server** để mock REST API
- **CORS** middleware cho cross-origin requests

### Frontend
- **HTML5/CSS3/JavaScript** vanilla
- **Bootstrap 5** cho UI framework
- **Font Awesome** cho icons
- **Chart.js** cho biểu đồ
- **Fetch API** cho HTTP requests

### Database (JSON)
- **books**: id, title, author, category, price, quantity, image, description
- **orders**: id, customerName, customerPhone, items, totalAmount, date, status
- **categories**: id, name, description

## 📁 Cấu trúc Project

```
bookstore-management/
├── package.json              # Dependencies và scripts
├── server.js                 # Express server chính
├── db.json                   # JSON database
├── .gitignore               # Git ignore file
├── README.md                # Tài liệu hướng dẫn
└── public/                  # Frontend files
    ├── index.html           # Dashboard
    ├── books.html           # Quản lý sách
    ├── orders.html          # Quản lý đơn hàng
    ├── css/
    │   └── style.css        # Custom styles
    ├── js/
    │   ├── main.js          # Common functions
    │   ├── dashboard.js     # Dashboard functions
    │   ├── books.js         # Book management
    │   └── orders.js        # Order management
    └── images/
        └── placeholder-book.jpg
```

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- **Node.js** >= 14.0.0
- **npm** >= 6.0.0

### Bước 1: Clone repository
```bash
git clone https://github.com/letiendat1516/bookstore-management.git
cd bookstore-management
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Chạy ứng dụng

#### Development mode (với nodemon)
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

#### Chạy JSON Server riêng biệt (nếu cần)
```bash
npm run json-server
```

### Bước 4: Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **JSON Server API**: http://localhost:3001

## 📖 Hướng dẫn sử dụng

### Dashboard
1. Truy cập trang chủ để xem tổng quan
2. Theo dõi các chỉ số: tổng sách, đơn hàng, doanh thu, cảnh báo tồn kho
3. Xem biểu đồ doanh thu và phân bố thể loại
4. Kiểm tra đơn hàng gần đây và sách bán chạy

### Quản lý Sách
1. Vào mục "Quản lý Sách"
2. **Thêm sách mới**: Click "Thêm sách mới", điền thông tin và lưu
3. **Chỉnh sửa**: Click nút "Sửa" trên thẻ sách
4. **Xóa sách**: Click nút "Xóa" và xác nhận
5. **Tìm kiếm**: Sử dụng ô tìm kiếm theo tên, tác giả
6. **Lọc**: Chọn thể loại hoặc tình trạng kho

### Quản lý Đơn hàng
1. Vào mục "Đơn hàng"
2. **Tạo đơn mới**: 
   - Click "Tạo đơn hàng"
   - Điền thông tin khách hàng
   - Thêm sách vào đơn
   - Kiểm tra tổng kết và lưu
3. **Xem chi tiết**: Click nút "Xem" trên đơn hàng
4. **Cập nhật trạng thái**: Click nút "Sửa" để thay đổi trạng thái
5. **In hóa đơn**: Click nút "In" để tạo hóa đơn

## 🔧 Scripts NPM

```bash
# Chạy server production
npm start

# Chạy development với nodemon
npm run dev

# Chạy JSON Server riêng (port 3001)
npm run json-server
```

## 🎨 Tùy chỉnh

### Thay đổi màu sắc
Chỉnh sửa CSS variables trong `public/css/style.css`:
```css
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
}
```

### Thêm thể loại sách mới
Chỉnh sửa file `db.json` trong mục `categories`:
```json
{
  "id": 7,
  "name": "Thể loại mới",
  "description": "Mô tả thể loại"
}
```

### Thay đổi cấu hình server
Chỉnh sửa file `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Thay đổi port
```

## 🐛 Troubleshooting

### Lỗi không kết nối được API
- Kiểm tra JSON Server có chạy trên port 3001
- Đảm bảo file `db.json` tồn tại
- Kiểm tra CORS settings

### Lỗi hiển thị dữ liệu
- Kiểm tra console browser để xem lỗi JavaScript
- Đảm bảo tất cả file CSS và JS được load
- Kiểm tra network requests trong DevTools

### Lỗi npm install
- Xóa folder `node_modules` và file `package-lock.json`
- Chạy lại `npm install`
- Kiểm tra phiên bản Node.js

## 📝 Tính năng nâng cao (có thể mở rộng)

- [ ] Xác thực người dùng
- [ ] Quản lý nhà cung cấp
- [ ] Báo cáo chi tiết
- [ ] Xuất/nhập dữ liệu Excel
- [ ] Tích hợp thanh toán online
- [ ] Quản lý khuyến mãi
- [ ] Hệ thống thông báo real-time

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

Dự án này được phát hành dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 👨‍💻 Tác giả

- **Bookstore Management Team**
- Email: support@bookstore.com
- Website: https://bookstore.com

---

⭐ Nếu project này hữu ích, hãy cho chúng tôi một star nhé!" 
