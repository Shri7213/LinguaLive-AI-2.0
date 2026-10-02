
// ===================================
// LINGUALIVE AI - SCRIPT.JS
// ===================================

let currentMode = "video";

let mediaStream = null;
let audioContext = null;
let audioSource = null;
let processor = null;
let muteNode = null;

let isRecording = false;

let audioBuffer = [];
let chunkSize = 0;

// Process requests in order
let requestQueue = Promise.resolve();

// Audio chunk duration
const CHUNK_SECONDS = 5;


// ===================================
// GET HTML ELEMENTS
// ===================================

const originalText = document.getElementById("originalText");
const translatedText = document.getElementById("translatedText");
const liveCaption = document.getElementById("liveCaption");

const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");


// ===================================
// MODE SELECTION
// ===================================

function selectMode(mode) {

    if (isRecording) {
        alert("Please stop translation before changing mode.");
        return;
    }

    currentMode = mode;

    document.getElementById("videoMode")
        .classList.toggle("active", mode === "video");

    document.getElementById("callMode")
        .classList.toggle("active", mode === "call");

    liveCaption.innerText =
        mode === "video"
            ? "Video translation is ready."
            : "Microphone translation is ready.";

    updateStatus("Ready to translate", "gray");
}


// ===================================
// STATUS UPDATE
// ===================================

function updateStatus(message, color) {

    document.getElementById("statusText").innerText = message;

    document.getElementById("statusDot").style.background = color;
}


// ===================================
// CLEAR PREVIOUS CAPTIONS
// ===================================

function clearCaptions() {

    originalText.innerText = "";

    translatedText.innerText = "";

    liveCaption.innerText = "Listening... captions will appear here.";
}


// ===================================
// START TRANSLATION
// ===================================

async function startTranslation() {

    if (isRecording) {
        return;
    }

    try {

        updateStatus("Requesting audio permission...", "orange");

        clearCaptions();

        // ===================================
        // VIDEO MODE - CAPTURE BROWSER TAB AUDIO
        // ===================================

        if (currentMode === "video") {

            mediaStream = await navigator.mediaDevices.getDisplayMedia({

                video: true,
                audio: true

            });

        }

        // ===================================
        // MICROPHONE MODE
        // ===================================

        else {

            mediaStream = await navigator.mediaDevices.getUserMedia({

                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }

            });

        }


        // Check audio availability

        const audioTracks = mediaStream.getAudioTracks();

        if (audioTracks.length === 0) {

            throw new Error(
                "Audio track not found. Please enable Share Tab Audio while sharing your browser tab."
            );

        }


        // ===================================
        // AUDIO CONTEXT
        // ===================================

        audioContext = new AudioContext();

        await audioContext.resume();

        audioSource = audioContext.createMediaStreamSource(
            mediaStream
        );


        // ===================================
        // AUDIO PROCESSOR
        // ===================================

        processor = audioContext.createScriptProcessor(
            4096,
            1,
            1
        );


        // Calculate 5-second audio chunk size

        chunkSize = audioContext.sampleRate * CHUNK_SECONDS;

        audioBuffer = [];

        requestQueue = Promise.resolve();

        isRecording = true;


        // ===================================
        // PROCESS LIVE AUDIO
        // ===================================

        processor.onaudioprocess = function(event) {

            if (!isRecording) {
                return;
            }

            const input = event.inputBuffer.getChannelData(0);

            // Copy audio data

            audioBuffer.push(new Float32Array(input));

            let totalSamples = audioBuffer.reduce(
                (sum, part) => sum + part.length,
                0
            );


            // Send complete chunks

            while (totalSamples >= chunkSize) {

                const chunk = takeSamples(chunkSize);

                queueAudioChunk(chunk);

                totalSamples -= chunkSize;

            }

        };


        // Connect audio nodes

        audioSource.connect(processor);

        muteNode = audioContext.createGain();

        muteNode.gain.value = 0;

        processor.connect(muteNode);

        muteNode.connect(audioContext.destination);


        // ===================================
        // HANDLE SHARING STOP
        // ===================================

        mediaStream.getTracks().forEach(track => {

            track.onended = () => {

                if (isRecording) {
                    stopTranslation();
                }

            };

        });


        updateStatus("Live listening...", "green");

        console.log("Audio capture started.");

    }

    catch (error) {

        console.error("Start error:", error);

        updateStatus("Capture failed", "red");

        liveCaption.innerText =
            error.message || "Unable to capture audio.";

        cleanupAudio();

    }

}


// ===================================
// EXTRACT AUDIO SAMPLES
// ===================================

function takeSamples(count) {

    const result = new Float32Array(count);

    let offset = 0;

    while (offset < count && audioBuffer.length > 0) {

        const first = audioBuffer[0];

        const needed = count - offset;

        const take = Math.min(needed, first.length);

        result.set(
            first.subarray(0, take),
            offset
        );

        offset += take;

        if (take === first.length) {

            audioBuffer.shift();

        }

        else {

            audioBuffer[0] = first.slice(take);

        }

    }

    return result;

}


// ===================================
// CONVERT AUDIO TO WAV
// ===================================

