
from flask import Flask, render_template, request, jsonify
import whisper
import argostranslate.translate
import tempfile
import os

app = Flask(__name__)

# Load Whisper model once when the application starts
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded successfully!")

LANGUAGES = {
    "ko": "Korean",
    "en": "English",
    "hi": "Hindi",
    "fr": "French",
    "ja": "Japanese",
    "es": "Spanish",
    "de": "German"
}


def transcribe_audio(audio_path, source_language="auto"):
    """Convert speech audio into text using Whisper."""

    print("\nSending audio to Whisper...")

    options = {
        "fp16": False,
        "temperature": 0,
        "condition_on_previous_text": False,
        "task": "transcribe"
    }

    if source_language != "auto":
        options["language"] = source_language

    result = model.transcribe(audio_path, **options)

    original_text = result["text"].strip()
    detected_language = result.get("language", source_language)

    print("Whisper output:", original_text)
    print("Detected language:", detected_language)

    return original_text, detected_language


def translate_with_argos(text, source_language, target_language):
    """Translate text using locally installed Argos language packages."""

    if not text or not text.strip():
        return ""

    text = text.strip()

    if source_language == target_language:
        return text

    print(
        f"\nArgos translation: "
        f"{source_language} -> {target_language}"
    )

    try:
        # Korean -> Hindi using English as a bridge
        if source_language == "ko" and target_language == "hi":

            print("Using translation bridge: Korean -> English -> Hindi")

            english_text = argostranslate.translate.translate(
                text, "ko", "en"
            )

            print("Korean -> English:", english_text)

            hindi_text = argostranslate.translate.translate(
                english_text, "en", "hi"
            )

            print("English -> Hindi:", hindi_text)

            return hindi_text.strip()

        # Direct translation for other installed language pairs
        translated_text = argostranslate.translate.translate(
            text,
            source_language,
            target_language
        )

        print("Argos result:", translated_text)

        return translated_text.strip()

    except Exception as error:
        print("Argos translation failed:", str(error))
        raise Exception(
            f"Translation failed for {source_language} -> {target_language}. "
            "Check whether the required Argos language packages are installed."
        )


def process_audio(audio_path, source_language, target_language):
    """Transcribe audio and translate the resulting text."""

    original_text, detected_language = transcribe_audio(
        audio_path,
        source_language
    )

    if not original_text:
        return {
            "original": "",
            "translated": "",
            "language": detected_language
        }

    # Use Whisper's detected language when source is set to auto
    actual_source = (
        detected_language
        if source_language == "auto"
        else source_language
    )

    translated_text = translate_with_argos(
        original_text,
        actual_source,
        target_language
    )

    return {
        "original": original_text,
        "translated": translated_text,
        "language": actual_source
    }


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/translate_chunk", methods=["POST"])
def translate_chunk():
    """Process individual audio chunks sent by the browser."""

    audio_path = None

    try:
        print("\n========== NEW AUDIO CHUNK ==========")

        audio = request.files.get("audio")

        if audio is None:
            return jsonify({
                "error": "No audio chunk received."
            }), 400

        source_language = request.form.get(
            "source_language", "auto"
        )

        target_language = request.form.get(
            "target_language", "hi"
        )

        if target_language not in LANGUAGES:
            return jsonify({
                "error": "Unsupported target language."
            }), 400

        with tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False
        ) as temp:
            audio_path = temp.name

        audio.save(audio_path)

        file_size = os.path.getsize(audio_path)
        print("Audio file size:", file_size, "bytes")

        if file_size == 0:
            return jsonify({
                "error": "Received an empty audio file."
            }), 400

        result = process_audio(
            audio_path,
            source_language,
            target_language
        )

        return jsonify(result)

    except Exception as error:
        print("Chunk translation error:", str(error))

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


@app.route("/translate", methods=["POST"])
def translate_audio():
    """Process a complete audio file if the frontend uses this route."""

    audio_path = None

    try:
        audio = (
            request.files.get("audio")
            or request.files.get("file")
        )

        if audio is None:
            return jsonify({
                "error": "No audio file received."
            }), 400

        source_language = request.form.get(
            "source_language", "auto"
        )

        target_language = request.form.get(
            "target_language", "hi"
        )

        if target_language not in LANGUAGES:
            return jsonify({
                "error": "Unsupported target language."
            }), 400

        with tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False
        ) as temp:
            audio_path = temp.name

        audio.save(audio_path)

        result = process_audio(
            audio_path,
            source_language,
            target_language
        )

        return jsonify(result)

    except Exception as error:
        print("Translation error:", str(error))

        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
