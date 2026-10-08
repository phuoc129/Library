# Thư viện THCS Nguyễn Thị Định — gộp libs (FE) + libs_BE (BE), dùng MongoDB

Code giữ nguyên như 2 repo gốc, chỉ gộp vào 1 thư mục:
- backend/  : Node.js + Express + MongoDB (cổng 3000)
- frontend/ : React + Vite (cổng 5173)

## Chạy
1. Cài MongoDB (xem hướng dẫn trong chat) và đảm bảo service đang chạy.
2. Backend:
   cd backend && npm install && copy .env.example .env   (rồi điền .env)
   npm run dev
3. Frontend:
   cd frontend && npm install && copy .env.example .env  (VITE_SECRET_CRYPTO = SECRET_CRYPTO của backend)
   npm run dev  -> mở http://localhost:5173

## Lưu ý
- File .env gốc trong repo GitHub có key thật đã bị lộ công khai -> hãy đổi Cloudinary secret / Google OAuth, và dùng key mới trong .env.
- Tài khoản admin: đăng ký trên web, rồi dùng MongoDB Compass sửa field role của user đó thành "admin".
