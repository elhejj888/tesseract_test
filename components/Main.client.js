"use client";

import React, { useRef, useState } from "react";
import { createWorker } from "tesseract.js";

export default function Main() {
    const rawVideoRef = useRef(null); // Reference for the video element
    const canvasRef = useRef(null); // Reference for the canvas element

    const [worker] = useState(() =>
        createWorker('eng') // Create a Tesseract.js worker
    );
    const [outputText, setOutputText] = useState(""); // State for OCR output
    const [localStream, setLocalStream] = useState(null); // State for webcam stream
    const [isProcessing, setIsProcessing] = useState(false); // State for processing OCR

    // Start the webcam
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
            setLocalStream(stream);
            rawVideoRef.current.srcObject = stream;
        } catch (error) {
            console.error("Error accessing webcam:", error);
        }
    };

    // Stop the webcam
    const stopWebcam = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
    };

    // Capture snapshot and perform OCR
    const captureAndProcess = async () => {
        if (!canvasRef.current || !rawVideoRef.current) return;

        setIsProcessing(true);

        // Draw the video frame onto the canvas
        const video = rawVideoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            video.videoWidth,
            video.videoHeight
        );

        // Convert the canvas to an image data URL
        const imgDataURL = canvas.toDataURL("image/png");

        try {
            const result = await worker.recognize(imgDataURL, "eng");
            console.log("OCR Result:", result.data.text);
            setOutputText(result.data.text); // Set the recognized text
        } catch (error) {
            console.error("Error during OCR processing:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container">
            <div className="video-section">
                {/* Video feed */}
                <video
                    ref={rawVideoRef}
                    autoPlay
                    playsInline
                    width={800}
                    height={450}
                ></video>
                {/* Canvas for capturing video frame */}
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    style={{ display: "none" }}
                ></canvas>
            </div>

            <div className="controls">
                <button onClick={startWebcam}>Start Webcam</button>
                <button onClick={stopWebcam}>Stop Webcam</button>
                <button onClick={captureAndProcess} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Capture & Process OCR"}
                </button>
            </div>

            {outputText && (
                <div className="output">
                    <h3>Recognized Text:</h3>
                    <p>{outputText}</p>
                </div>
            )}
        </div>
    );
}
