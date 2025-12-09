"use client";

/**
 * QR Code Display Component
 *
 * Generates and displays QR codes using the qrcode library
 * Used for ZATCA compliance in invoices
 */

import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 128,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          errorCorrectionLevel: "M",
        },
        (error) => {
          if (error) {
            console.error("QR Code generation error:", error);
          }
        }
      );
    }
  }, [value, size]);

  if (!value) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default QRCodeDisplay;
