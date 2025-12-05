/**
 * Barcode Preview Dialog
 * Shows barcode preview before printing
 */

"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import {
  Barcode,
  Button,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shared";
import { Dialog } from "@radix-ui/react-dialog";

interface BarcodePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  sellingPrice: number;
  barcode: string;
}

export function BarcodePreviewDialog({
  open,
  onOpenChange,
  productName,
  sellingPrice,
  barcode,
}: BarcodePreviewDialogProps) {
  const barcodeContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!barcodeContainerRef.current) {
      toast.error("❌ Barcode not ready");
      return;
    }

    const canvas = barcodeContainerRef.current.querySelector("canvas");
    if (!canvas) {
      toast.error("❌ Failed to find barcode");
      return;
    }

    // Create print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("❌ Failed to open print window");
      return;
    }

    // Convert canvas to data URL
    const barcodeDataUrl = canvas.toDataURL("image/png");

    // Generate print HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${productName}</title>
          <style>
            @media print {
              @page {
                margin: 0.5cm;
                size: auto;
              }
            }
            body {
              margin: 0;
              padding: 8px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .barcode-container {
              position: absolute;
              top:0;
              left:0;
              text-align: center;
              page-break-inside: avoid;
            }
            .product-name {
              font-size: 16px;
              font-weight: bold;
              float:left;
              margin-left:8px;
            }
            .product-price {
              font-size: 16px;
              color: #666;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${productName}</div>
            <div class="product-price"> ${sellingPrice}</div>
            <img src="${barcodeDataUrl}" alt="Barcode for ${barcode}" />
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    toast.success("✅Barcode sent to printer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <div>
              <span className="font-semibold text-lg">{productName}</span>
              <span className="text-sm text-muted-foreground ml-2">{sellingPrice.toFixed(2)}</span>
            </div>
          </DialogTitle>
          <DialogDescription>Preview the barcode before printing</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {/* Product Info */}

          {/* Barcode Preview */}
          <div
            ref={barcodeContainerRef}
            className="border rounded-lg p-6 bg-white flex flex-col items-center justify-center min-h-[100px]"
          >
            {barcode ? (
              <div className="flex flex-col items-center gap-3">
                <Barcode
                  value={barcode}
                  format="CODE128"
                  width={2}
                  height={50}
                  displayValue={true}
                  fontSize={20}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No barcode available for product</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={handlePrint} disabled={!barcode}>
              <Printer className="mr-2 h-4 w-4" />
              <span>Print Barcode</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