function encodeWav(samples, sampleRate) {

    const buffer = new ArrayBuffer(
        44 + samples.length * 2
    );

    const view = new DataView(buffer);


    function writeString(offset, text) {

        for (let i = 0; i < text.length; i++) {

            view.setUint8(
                offset + i,
                text.charCodeAt(i)
            );

        }

    }


    // WAV header

    writeString(0, "RIFF");

    view.setUint32(
        4,
        36 + samples.length * 2,
        true
    );

    writeString(8, "WAVE");

    writeString(12, "fmt ");

    view.setUint32(16, 16, true);

    view.setUint16(20, 1, true);

    view.setUint16(22, 1, true);

    view.setUint32(24, sampleRate, true);

    view.setUint32(28, sampleRate * 2, true);

    view.setUint16(32, 2, true);

    view.setUint16(34, 16, true);

    writeString(36, "data");

    view.setUint32(
        40,
        samples.length * 2,
        true
    );


    // Convert Float32 to PCM 16-bit

    let offset = 44;

    for (let i = 0; i < samples.length; i++) {

        let sample = Math.max(
            -1,
            Math.min(1, samples[i])
        );

        sample = sample < 0
            ? sample * 32768
            : sample * 32767;

        view.setInt16(
            offset,
            sample,
            true
        );

        offset += 2;

    }


    return new Blob(
        [buffer],
        { type: "audio/wav" }
    );

}


// ===================================
// QUEUE AUDIO CHUNK
// ===================================

function queueAudioChunk(samples) {

    if (!audioContext || samples.length === 0) {
        return;
    }

    const wavBlob = encodeWav(
        samples,
        audioContext.sampleRate
    );


    requestQueue = requestQueue
        .then(() => sendChunk(wavBlob))
        .catch(error => {

            console.error("Audio queue error:", error);

            updateStatus("Translation error", "red");

            liveCaption.innerText = error.message;

        });

}


// ===================================
// SEND AUDIO CHUNK TO FLASK
// ===================================

async function sendChunk(wavBlob) {

    if (wavBlob.size <= 44) {
        return;
    }

    const formData = new FormData();

    formData.append(
        "audio",
        wavBlob,
        "audio_chunk.wav"
    );

    formData.append(
        "source_language",
        sourceLanguage.value
    );

    formData.append(
        "target_language",
        targetLanguage.value
    );


    updateStatus("Transcribing and translating...", "orange");

    console.log("Sending audio chunk:", wavBlob.size, "bytes");


    // Send request to Flask

    const response = await fetch("/translate_chunk", {

        method: "POST",

        body: formData

    });


    // Read server response

    let data;

    try {

        data = await response.json();

    }

    catch {

        throw new Error("Invalid response from Flask server.");

    }


    if (!response.ok) {

        throw new Error(
            data.error || "Translation failed on server."
        );

    }


    console.log("Server response:", data);


    // ===================================
    // DISPLAY ORIGINAL SPEECH
    // ===================================

    if (data.original && data.original.trim()) {

        if (originalText.innerText.trim()) {

            originalText.innerText += "\n";

        }

        originalText.innerText += data.original;


        // ===================================
        // DISPLAY TRANSLATED TEXT
        // ===================================

        if (data.translated && data.translated.trim()) {

            if (translatedText.innerText.trim()) {

                translatedText.innerText += "\n";

            }

            translatedText.innerText += data.translated;


            // Show latest translated sentence

            liveCaption.innerText = data.translated;

        }

        else {

            liveCaption.innerText = "Translation returned empty text.";

        }


        updateStatus(
            isRecording ? "Live listening..." : "Processing...",
            "green"
        );

    }

    else if (!data.error) {

        console.log("No speech detected in this chunk.");

    }

}


// ===================================
// STOP TRANSLATION
// ===================================

async function stopTranslation() {

    if (!isRecording) {
        return;
    }

    isRecording = false;


    // Stop audio processor

    if (processor) {

        processor.onaudioprocess = null;

        processor.disconnect();

    }


    if (audioSource) {

        audioSource.disconnect();

    }


    if (muteNode) {

        muteNode.disconnect();

    }


    // Process remaining audio

    const remaining = audioBuffer.reduce(
        (sum, part) => sum + part.length,
        0
    );


    if (remaining > 0 && audioContext) {

        const finalChunk = takeSamples(remaining);

        queueAudioChunk(finalChunk);

    }


    updateStatus("Finishing translation...", "orange");


    // Wait until all requests finish

    await requestQueue;


    cleanupAudio();

    updateStatus("Stopped", "red");

    console.log("Translation stopped.");

}


// ===================================
// CLEANUP AUDIO
// ===================================

function cleanupAudio() {

    isRecording = false;


    if (processor) {

        processor.onaudioprocess = null;

        processor.disconnect();

        processor = null;

    }


    if (audioSource) {

        audioSource.disconnect();

        audioSource = null;

    }


    if (muteNode) {

        muteNode.disconnect();

        muteNode = null;

    }


    if (audioContext) {

        audioContext.close();

        audioContext = null;

    }


    if (mediaStream) {

        mediaStream.getTracks().forEach(track => {

            track.stop();

        });

        mediaStream = null;

    }


    audioBuffer = [];

}


// ===================================
// PAGE LOAD
// ===================================

window.addEventListener("load", function() {

    updateStatus("Ready to translate", "gray");

    console.log("LinguaLive AI loaded successfully.");

});
