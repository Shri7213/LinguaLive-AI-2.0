# 🌐 LinguaLive AI
### Real-Time Speech Translation and Live Captioning System

**Breaking language barriers through AI-powered speech recognition and translation.**

LinguaLive AI is an AI-powered web application that converts spoken audio into text and translates it into another language. It is designed to help users understand foreign-language video content and spoken conversations through translated captions.

The application combines OpenAI Whisper for speech recognition with Argos Translate for multilingual text translation.

---

## ✨ Features

- 🎙️ **Audio Capture:** Capture audio from browser tabs and microphone input.
- 🗣️ **Speech Recognition:** Convert spoken language into text using OpenAI Whisper.
- 🌍 **Language Detection:** Identify the language spoken in the audio.
- 🔄 **Multilingual Translation:** Translate recognized text using Argos Translate.
- 🇰🇷 **Korean-to-Hindi Translation:** Translate Korean speech into Hindi through an English intermediate translation.
- 💬 **Live Captions:** Display original and translated text on the web interface.
- 📝 **Translation Transcript:** Maintain a transcript of recognized and translated content.
- 💻 **Web-Based Interface:** Access the application through a browser.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Core programming language |
| Flask | Backend web framework |
| OpenAI Whisper | Speech recognition and transcription |
| Argos Translate | Text translation |
| HTML5 | Webpage structure |
| CSS3 | User interface styling |
| JavaScript | Frontend interaction and audio capture |
| Web Audio API | Browser audio processing |
| VS Code | Development environment |

---

## 🏗️ System Architecture

The application follows a speech recognition and translation pipeline:

```text
       Audio Input
            |
            v
   Browser Audio Capture
            |
            v
      Flask Backend
            |
            v
    OpenAI Whisper
    Speech-to-Text
            |
            v
   Language Detection
            |
            v
    Argos Translate
            |
            v
    Translated Text
            |
            v
     Live Captions
```

### Korean-to-Hindi Translation Flow

```text
Korean Audio
     |
     v
Whisper Transcription
     |
     v
Korean Text
     |
     v
Korean → English
     |
     v
English → Hindi
     |
     v
Hindi Captions
```

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Python 3.11
- FFmpeg
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/Shri7213/LinguaLive-AI-2.0.git
```

### 2. Navigate to the Project Directory

```bash
cd LinguaLive-AI-2.0
```

### 3. Create a Virtual Environment

```bash
python -m venv .venv
```

### 4. Activate the Virtual Environment

For Windows PowerShell:

```powershell
.\.venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Install FFmpeg

Install FFmpeg and ensure it is available in your system PATH.

Verify installation:

```bash
ffmpeg -version
```

### 7. Install Argos Translation Packages

The project requires the following language packages:

- Korean → English
- English → Hindi

Install the required packages using Argos Translate before running the application.

### 8. Run the Application

```bash
python app.py
```

### 9. Open in Browser

Visit:

```text
http://127.0.0.1:5000
```

---

## 🚀 How to Use

1. Start the Flask application.
2. Open LinguaLive AI in your browser.
3. Select the audio input mode.
4. Choose the source and target languages.
5. Start capturing audio from a browser tab or microphone.
6. For browser tab audio, select the appropriate tab and enable tab audio sharing.
7. View the original transcription and translated captions.

---

## 📁 Project Structure

```text
LinguaLive-AI-2.0/
│
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── static/
│   ├── style.css
│   └── script.js
│
└── templates/
    └── index.html
```

---

## 🎯 Project Objectives

- Make foreign-language audio content easier to understand.
- Explore AI-powered speech recognition and language translation.
- Build an integrated web application using Python and Flask.
- Demonstrate a multilingual captioning workflow.

---

## 🔮 Future Enhancements

- Support for additional language pairs.
- Improved translation accuracy and contextual understanding.
- Lower-latency speech processing.
- Text-to-speech output for translated content.
- Better mobile and cross-platform compatibility.
- Integration with additional cloud-based AI services.

---

## 📌 Current Project Status

**Working Prototype**

The current implementation supports browser audio capture, speech transcription using Whisper, and text translation using Argos Translate. The Korean-to-Hindi workflow uses English as an intermediate language.

---

## 👩‍💻 Developed By

**Shristi Soni**

B.Tech – Computer Science and Engineering (AI)

GitHub: [@Shri7213](https://github.com/Shri7213)

---

⭐ If you find this project interesting, consider giving the repository a star!

**LinguaLive AI – Making multilingual communication more accessible, one caption at a time.**