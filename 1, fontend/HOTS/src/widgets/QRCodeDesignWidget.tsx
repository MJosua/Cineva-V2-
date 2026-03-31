import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetProps } from '@/types/widgetTypes';
import {
  RotateCcw,
  Upload,
  Settings2,
  Image as ImageIcon,
  Palette,
  Layout,
  Link as LinkIcon,
  Info,
  Check,
  Smartphone,
  Monitor,
  LayoutTemplate,
  Maximize2,
  Download,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MediaLibraryModal from '@/components/modals/MediaLibraryModal';
import {
  DEFAULT_LOGOS,
  QR_SIZE,
  QR_AREA,
  getSafeLogoSettings,
  calculateScanReliability
} from './qr/QRCoreEngine';

// Keep static for the info panel display
const LOGO_PRESETS = {
  center: { width: 40, height: 40 },
  strip: { width: 120, height: 27 }, // display only, actual computed at render
};

// Templates
const TEMPLATES = [
  {
    id: 'indofood-classic',
    label: 'Indofood Classic',
    config: {
      frame: 'none',
      labelStyle: 'pill-bottom',
      frameColor: '#00549C',
      labelBgColor: '#00549C',
      frameText: 'Meeting Room',
      frameIcon: 'smartphone',
      qrColor: '#000000',
      bgColor: '#ffffff',
      logo: 'indofood',
      logoPlacement: 'strip',
      logoWidth: 120,
      logoHeight: 30,
    }
  },
  {
    id: 'flavour-burst',
    label: 'Flavour Burst',
    config: {
      frame: 'simple',
      labelStyle: 'scan-me-bottom',
      frameColor: '#FF6B00',
      labelBgColor: '#FF6B00',
      frameText: 'Flavour!',
      frameIcon: 'smartphone',
      qrColor: '#2D3436',
      bgColor: '#ffffff',
      logo: 'flavour',
      logoPlacement: 'center',
      logoWidth: 60,
      logoHeight: 60,
    }
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    config: {
      frame: 'none',
      labelStyle: 'none',
      frameColor: '#000000',
      labelBgColor: '#000000',
      frameText: '',
      frameIcon: 'smartphone',
      qrColor: '#000000',
      bgColor: '#ffffff',
      logo: 'none',
      logoPlacement: 'center',
      logoWidth: 40,
      logoHeight: 40,
    }
  }
];

interface QRCodeDesignWidgetProps extends WidgetProps {
  value?: any;
  onChange?: (value: any) => void;
  globalValues?: Record<string, any>;
  formData?: any;
  setGlobalValues?: React.Dispatch<React.SetStateAction<any>>;
  fieldName?: string;
}

const QRCodeDesignWidget: React.FC<QRCodeDesignWidgetProps> = (props) => {
  const { value, onChange, globalValues, formData, setGlobalValues, fieldName } = props;
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Hybrid sources for form data and setter
  const currentGlobalValues = globalValues || formData || {};
  const fieldKey = fieldName || 'qr_config';
  const dataValue = value || (currentGlobalValues[fieldKey]);

  // Local state for the complex configuration
  const [config, setConfig] = useState(() => {
    const defaultVal = {
      targetUrl: '',
      customCode: '',
      title: 'Short Link',
      requireLogin: false,
      design: {
        frame: 'simple',
        labelStyle: 'pill-bottom',
        frameColor: '#00549C',
        labelBgColor: '#00549C',
        frameText: 'Meeting Room',
        frameIcon: 'smartphone',
        qrColor: '#000000',
        bgColor: '#ffffff',
        logo: 'indofood',
        logoPlacement: 'strip',
        customLogoUrl: null,
        eyeShape: 'square',
      }
    };
    let parsedValue = dataValue;
    if (typeof dataValue === 'string') {
      try {
        parsedValue = JSON.parse(dataValue);
      } catch (e) {
        console.warn("Failed to parse QR config string:", e);
      }
    }

    if (parsedValue && typeof parsedValue === 'object') {
      return { ...defaultVal, ...parsedValue, design: { ...defaultVal.design, ...(parsedValue.design || {}) } };
    }
    return defaultVal;
  });

  // Sync to parent — use JSON.stringify for stable dependency tracking
  const configJson = JSON.stringify(config);
  useEffect(() => {
    if (onChange) {
      onChange(config);
    } else if (setGlobalValues) {
      setGlobalValues((prev: any) => ({ ...prev, [fieldKey]: config }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configJson]);

  const handleDesignChange = (key: string, val: any) => {
    setConfig(prev => ({
      ...prev,
      design: { ...prev.design, [key]: val }
    }));
  };

  const applyTemplate = (template: any) => {
    setConfig(prev => ({
      ...prev,
      design: { ...prev.design, ...template.config }
    }));
  };

  const handleLogoSelect = (url: string) => {
    setConfig(prev => ({
      ...prev,
      design: { ...prev.design, logo: 'custom', customLogoUrl: url }
    }));
  };

  const handleReset = () => {
    setConfig({
      targetUrl: '',
      customCode: '',
      title: 'Short Link',
      requireLogin: false,
      design: {
        frame: 'simple',
        labelStyle: 'pill-bottom',
        frameColor: '#00549C',
        labelBgColor: '#00549C',
        frameText: 'Meeting Room',
        frameIcon: 'smartphone',
        qrColor: '#000000',
        bgColor: '#ffffff',
        logo: 'indofood',
        logoPlacement: 'strip',
        customLogoUrl: null,
        eyeShape: 'square',
      }
    });
  };

  const qrValue = useMemo(() => {
    if (config.customCode) {
      // Use short code redirect if available
      return `${window.location.origin}/hots/redirect/${config.customCode.toLowerCase()}`;
    }
    return config.targetUrl || "https://hots.indofood.com";
  }, [config.customCode, config.targetUrl]);

  const currentLogoUrl = useMemo(() => {
    if (config.design.logo === 'custom') return config.design.customLogoUrl;
    const found = DEFAULT_LOGOS.find(l => l.id === config.design.logo);
    return found ? found.url : null;
  }, [config.design.logo, config.design.customLogoUrl]);

  const [logoAspectRatio, setLogoAspectRatio] = useState(1);

  // Measure logo dimensions whenever it changes to preserve aspect ratio - Fixes scale/blur issue
  useEffect(() => {
    if (currentLogoUrl) {
      const img = new Image();
      img.onload = () => {
        if (img.width && img.height) {
          setLogoAspectRatio(img.width / img.height);
        }
      };
      img.src = currentLogoUrl;
    }
  }, [currentLogoUrl]);

  // Compose a dynamic "Branded Strip" - Logo centered in a full-safe-width white band
  // This satisfies the user's desire for a "Reserved Area" that looks full-width
  const brandedLogoDataUri = useMemo(() => {
    if (!currentLogoUrl || !logoAspectRatio) return null;

    const isStrip = config.design.logoPlacement === 'strip';
    const dims = getSafeLogoSettings(qrValue, isStrip ? 'strip' : 'center', logoAspectRatio);

    // For strip, we want the white background to be the FULL safe width
    // Even if the logo itself is smaller. This creates the "reserved area" look.
    const bgW = dims.width;
    const bgH = dims.height;

    // Calculate logo dimensions within that background to preserve aspect ratio
    // (dims already handled this, but for strip we want the container to be the full safeWidth)
    const svg = `
      <svg width="${bgW}" height="${bgH}" viewBox="0 0 ${bgW} ${bgH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white" />
        <image 
          href="${currentLogoUrl.replace(/&/g, '&amp;')}" 
          width="${bgW}" 
          height="${bgH}" 
          x="0" 
          y="0" 
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    `;

    try {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (e) {
      return currentLogoUrl; // Fallback
    }
  }, [currentLogoUrl, logoAspectRatio, config.design.logoPlacement, qrValue]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1">
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleLogoSelect}
        title="Select QR Logo"
      />

      {/* Configuration Panel */}
      <div className="lg:col-span-8 space-y-6">
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Target URL (Destination)</Label>
              <Input
                value={config.targetUrl}
                onChange={e => setConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
                placeholder="https://example.com/long-link"
                className="h-10 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Short Code (Slug)</Label>
              <div className="relative">
                <Input
                  value={config.customCode}
                  onChange={e => setConfig(prev => ({ ...prev, customCode: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') }))}
                  placeholder="e.g. mr-001"
                  className="h-10 border-slate-200 uppercase pl-8 font-mono"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">/</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-6 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="templates" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Templates</TabsTrigger>
              <TabsTrigger value="frames" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Frames</TabsTrigger>
              <TabsTrigger value="labels" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Labels</TabsTrigger>
              <TabsTrigger value="logos" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Logos</TabsTrigger>
              <TabsTrigger value="colors" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Colors</TabsTrigger>
              <TabsTrigger value="more" className="rounded-lg text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">More</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="pt-4 animate-in fade-in zoom-in duration-200">
              <div className="grid grid-cols-3 gap-4">
                {TEMPLATES.map(tmp => (
                  <button
                    key={tmp.id}
                    onClick={() => applyTemplate(tmp)}
                    className="group relative flex flex-col items-start p-4 border rounded-2xl bg-white hover:border-primary/50 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      <LayoutTemplate className="w-8 h-8 text-slate-300 group-hover:text-primary/30 transition-colors" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{tmp.label}</span>
                    <div className="flex gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tmp.config.frameColor }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tmp.config.qrColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="frames" className="space-y-6 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleDesignChange('frame', 'none')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all aspect-video gap-1 relative overflow-hidden",
                    config.design.frame === 'none' ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-8 h-8 border-2 border-slate-200 rounded-sm opacity-50" />
                  <span className="text-[10px] font-bold mt-1 uppercase">No Border</span>
                </button>
                <button
                  onClick={() => handleDesignChange('frame', 'simple')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all aspect-video gap-1 relative overflow-hidden",
                    config.design.frame === 'simple' ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-10 h-10 border-4 border-slate-300 rounded-lg" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Simple Border</span>
                </button>
                <button
                  onClick={() => handleDesignChange('frame', 'thick')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all aspect-video gap-1 relative overflow-hidden",
                    config.design.frame === 'thick' ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-10 h-10 border-[8px] border-slate-400 rounded-2xl" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Thick Frame</span>
                </button>
              </div>

              {config.design.frame !== 'none' && (
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Frame Border Color</Label>
                  <div className="flex gap-4">
                    <Input
                      type="color"
                      value={config.design.frameColor}
                      onChange={e => handleDesignChange('frameColor', e.target.value)}
                      className="h-12 w-20 p-1 rounded-xl cursor-pointer"
                    />
                    <Input
                      value={config.design.frameColor}
                      onChange={e => handleDesignChange('frameColor', e.target.value)}
                      className="h-12 text-sm font-mono uppercase bg-white border-slate-200 rounded-xl max-w-[120px]"
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="labels" className="space-y-6 pt-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'none', label: 'None', icon: <X className="w-5 h-5" /> },
                  { id: 'pill-bottom', label: 'Pill Icon', icon: <div className="w-8 h-4 bg-slate-200 rounded-full" /> },
                  { id: 'label-bottom', label: 'Box Bottom', icon: <div className="w-8 h-3 bg-slate-300 rounded-sm mt-3" /> },
                  { id: 'scan-me-bottom', label: 'Banner', icon: <div className="w-full h-4 bg-slate-400 mb-[-10px]" /> },
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleDesignChange('labelStyle', style.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all aspect-square gap-1 relative overflow-hidden group",
                      config.design.labelStyle === style.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    {style.icon}
                    <span className="text-[10px] font-medium mt-1">{style.label}</span>
                  </button>
                ))}
              </div>

              {config.design.labelStyle !== 'none' && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Label Text</Label>
                      <Input
                        value={config.design.frameText}
                        onChange={e => handleDesignChange('frameText', e.target.value)}
                        className="h-11 bg-white border-slate-200 rounded-xl"
                        placeholder="SCAN ME"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Label Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.design.labelBgColor || config.design.frameColor}
                          onChange={e => handleDesignChange('labelBgColor', e.target.value)}
                          className="h-11 w-14 p-1 rounded-xl cursor-pointer"
                        />
                        <Input
                          value={config.design.labelBgColor || config.design.frameColor}
                          onChange={e => handleDesignChange('labelBgColor', e.target.value)}
                          className="h-11 text-sm font-mono uppercase bg-white border-slate-200 rounded-xl"
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Manual Font Size (px)</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="1"
                        value={config.design.labelFontSize || 12}
                        onChange={e => handleDesignChange('labelFontSize', parseInt(e.target.value))}
                        className="flex-1 accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-400 w-8">{config.design.labelFontSize || 12}</span>
                    </div>
                  </div>

                  {config.design.labelStyle === 'pill-bottom' && (
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Icon Type</Label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleDesignChange('frameIcon', 'smartphone')}
                          className={cn(
                            "h-16 w-16 rounded-2xl p-0 flex items-center justify-center transition-all border-2",
                            config.design.frameIcon === 'smartphone' ? "border-primary bg-primary/5" : "bg-white border-slate-200"
                          )}>
                          <Smartphone className={cn("w-8 h-8", config.design.frameIcon === 'smartphone' ? "text-primary" : "text-slate-400")} />
                        </button>
                        <button
                          onClick={() => handleDesignChange('frameIcon', 'monitor')}
                          className={cn(
                            "h-16 w-16 rounded-2xl p-0 flex items-center justify-center transition-all border-2",
                            config.design.frameIcon === 'monitor' ? "border-primary bg-primary/5" : "bg-white border-slate-200"
                          )}>
                          <Monitor className={cn("w-8 h-8", config.design.frameIcon === 'monitor' ? "text-primary" : "text-slate-400")} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logos" className="space-y-6 pt-4">
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_LOGOS.map(logo => (
                  <button
                    key={logo.id}
                    onClick={() => handleDesignChange('logo', logo.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all aspect-square gap-1 overflow-hidden relative",
                      config.design.logo === logo.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    {logo.url ? (
                      <div className="w-12 h-12 flex items-center justify-center p-1 bg-white rounded-lg shadow-sm border border-slate-50">
                        <img src={logo.url} alt={logo.label} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">∅</div>
                    )}
                    <span className="text-[10px] font-medium mt-1">{logo.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Logo Placement Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDesignChange('logoPlacement', 'center')}
                      className={cn(
                        "h-14 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1",
                        config.design.logoPlacement !== 'strip' ? "border-primary bg-primary/10 text-primary" : "bg-white border-slate-200 text-slate-400"
                      )}>
                      <div className="w-5 h-5 border-2 border-current rounded-sm" />
                      Center Square
                    </button>
                    <button
                      onClick={() => handleDesignChange('logoPlacement', 'strip')}
                      className={cn(
                        "h-14 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1",
                        config.design.logoPlacement === 'strip' ? "border-primary bg-primary/10 text-primary" : "bg-white border-slate-200 text-slate-400"
                      )}>
                      <div className="w-10 h-3 border-2 border-current rounded-sm" />
                      Horizontal Strip
                    </button>
                  </div>
                </div>

                {/* Auto-calculated size info */}
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-slate-400 font-mono space-y-1">
                  <p>Auto Size: <span className="text-slate-600 font-bold">
                    {config.design.logoPlacement === 'strip'
                      ? `${LOGO_PRESETS.strip.width}×${LOGO_PRESETS.strip.height}px (avoids finder zones)`
                      : `${LOGO_PRESETS.center.width}×${LOGO_PRESETS.center.height}px (safe center)`
                    }
                  </span></p>
                  <p>Damage: <span className="text-slate-600 font-bold">
                    {config.design.logoPlacement === 'strip'
                      ? `${((LOGO_PRESETS.strip.width * LOGO_PRESETS.strip.height / QR_AREA) * 100).toFixed(1)}% area × 1.5 penalty`
                      : `${((LOGO_PRESETS.center.width * LOGO_PRESETS.center.height / QR_AREA) * 100).toFixed(1)}% area`
                    }
                  </span></p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs h-12 bg-white border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm font-bold text-slate-600"
                  onClick={() => setIsMediaModalOpen(true)}
                >
                  <Upload className="w-4 h-4 text-primary" />
                  {config.design.customLogoUrl ? "Change Custom Logo" : "Upload Custom Logo"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Label className="text-xs font-bold text-slate-600">QR Pattern</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={config.design.qrColor}
                      onChange={e => handleDesignChange('qrColor', e.target.value)}
                      className="h-10 w-20 p-1 border-slate-200"
                    />
                    <Input
                      value={config.design.qrColor}
                      onChange={e => handleDesignChange('qrColor', e.target.value)}
                      className="h-10 text-sm font-mono uppercase bg-white border-slate-200"
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Label className="text-xs font-bold text-slate-600">Background</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={config.design.bgColor}
                      onChange={e => handleDesignChange('bgColor', e.target.value)}
                      className="h-10 w-20 p-1 border-slate-200"
                    />
                    <Input
                      value={config.design.bgColor}
                      onChange={e => handleDesignChange('bgColor', e.target.value)}
                      className="h-10 text-sm font-mono uppercase bg-white border-slate-200"
                      placeholder="#FFFFFF"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="more" className="space-y-6 pt-4">
              <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Internal Reference Title</Label>
                  <Input
                    value={config.title}
                    onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Meeting Room Link"
                    className="bg-white border-slate-200 h-12 rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-2xl bg-white shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Require Login</Label>
                    <p className="text-[10px] text-slate-400 italic">User must be logged in to access target</p>
                  </div>
                  <Switch
                    checked={config.requireLogin}
                    onCheckedChange={val => setConfig(prev => ({ ...prev, requireLogin: val }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-2xl bg-white shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Corner Dots Layout</Label>
                    <p className="text-[10px] text-slate-400 italic">Modify the three large orientation squares</p>
                  </div>
                  <select
                    className="h-10 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold"
                    value={config.design.eyeShape}
                    onChange={e => handleDesignChange('eyeShape', e.target.value)}
                  >
                    <option value="square">Standard Square</option>
                    <option value="circle">Modern Rounded</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <h3 className="text-center font-bold text-slate-400 text-xs tracking-[0.2em] uppercase mb-1">Live Preview</h3>
        <Card className="border shadow-2xl overflow-hidden bg-slate-50 min-h-[440px] flex flex-col items-center py-10 px-8 relative">
          {/* Frame Implementation */}
          <div className={cn(
            "relative p-5 rounded-[40px] transition-all duration-500 flex flex-col items-center bg-white shadow-sm",
            config.design.frame === 'simple' && "border-[4px] shadow-lg",
            config.design.frame === 'thick' && "border-[12px] shadow-2xl",
            config.design.labelStyle === 'pill-bottom' && "pt-6 pb-2",
            config.design.labelStyle === 'scan-me-bottom' && "pt-6 pb-2"
          )} style={{ borderColor: config.design.frame !== 'none' ? config.design.frameColor : 'transparent' }}>

            {/* The QR Itself - Adding mb-6 to provide space for bottom labels/banners */}
            <div
              className={`bg-white p-2 rounded-2xl shadow-inner relative  
                ${config.design.labelStyle === 'pill-bottom' ? 'mb-[-5]' : ''}
                ${config.design.labelStyle === 'label-bottom' ? 'mb-[-8]' : ''}
                ${config.design.labelStyle === 'scan-me-bottom' ? 'mb-6' : ''}
                `}



            >
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
                    // Use a transparent pixel for excavation to avoid "double layer" look
                    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    x: undefined,
                    y: dims.y,
                    height: dims.height,
                    width: dims.width,
                    excavate: true,
                  };
                })() : undefined}
              />

              {/* REFINED STRIP OVERLAY: 100% visual width with gradient edges for scannability */}
              {config.design.logoPlacement === 'strip' && currentLogoUrl && (() => {
                const dims = getSafeLogoSettings(qrValue, 'strip', logoAspectRatio);
                return (
                  <div
                    className="absolute pointer-events-none flex items-center justify-center p-0.5"
                    style={{
                      top: dims.y,
                      height: dims.height,
                      width: '100%',
                      left: 0,
                      // Gradient: Solid white in center, fades out where the grid anchor modules are
                      background: `linear-gradient(to right, transparent 0%, white 12%, white 88%, transparent 100%)`
                    }}
                  >
                    <img
                      src={currentLogoUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                );
              })()}
            </div>

            {/* PILL BOTTOM LABEL */}
            {config.design.labelStyle === 'pill-bottom' && (() => {
              const labelText = config.design.frameText || 'Scan Here';
              const charCount = labelText.length;
              const autoSize = charCount <= 8 ? 18 : charCount <= 14 ? 15 : charCount <= 20 ? 13 : 12;
              const fontSize = config.design.labelFontSize || autoSize;

              return (
                <div
                  className="mt-3 rounded-full flex items-center shadow-lg mb-2 w-full h-[52px] overflow-hidden p-1.5"
                  style={{ backgroundColor: config.design.labelBgColor || config.design.frameColor }}
                >
                  {/* Icon: Fixed circle on the left, now with padding from parent */}
                  <div className="bg-white rounded-full flex items-center justify-center shrink-0 h-10 w-10 shadow-sm border border-slate-100/50">
                    {config.design.frameIcon === 'monitor' ? (
                      <Monitor className="w-5 h-5" style={{ color: config.design.labelBgColor || config.design.frameColor }} />
                    ) : (
                      <Smartphone className="w-5 h-5" style={{ color: config.design.labelBgColor || config.design.frameColor }} />
                    )}
                  </div>
                  {/* Centered Text Wrapper: Now uses 100% of the remaining blue space */}
                  <div className="flex-1 flex items-center justify-center h-full text-center ms-[-5px]">
                    <span
                      className="text-white font-bold inline-block"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {labelText}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* BOX BOTTOM LABEL */}
            {config.design.labelStyle === 'label-bottom' && (() => {
              const labelText = config.design.frameText || 'SCAN ME';
              const charCount = labelText.length;
              const autoSize = charCount <= 8 ? 13 : charCount <= 14 ? 11 : charCount <= 20 ? 9 : 8;
              const fontSize = config.design.labelFontSize || autoSize;

              return (
                <div
                  className="mt-5 px-6 py-2.5 rounded-xl flex items-center justify-center shadow-md w-full"
                  style={{ backgroundColor: config.design.labelBgColor || config.design.frameColor }}
                >
                  <div className="flex-1 flex items-center justify-center h-full px-4">
                    <span
                      className="text-white font-bold inline-block"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {labelText}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* BANNER LABEL */}
            {config.design.labelStyle === 'scan-me-bottom' && (
              <div
                className="absolute bottom-0 mb-[-20px] px-8 py-3 rounded-2xl flex items-center gap-3 shadow-xl transform rotate-[-1deg]"
                style={{ backgroundColor: config.design.labelBgColor || config.design.frameColor }}
              >
                <span className="text-white font-black italic text-lg tracking-tighter uppercase">
                  {config.design.frameText}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-slate-500 gap-2 text-[10px] tracking-widest uppercase font-bold"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Reset Canvas
            </Button>
          </div>
        </Card>

        {/* Scan Reliability Indicator */}
        {
          (() => {
            const reliability = calculateScanReliability(
              config.design.logoPlacement || 'center',
              config.design.logo !== 'none' && !!currentLogoUrl
            );
            return (
              <div className={cn(
                "rounded-3xl p-5 flex gap-4 border",
                reliability.status === 'safe' && "bg-emerald-50/50 border-emerald-100",
                reliability.status === 'risky' && "bg-amber-50/50 border-amber-100",
                reliability.status === 'broken' && "bg-red-50/50 border-red-100"
              )}>
                <div className="bg-white rounded-2xl p-2 shadow-sm shrink-0 h-fit">
                  <Info className={cn(
                    "w-5 h-5",
                    reliability.status === 'safe' && "text-emerald-500",
                    reliability.status === 'risky' && "text-amber-500",
                    reliability.status === 'broken' && "text-red-500"
                  )} />
                </div>
                <div>
                  <p className={cn("text-[11px] leading-relaxed font-bold", reliability.color)}>
                    {reliability.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {config.customCode
                      ? <><span className="font-bold text-slate-500">Redirect:</span> <span className="font-mono">/hots/redirect/{config.customCode.toLowerCase()}</span></>
                      : <><span className="font-bold text-slate-500">Mode:</span> Direct link</>
                    }
                  </p>
                  {config.design.logo !== 'none' && currentLogoUrl && (
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">
                      Logo: {config.design.logoPlacement === 'strip' ? 'Strip' : 'Center'} • ECC: H (30%)
                    </p>
                  )}
                </div>
              </div>
            );
          })()
        }
      </div >
    </div >
  );
};


export default QRCodeDesignWidget;
