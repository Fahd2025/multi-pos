'use client'

import React, { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeProps {
  value: string
  format?: string
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  textAlign?: string
  textPosition?: string
  textMargin?: number
  fontOptions?: string
  font?: string
  background?: string
  lineColor?: string
  margin?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  className?: string
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 2,
  height = 100,
  displayValue = true,
  fontSize = 20,
  textAlign = 'center',
  textPosition = 'bottom',
  textMargin = 2,
  fontOptions = '',
  font = 'monospace',
  background = '#ffffff',
  lineColor = '#000000',
  margin = 10,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  className = '',
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          textAlign,
          textPosition,
          textMargin,
          fontOptions,
          font,
          background,
          lineColor,
          margin,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
        })
      } catch (error) {
        console.error('Error generating barcode:', error)
      }
    }
  }, [
    value,
    format,
    width,
    height,
    displayValue,
    fontSize,
    textAlign,
    textPosition,
    textMargin,
    fontOptions,
    font,
    background,
    lineColor,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      {...props}
    />
  )
}