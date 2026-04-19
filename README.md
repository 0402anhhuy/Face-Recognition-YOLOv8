# FaceID — YOLOv8 Face Recognition

## System Architecture

```
GitHub (UI source)
      ↓
    Vercel  ←→  HF Spaces
```

## Project Structure

```text
face-recognition-ui/
├── index.html      
├── style.css
├── app.js
└── README.md

yolov8_face_recognition/
├── weights/
│   └── best.pt
├── app.py
├── Dockerfile
├── requirements.txt
└── README.md
```

## Features

- **Image Upload** — Drag-and-drop or file picker support (JPG, PNG, WEBP)
- **API Integration** — Sends data to the `/predict_image` endpoint on HF Spaces
- **Side-by-Side Comparison** — View original and annotated images (bounding boxes) simultaneously
- **Real-time Statistics** — Displays processing time and connection status
- **Download Results** — Export the processed image with detection results

## Usage Guide

### 1. Access the Web App
- Visit the live site on Vercel: [https://face-recognition-yolov8.vercel.app/](https://face-recognition-yolov8.vercel.app/)

### 2. Face Recognition Process
- Select an image by **dragging and dropping** it into the upload zone.
- Click **Recognize**.
- The result will appear on the right side showing the **bounding box + name + confidence score**.

## Deployment

### Frontend (Vercel)
To deploy the UI
```bash
git clone https://github.com/0402anhhuy/Face-Recognition-YOLOv8
```

### Backend (Hugging Face Spaces)
To clone and explore the Docker-based backend
```bash
git lfs install
git clone https://huggingface.co/spaces/0402anhhuy/FaceID-Backend
```

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Backend** | FastAPI + Uvicorn |
| **Model** | YOLOv8l + MTCNN |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Hugging Face Spaces (Docker) |

## Training & Notebook

Detailed information regarding model training, data preprocessing with MTCNN, and GPU-based inference testing can be found here:
- **Kaggle Notebook:** [Face Recognition YOLOv8](https://www.kaggle.com/code/trananhhuy0402/face-recognition-yolov8)