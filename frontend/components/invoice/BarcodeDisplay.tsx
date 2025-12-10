"use client";

/**
 * Barcode Display Component
 *
 * Generates and displays barcodes using the react-barcode library
 * Supports CODE128 format for invoice numbering
 */

import React from "react";
import Barcode from "react-barcode";

type BarcodeFormat =
  | "CODE128"
  | "CODE39"
  | "CODE128A"
  | "CODE128B"
  | "CODE128C"
  | "EAN13"
  | "EAN8"
  | "EAN5"
  | "EAN2"
  | "UPC"
  | "UPCE"
  | "ITF14"
  | "ITF"
  | "MSI"
  | "MSI10"
  | "MSI11"
  | "MSI1010"
  | "MSI1110"
  | "pharmacode"
  | "codabar";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  format?: BarcodeFormat;
  className?: string;
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  width = 2,
  height = 50,
  displayValue = true,
  format = "CODE128",
  className = "",
}) => {
  if (!value) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <Barcode
        value={value}
        format={format}
        width={width}
        height={height}
        displayValue={displayValue}
        margin={10}
        fontSize={14}
        textMargin={5}
        background="#ffffff"
        lineColor="#000000"
      />
    </div>
  );
};

export default BarcodeDisplay;
