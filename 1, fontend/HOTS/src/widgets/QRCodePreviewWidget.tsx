import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Monitor, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WidgetProps } from '@/types/widgetTypes';
import { 
  DEFAULT_LOGOS, 
  QR_SIZE, 
  getSafeLogoSettings 
} from './qr/QRCoreEngine';

export interface QRCodePreviewProps {
  config: any;
  showDownload?: boolean;
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({ config, showDownload = true }) => {
  const qrRef = React.useRef<HTMLDivElement>(null);

  const qrValue = useMemo(() => {
    if (config.customCode) {
      return `${window.location.origin}/hots/redirect/${config.customCode.toLowerCase()}`;
    }
    return config.targetUrl || "https://hots.indofood.com";
  }, [config.customCode, config.targetUrl]);

  const currentLogoUrl = useMemo(() => {
    if (!config.design?.logo || config.design.logo === 'none') return null;
    if (config.design.logo === 'custom') return config.design.customLogoUrl;
    const found = DEFAULT_LOGOS.find(l => l.id === config.design.logo);
    return found ? found.url : null;
  }, [config.design?.logo, config.design?.customLogoUrl]);

  const [logoAspectRatio, setLogoAspectRatio] = useState(1);
  useEffect(() => {
    if (currentLogoUrl) {
      const img = new Image();
      img.onload = () => setLogoAspectRatio(img.width / img.height);
      img.src = currentLogoUrl;
    }
  }, [currentLogoUrl]);

  const handleDownload = async () => {
    if (!qrRef.current) return;
    
    // Create a temporary canvas for high-res export
    const scale = 3;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = (QR_SIZE + 40) * scale;
      canvas.height = (QR_SIZE + 40) * scale;
      
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = config.design.bgColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20 * scale, 20 * scale, QR_SIZE * scale, QR_SIZE * scale);
        
        const link = document.createElement('a');
        link.download = `QR_${config.customCode || 'code'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      // Handle special characters in data URL
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Failed to export QR:', err);
      alert('Could not export QR as PNG. Please try right-clicking the image.');
    }
  };

  if (!config || !config.design) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div ref={qrRef} className="relative inline-block">
        <div className={cn(
          "qr-container-frame relative p-5 rounded-[40px] flex flex-col items-center bg-white shadow-sm border",
          config.design.frame === 'simple' && "border-[4px]",
          config.design.frame === 'thick' && "border-[12px]",
        )} style={{ borderColor: config.design.frameColor }}>
          
          <div className="bg-white p-2 rounded-2xl relative mb-6">
            <QRCodeSVG
              value={qrValue}
              size={QR_SIZE}
              fgColor={config.design.qrColor}
              bgColor={config.design.bgColor}
              level="H"
              includeMargin={false}
              imageSettings={currentLogoUrl ? (() => {
                const isStrip = config.design.logoPlacement === 'strip';
                const dims = getSafeLogoSettings(qrValue, isStrip ? 'strip' : 'center', logoAspectRatio);
                return {
                  src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                  y: dims.y, height: dims.height, width: dims.width, excavate: true,
                };
              })() : undefined}
            />

            {config.design.logoPlacement === 'strip' && currentLogoUrl && (() => {
              const dims = getSafeLogoSettings(qrValue, 'strip', logoAspectRatio);
              return (
                <div className="absolute top-0 left-0 w-full flex items-center justify-center p-0.5 pointer-events-none" style={{ top: dims.y, height: dims.height, background: `linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%)` }}>
                  <img src={currentLogoUrl} className="max-w-full max-h-full object-contain" alt="logo" />
                </div>
              );
            })()}
          </div>

          {config.design.labelStyle === 'pill-bottom' && (
            <div className="mt-4 rounded-full flex items-center shadow-lg w-full h-[52px] p-2" style={{ backgroundColor: config.design.labelBgColor || config.design.frameColor }}>
              <div className="bg-white rounded-full flex items-center justify-center shrink-0 h-9 w-9">
                 {config.design.frameIcon === 'monitor' ? <Monitor className="w-5 h-5" style={{ color: config.design.labelBgColor || config.design.frameColor }} /> : <Smartphone className="w-5 h-5" style={{ color: config.design.labelBgColor || config.design.frameColor }} />}
              </div>
              <div className="flex-1 flex items-center justify-center text-white font-bold px-2">
                <span className="text-center w-full" style={{ fontSize: `${config.design.labelFontSize || 14}px` }}>{config.design.frameText}</span>
              </div>
            </div>
          )}

          {config.design.labelStyle === 'scan-me-bottom' && (
            <div className="mt-3 px-10 py-3 rounded-2xl flex items-center justify-center text-white font-black italic uppercase shadow-xl rotate-[-1deg] text-lg" style={{ backgroundColor: config.design.labelBgColor }}>
              {config.design.frameText}
            </div>
          )}
        </div>
      </div>

      {showDownload && (
        <Button onClick={handleDownload} className="w-full h-12 gap-3 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg font-bold text-sm">
          <Download className="w-5 h-5" />
          Download Production QR
        </Button>
      )}
    </div>
  );
};

const QRCodePreviewWidget: React.FC<WidgetProps> = (props) => {
  const { formData, value } = props;
  
  // High-priority: explicit value prop (injected from EAV)
  let rawData = value || formData?.qr_config;
  
  // Robustness: Parse if it's a string (EAV data is strings)
  let qrConfig = rawData;
  if (typeof rawData === 'string') {
    try {
      qrConfig = JSON.parse(rawData);
    } catch (e) {
      console.warn("Failed to parse QR preview data:", e);
    }
  }

  if (!qrConfig) {
    return (
      <Card className="p-6 border-dashed bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm">No QR data attached to this ticket.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 border-none bg-transparent shadow-none flex flex-col items-center">
      <QRCodePreview config={qrConfig} />
    </Card>
  );
};

export default QRCodePreviewWidget;
