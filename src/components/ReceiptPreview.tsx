import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  Receipt, 
  Printer, 
  Download, 
  Mail, 
  Phone,
  MapPin,
  Clock,
  User,
  CreditCard
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  stock: number;
  sku: string;
}

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  onConfirmSale: () => void;
  processing: boolean;
  previewMode?: boolean;
  settings?: any;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  onConfirmSale,
  processing,
  previewMode = false,
  settings: propsSettings
}) => {
  const { formatCurrency } = useCurrency();
  const { settings: contextSettings } = useSettings();
  const [receiptSettings, setReceiptSettings] = useState<any>(null);
  const saleNumber = `SALE-${Date.now()}`;
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  // Use settings from props if provided, otherwise from context
  useEffect(() => {
    if (propsSettings) {
      setReceiptSettings(propsSettings);
    } else if (contextSettings?.receipt) {
      setReceiptSettings(contextSettings.receipt);
    } else {
      // Fallback defaults
      setReceiptSettings({
        header: "Smart POS System",
        showLogo: true,
        primaryLogo: null,
        logoPosition: "center",
        fontSize: 12,
        fontFamily: "Courier New",
        showDateTime: true,
        showOrderNumber: true,
        showCashierName: true,
        showItemCodes: true,
        showTaxBreakdown: true,
        footer: "Thank you for your business!",
        customFooterText: "Please keep this receipt for your records\nReturn policy: 30 days with receipt",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        headerColor: "#000000",
        borderColor: "#cccccc"
      });
    }
  }, [propsSettings, contextSettings]);

  if (!receiptSettings) {
    return null;
  }

  const companyInfo = contextSettings?.company || {
    name: "Smart POS System",
    address: "123 Business Street, City, State 12345",
    phone: "(555) 123-4567",
    email: "info@smartpos.com"
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${saleNumber}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  margin: 0; 
                  padding: 20px;
                  max-width: 300px;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .separator { border-top: 1px dashed #000; margin: 10px 0; }
                .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
                .total-row { margin: 5px 0; font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const receiptContent = (
    <div 
      id="receipt-content" 
      className="space-y-4 p-6 rounded-lg border max-w-sm mx-auto relative"
      style={{
        backgroundColor: receiptSettings.backgroundColor,
        color: receiptSettings.textColor,
        fontFamily: receiptSettings.fontFamily,
        fontSize: receiptSettings.fontSize + 'px',
        width: previewMode ? '100%' : undefined
      }}
    >
      {/* Secondary Logo - Positioned */}
      {receiptSettings.secondaryLogo && receiptSettings.secondaryLogoPosition && 
       !['header', 'footer'].includes(receiptSettings.secondaryLogoPosition) && (
        <img 
          src={receiptSettings.secondaryLogo} 
          alt="Secondary Logo" 
          className="absolute"
          style={{ 
            width: `${receiptSettings.secondaryLogoSize || 60}px`,
            ...(receiptSettings.secondaryLogoPosition === 'top-left' && { top: '10px', left: '10px' }),
            ...(receiptSettings.secondaryLogoPosition === 'top-center' && { top: '10px', left: '50%', transform: 'translateX(-50%)' }),
            ...(receiptSettings.secondaryLogoPosition === 'top-right' && { top: '10px', right: '10px' }),
            ...(receiptSettings.secondaryLogoPosition === 'bottom-left' && { bottom: '10px', left: '10px' }),
            ...(receiptSettings.secondaryLogoPosition === 'bottom-center' && { bottom: '10px', left: '50%', transform: 'translateX(-50%)' }),
            ...(receiptSettings.secondaryLogoPosition === 'bottom-right' && { bottom: '10px', right: '10px' })
          }}
        />
      )}

      {/* Store Header */}
      <div className="text-center space-y-2">
        {receiptSettings.showLogo && receiptSettings.primaryLogo && (
          <div className="flex justify-center mb-4">
            <img 
              src={receiptSettings.primaryLogo} 
              alt="Logo" 
              className="max-w-16 h-auto"
            />
          </div>
        )}
        {!receiptSettings.primaryLogo && receiptSettings.showLogo && (
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto flex items-center justify-center">
            <span className="text-white font-bold text-xl">POS</span>
          </div>
        )}
        
        {/* Secondary logo in header position */}
        {receiptSettings.secondaryLogo && receiptSettings.secondaryLogoPosition === 'header' && (
          <div className="flex justify-center mb-2">
            <img 
              src={receiptSettings.secondaryLogo} 
              alt="Secondary Logo" 
              style={{ width: `${receiptSettings.secondaryLogoSize || 60}px` }}
            />
          </div>
        )}
        
        <h1 className="text-xl font-bold" style={{ color: receiptSettings.headerColor }}>
          {receiptSettings.header || companyInfo.name}
        </h1>
        <div className="text-sm space-y-1" style={{ opacity: 0.8 }}>
          <div className="flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{companyInfo.address}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{companyInfo.phone}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Mail className="w-3 h-3" />
            <span>{companyInfo.email}</span>
          </div>
        </div>
      </div>

          <Separator />

      {/* Sale Information */}
      <div className="space-y-2 text-sm">
        {receiptSettings.showOrderNumber && (
          <div className="flex justify-between">
            <span className="font-medium">Receipt #:</span>
            <span className="font-mono">{saleNumber}</span>
          </div>
        )}
        {receiptSettings.showDateTime && (
          <>
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Time:</span>
              <span>{currentTime}</span>
            </div>
          </>
        )}
        {receiptSettings.showCashierName && (
          <div className="flex justify-between">
            <span className="font-medium">Cashier:</span>
            <span>Admin User</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium">Payment:</span>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span className="capitalize">{paymentMethod}</span>
          </div>
        </div>
      </div>

          <Separator />

          {/* Items */}
          <div className="space-y-1">
            <h3 className="font-semibold text-center mb-3">ITEMS</h3>
            {cart.map((item, index) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    {receiptSettings.showItemCodes && (
                      <div className="text-xs opacity-75">SKU: {item.sku}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                {index < cart.length - 1 && <div className="border-t border-dashed border-gray-300 my-2"></div>}
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {receiptSettings.showTaxBreakdown && (
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Separator />

      {/* Footer */}
      <div className="text-center space-y-2 text-xs" style={{ opacity: 0.8 }}>
        {/* Secondary logo in footer position */}
        {receiptSettings.secondaryLogo && receiptSettings.secondaryLogoPosition === 'footer' && (
          <div className="flex justify-center mb-2">
            <img 
              src={receiptSettings.secondaryLogo} 
              alt="Secondary Logo" 
              style={{ width: `${receiptSettings.secondaryLogoSize || 60}px` }}
            />
          </div>
        )}
        
        <p className="font-semibold">{receiptSettings.footer}</p>
        {receiptSettings.customFooterText && (
          <div className="whitespace-pre-line">
            {receiptSettings.customFooterText}
          </div>
        )}
        <div className="flex items-center justify-center gap-1 mt-4">
          <Clock className="w-3 h-3" />
          <span>Processed at {currentTime}</span>
        </div>
      </div>
    </div>
  );

  // If preview mode, just return the content without dialog
  if (previewMode) {
    return receiptContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Receipt Preview
          </DialogTitle>
        </DialogHeader>

        {receiptContent}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              // Generate and download PDF receipt
              handlePrint();
            }}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirmSale}
            disabled={processing}
            className="flex-1 bg-gradient-to-r from-primary to-secondary"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-2" />
                Complete Sale
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreview;