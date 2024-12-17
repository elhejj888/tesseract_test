'use client';
import React, { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

const SelectiveOCR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [endPos, setEndPos] = useState(null);

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use the back camera
          },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    if (isScanning) {
      startCamera();
    }

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isScanning]);

  const handleMouseDown = (e) => {
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setEndPos({ x, y });

    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext("2d");

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    performOCR();
  };

  const performOCR = () => {
    if (!startPos || !endPos) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const overlayCanvas = overlayCanvasRef.current;

    const rectWidth = Math.abs(endPos.x - startPos.x);
    const rectHeight = Math.abs(endPos.y - startPos.y);
    const rectX = Math.min(startPos.x, endPos.x);
    const rectY = Math.min(startPos.y, endPos.y);

    // Crop the selected area
    const croppedData = context.getImageData(rectX, rectY, rectWidth, rectHeight);

    // Draw cropped area onto a temporary canvas for OCR
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = rectWidth;
    tempCanvas.height = rectHeight;
    const tempContext = tempCanvas.getContext("2d");
    tempContext.putImageData(croppedData, 0, 0);

    const dataURL = tempCanvas.toDataURL("image/png");

    Tesseract.recognize(dataURL, "eng", { logger: (m) => console.log(m) })
      .then(({ data: { text } }) => {
        setText(text);
      })
      .catch((error) => {
        console.error("Tesseract OCR Error:", error);
      });

    // Clear overlay
    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  };

  const toggleScan = () => {
    setIsScanning((prev) => !prev);
    setText("");
    setStartPos(null);
    setEndPos(null);
  };

  return (
    <div className="bg-white text-black">
      <button
        onClick={toggleScan}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {isScanning ? "Stop Scan" : "Start Scan"}
      </button>

      <h2>Detected Text:</h2>
      <p>{text}</p>

      <div style={{ position: "relative", marginTop: "20px" }}>
        <video
          ref={videoRef}
          style={{
            display: isScanning ? "block" : "none",
            width: "100%",
            maxWidth: "640px",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            maxWidth: "640px",
            display: isScanning ? "block" : "none",
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            maxWidth: "640px",
            display: isScanning ? "block" : "none",
            cursor: "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default SelectiveOCR;
