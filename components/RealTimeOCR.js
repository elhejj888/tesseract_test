'use client';
import React, { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

const RealTimeOCR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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

        Tesseract.recognize(dataURL, "eng", { logger: (m) => console.log(m) })
          .then(({ data: { text, words } }) => {
            setText(text);

            const detectedBoxes = words.map((word) => ({
              text: word.text,
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            }));
            setBoxes(detectedBoxes);

            detectedBoxes.forEach((box) => {
              context.beginPath();
              context.rect(box.x, box.y, box.width, box.height);
              context.lineWidth = 2;
              context.strokeStyle = "red";
              context.stroke();
            });
          })
          .catch((error) => {
            console.error("Tesseract OCR Error:", error);
          });
      }

      if (isScanning) {
        requestAnimationFrame(processFrame);
      }
    };

    if (isScanning) {
      startCamera();
      processFrame();
    }

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isScanning]);

  const toggleScan = () => {
    setIsScanning((prev) => !prev);
    setText("");
    setBoxes([]);
  };

  return (
    <div className="bg-white text-black">
      <div>
        <button
          onClick={toggleScan}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isScanning ? "Stop Scan" : "Start Scan"}
        </button>
        <h2>Detected Text:</h2>
        <p>{text}</p>
      </div>

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
          }}
        />
      </div>
    </div>
  );
};

export default RealTimeOCR;
