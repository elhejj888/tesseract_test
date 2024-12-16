// components/RealTimeOCR.js
'use client';
import React, { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

const RealTimeOCR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        } catch (err) {
          console.error("Error accessing the camera: ", err);
        }
      }
    };

    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL("image/png");

        Tesseract.recognize(dataURL, "eng")
          .then(({ data: { text } }) => {
            setText(text);
          })
          .catch((error) => {
            console.error("Tesseract OCR Error:", error);
          });
      }
      requestAnimationFrame(processFrame);
    };

    startCamera();
    processFrame();

    return () => {
      const stream = videoRef.current.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className='bg-white text-black'>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div>
        <h2>Detected Text:</h2>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default RealTimeOCR;
