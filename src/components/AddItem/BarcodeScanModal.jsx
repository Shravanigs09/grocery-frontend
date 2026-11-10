// src/components/AddItem/BarcodeScanModal.jsx
// Instant Barcode / UPC scanner powered by Open Food Facts API & Web Camera BarcodeDetector

import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Camera,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flashlight,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import { addDays, todayKey } from '../../utils/dates';

// Sample common barcodes for desktop / instant testing
const TEST_BARCODES = [
  { label: 'Fresh Milk (EAN)', code: '8901030383709', fallbackName: 'Toned Fresh Milk' },
  { label: 'Basmati Rice (EAN)', code: '8901262010141', fallbackName: 'Royal Basmati Rice' },
  { label: 'Olive Oil (EAN)', code: '8410000001234', fallbackName: 'Extra Virgin Olive Oil' },
  { label: 'Cereal / Oats', code: '5000159461122', fallbackName: 'Rolled Whole Oats' },
];

export default function BarcodeScanModal({ onAdd, onClose }) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [product, setProduct] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  // Initialize camera stream
  const startCamera = async () => {
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices?.getUserMedia(constraints);
      if (stream && videoRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.torch) {
          setHasTorch(true);
        }

        // Start scanning loop if BarcodeDetector is available
        if ('BarcodeDetector' in window) {
          startBarcodeDetection();
        }
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // BarcodeDetector loop
  const startBarcodeDetection = () => {
    try {
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128'],
      });

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanLoopRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              setBarcodeInput(rawVal);
              lookupBarcode(rawVal);
              return; // Stop scanning once detected
            }
          }
        } catch {}

        scanLoopRef.current = requestAnimationFrame(detectFrame);
      };

      scanLoopRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      console.warn('BarcodeDetector error:', err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchOn(nextTorch);
    } catch {}
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Lookup product on Open Food Facts
  const lookupBarcode = async (codeToLookup) => {
    const code = (codeToLookup || barcodeInput || '').trim();
    if (!code) {
      setErrorMsg('Please enter or scan a barcode number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setProduct(null);

    try {
      // Free public Open Food Facts API v2
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const data = await res.json();

      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const name =
          p.product_name_en ||
          p.product_name ||
          p.generic_name_en ||
          p.generic_name ||
          `Product (${code})`;

        const categories = (p.categories || p.categories_tags?.join(', ') || '').toLowerCase();

        // Determine if Produce or Pantry
        const isFresh =
          categories.includes('vegetable') ||
          categories.includes('fruit') ||
          categories.includes('milk') ||
          categories.includes('dairy') ||
          categories.includes('fresh') ||
          categories.includes('salad') ||
          categories.includes('meat') ||
          categories.includes('bread');

        const panelType = isFresh ? 'PRODUCE' : 'PANTRY';
        const shelfLifeDays = isFresh
          ? categories.includes('milk') || categories.includes('dairy')
            ? 7
            : 5
          : 180;

        // Parse quantity / unit
        let qtyVal = 1;
        let unit = 'items';
        if (p.quantity) {
          const match = String(p.quantity).match(/([\d.]+)\s*([a-zA-Z]+)/);
          if (match) {
            qtyVal = parseFloat(match[1]) || 1;
            unit = match[2].toLowerCase();
          }
        }

        // Parse primary category
        let category = 'Pantry';
        if (categories.includes('dairy') || categories.includes('milk') || categories.includes('cheese')) category = 'Dairy';
        else if (categories.includes('fruit')) category = 'Fruit';
        else if (categories.includes('vegetable')) category = 'Vegetables';
        else if (categories.includes('beverage') || categories.includes('drink')) category = 'Beverages';
        else if (categories.includes('bakery') || categories.includes('bread')) category = 'Bakery';
        else if (categories.includes('snack')) category = 'Snacks';

        setProduct({
          code,
          name,
          brand: p.brands || '',
          imageUrl: p.image_front_small_url || p.image_url || null,
          panelType,
          category,
          quantity: { value: qtyVal, unit },
          storageLocation: isFresh ? 'fridge' : 'pantry',
          shelfLifeDays,
          stockLevel: 'FULL',
          pantryState: 'FULL',
          purchaseDate: todayKey(),
          expiryDate: addDays(todayKey(), shelfLifeDays),
          nutriments: p.nutriments || null,
        });
      } else {
        // Fallback for barcode not in database
        setErrorMsg(`Product for barcode "${code}" not found in database. You can still add it manually!`);
        setProduct({
          code,
          name: `Scanned Item (${code})`,
          panelType: 'PANTRY',
          category: 'General',
          quantity: { value: 1, unit: 'items' },
          storageLocation: 'pantry',
          shelfLifeDays: 90,
          stockLevel: 'FULL',
          pantryState: 'FULL',
          purchaseDate: todayKey(),
          expiryDate: addDays(todayKey(), 90),
        });
      }
    } catch (err) {
      setErrorMsg('Failed to query Open Food Facts API. Please check internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfirm = () => {
    if (!product) return;
    onAdd(product);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Barcode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                Instant Barcode Scanner
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Powered by Open Food Facts (UPC / EAN)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder / Camera Section */}
        <div
          style={{
            position: 'relative',
            height: '240px',
            background: '#090d16',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: cameraActive ? 1 : 0.2,
            }}
          />

          {/* Scanner Overlay UI */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Reticle Target */}
            <div
              style={{
                width: '260px',
                height: '140px',
                border: '2px solid #38bdf8',
                borderRadius: '14px',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.3), inset 0 0 15px rgba(56, 189, 248, 0.2)',
                position: 'relative',
              }}
            >
              {/* Animated laser scan line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                  animation: 'scanLineAnim 2s infinite ease-in-out',
                }}
              />
            </div>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              Center the grocery barcode in the frame
            </p>
          </div>

          {/* Top Controls on Camera */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
            }}
          >
            {hasTorch && (
              <button
                onClick={toggleTorch}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: torchOn ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
                title="Toggle Torch"
              >
                <Flashlight size={16} />
              </button>
            )}
            <button
              onClick={toggleCamera}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
              title="Flip Camera"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Barcode input row with search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookupBarcode();
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Or type/paste barcode digits (e.g. 8901030383709)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--color-border, rgba(255, 255, 255, 0.15))',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0 16px',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </button>
          </form>

          {/* Quick Test Barcodes Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Try sample:</span>
            {TEST_BARCODES.map((t) => (
              <button
                key={t.code}
                onClick={() => {
                  setBarcodeInput(t.code);
                  lookupBarcode(t.code);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Result Preview Card */}
          {product && (
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid #0284c7',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      background: 'rgba(14, 165, 233, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                    }}
                  >
                    <PackageCheck size={28} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: product.panelType === 'PRODUCE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: product.panelType === 'PRODUCE' ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {product.panelType}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{product.category}</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </h4>
                  {product.brand && (
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                      Brand: {product.brand} • UPC: {product.code}
                    </p>
                  )}
                </div>
              </div>

              {/* Shelf-Life & Storage tags */}
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>
                  Location: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{product.storageLocation}</strong>
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>
                  Shelf Life: <strong style={{ color: '#fff' }}>{product.shelfLifeDays} days</strong>
                </span>
              </div>

              {/* Confirm Add Button */}
              <button
                onClick={handleAddConfirm}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 size={18} />
                Add to Kitchen Inventory
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLineAnim {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 98%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
