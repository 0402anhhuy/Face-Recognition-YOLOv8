# FaceID — YOLOv8 Face Recognition UI

Giao diện web cho hệ thống nhận diện khuôn mặt sử dụng **MTCNN + YOLOv8 + FastAPI**

## Kiến trúc hệ thống

```
GitHub (UI source)
      ↓ auto deploy
Vercel (Frontend)                HF Spaces (Backend)
https://faceid.vercel.app   ←→   https://username-space.hf.space
  index.html / app.js              FastAPI + MTCNN + YOLOv8l
```

## Cấu trúc thư mục

```
face-recognition-ui/
├── index.html      # Giao diện chính
├── style.css       # Stylesheet (theme tối, Industrial)
├── app.js          # Logic gọi API, xử lý camera/upload
└── README.md
```

## Tính năng

- **Upload ảnh** — kéo thả hoặc click chọn file (JPG, PNG, WEBP)
- **Chụp từ camera** — stream trực tiếp từ webcam, chụp frame để nhận diện
- **Gọi API** — gửi ảnh tới `/predict_image` của FastAPI backend trên HF Spaces
- **Hiển thị kết quả** — ảnh gốc và ảnh đã vẽ bounding box song song
- **Thống kê** — thời gian xử lý, trạng thái kết nối
- **Tải kết quả** — download ảnh kết quả về máy

## Cách dùng

### 1. Mở trang web

Truy cập trực tiếp tại URL Vercel — không cần cài đặt gì thêm.

URL backend HF Spaces đã được điền sẵn, trang sẽ tự động kiểm tra kết nối khi load.

### 2. Nhận diện khuôn mặt

1. Chọn ảnh bằng cách **kéo thả** vào vùng upload, hoặc **chụp từ camera**
2. Bấm **Nhận diện**
3. Kết quả hiển thị ngay bên phải — bounding box + tên + độ tin cậy
4. Bấm **Tải kết quả** để lưu ảnh về máy

### 3. Đổi server (tuỳ chọn)

Nếu muốn dùng backend khác (ví dụ ngrok local), nhập URL vào ô **Server URL** và bấm **Kiểm tra kết nối**. URL sẽ được lưu vào `localStorage` cho lần sau.

## Backend API

Endpoint được sử dụng:

| Method | Path | Mô tả |
|--------|------|-------|
| `GET`  | `/` | Health check, trả về JSON |
| `POST` | `/predict_image` | Upload ảnh (`multipart/form-data`, field `file`), trả về ảnh JPEG đã annotate |

Backend được deploy trên **Hugging Face Spaces** (Docker + FastAPI). Xem repo backend để biết thêm chi tiết.

## Deploy

### Frontend (Vercel)

```bash
# 1. Fork / clone repo này
git clone https://github.com/YOUR_USERNAME/face-recognition-ui

# 2. Kết nối repo với Vercel tại vercel.com
# 3. Vercel tự động deploy mỗi khi push lên main
```

### Cập nhật URL backend

Trong `app.js`, sửa dòng:

```javascript
const HF_DEFAULT_URL = 'https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space';
```

## Lưu ý

- **Cold start:** HF Spaces free có thể mất 30–60s cho request đầu tiên sau thời gian không hoạt động
- **CPU only:** Backend chạy trên CPU, inference mất khoảng 3–10s mỗi ảnh
- **Ngưỡng tin cậy:** `CONF_THRESHOLD = 0.95` được cấu hình phía backend
- **CORS:** Backend đã cấu hình CORS cho phép Vercel gọi vào

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| Font | Syne (display) + Space Mono (monospace) |
| Backend | FastAPI + Uvicorn |
| Model | YOLOv8l + MTCNN |
| Frontend hosting | Vercel |
| Backend hosting | Hugging Face Spaces (Docker) |