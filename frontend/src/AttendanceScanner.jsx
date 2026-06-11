import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { API_URL } from './config';

export default function AttendanceScanner() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [coords, setCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [bypassGPS, setBypassGPS] = useState(false);

  const [scanning, setScanning] = useState(true);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, data: any }
  
  const qrRef = useRef(null);
  const scannerInstance = useRef(null);

  // 1. Fetch Location Coordinates on mount
  const requestGPSLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError(isAr ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        console.warn('GPS Error:', error);
        let errorMsg = isAr ? 'فشل الحصول على موقعك. يرجى تفعيل الـ GPS.' : 'Failed to obtain GPS coordinates. Please enable location services.';
        if (error.code === 1) {
          errorMsg = isAr ? 'تم رفض إذن تحديد الموقع. يمكنك استخدام خيار التجاوز للتجربة.' : 'Permission denied. You can use the bypass option for testing.';
        }
        setGpsError(errorMsg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestGPSLocation();
  }, []);

  // 2. Start QR Code Scanner
  useEffect(() => {
    if (showManualInput || scanResult) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      try {
        if (!qrRef.current) return;
        
        // Ensure old scanner is stopped
        if (scannerInstance.current && scannerInstance.current.isScanning) {
          await scannerInstance.current.stop();
        }

        const html5Qrcode = new Html5Qrcode('qr-reader-target');
        scannerInstance.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width, height) => {
              const minDim = Math.min(width, height);
              const qrboxSize = Math.floor(minDim * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            }
          },
          (decodedText) => {
            // QR code successfully read
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Quiet logs to avoid spam
          }
        );
        setScannerStarted(true);
        setScanning(true);
      } catch (err) {
        console.warn('Scanner start failed:', err);
        setScannerStarted(false);
        setScanning(false);
        // Fall back to manual input if scanner fails (e.g. no camera or blocked)
        setShowManualInput(true);
      }
    };

    // Delay start slightly to let DOM render
    const timeout = setTimeout(() => {
      startScanner();
    }, 400);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [showManualInput, scanResult]);

  const stopScanner = () => {
    if (scannerInstance.current && scannerInstance.current.isScanning) {
      scannerInstance.current.stop()
        .then(() => {
          setScannerStarted(false);
          setScanning(false);
        })
        .catch(err => console.warn('Failed to stop scanner:', err));
    }
  };

  // 3. Submit Scan token to server
  const handleScanSuccess = async (scannedToken) => {
    if (submitting || scanResult) return;
    setSubmitting(true);
    stopScanner();

    // Prepare coordinates (use default if bypassGPS)
    const payload = {
      token: scannedToken,
      bypassGPS,
      latitude: bypassGPS ? 15.35 : coords?.latitude,
      longitude: bypassGPS ? 44.20 : coords?.longitude
    };

    try {
      const jwtToken = localStorage.getItem('manar_token');
      const headers = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

      const res = await axios.post(`${API_URL}/api/attendance/scan`, payload, { headers });
      if (res.data?.success) {
        setScanResult({
          success: true,
          message: res.data.message,
          data: res.data.data
        });
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || (isAr ? 'فشل تسجيل الحضور' : 'Failed to register attendance');
      setScanResult({
        success: false,
        message: errMsg
      });
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleScanSuccess(manualToken.trim());
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualToken('');
    setShowManualInput(false);
    requestGPSLocation();
  };

  return (
    <div className="p-4 space-y-6 flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-[var(--accent-glow)] opacity-[0.03] rounded-full blur-[100px]" />

      <div className="w-full max-w-sm space-y-5 text-center">
        
        {/* Banner Greeting */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-dim)] px-2.5 py-1 rounded-md">
            📷 {isAr ? 'مسح رمز الحضور' : 'QR ATTENDANCE CHECK-IN'}
          </span>
          <h2 className="text-lg font-black text-white mt-3">
            {isAr ? 'تسجيل الحضور عبر الـ QR' : 'Register Attendance via QR'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAr ? 'يجب أن تكون متواجدًا داخل مبنى الكلية لتسجيل حضورك' : 'You must be inside the college campus to check-in'}
          </p>
        </div>

        {/* GPS location status card */}
        <div className="frosted-panel p-4 rounded-2xl border-white/5 text-xs text-left flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              📍 {isAr ? 'الموقع الجغرافي (GPS):' : 'GPS Location Status:'}
            </span>
            {gpsLoading ? (
              <span className="text-[10px] text-amber-400 font-bold animate-pulse">{isAr ? 'جاري التحديد...' : 'Locating...'}</span>
            ) : coords ? (
              <span className="text-[10px] text-emerald-400 font-bold">● {isAr ? 'محدّد بنجاح' : 'Locked'}</span>
            ) : (
              <span className="text-[10px] text-red-400 font-bold">● {isAr ? 'غير متوفر' : 'Unavailable'}</span>
            )}
          </div>

          {coords && (
            <p className="text-[10px] text-[var(--text-secondary)] font-semibold font-mono">
              Lat: {coords.latitude.toFixed(5)}, Lon: {coords.longitude.toFixed(5)}
            </p>
          )}

          {gpsError && !bypassGPS && (
            <p className="text-[10px] text-red-400 font-bold bg-red-500/5 p-2 rounded-lg border border-red-500/10">
              ⚠️ {gpsError}
            </p>
          )}

          {/* Test Bypass checkbox */}
          <label className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={bypassGPS}
              onChange={(e) => setBypassGPS(e.target.checked)}
              className="accent-[var(--accent)] h-3.5 w-3.5 rounded border-white/10 bg-black"
            />
            <span className="text-[10px] text-[var(--accent)] font-black uppercase tracking-wider">
              {isAr ? 'تجاوز فحص الـ GPS (للتجربة والعرض)' : 'Bypass GPS checking (for demo)'}
            </span>
          </label>
        </div>

        {/* Action Panel: Scanner, Submitting, Success, or Error */}
        <div className="frosted-panel rounded-3xl p-5 border-white/8 relative overflow-hidden min-h-[300px] flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {submitting && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <span className="h-9 w-9 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">
                  {isAr ? 'جاري التحقق وتسجيل الحضور...' : 'Verifying attendance status...'}
                </p>
              </motion.div>
            )}

            {!submitting && scanResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-6 space-y-4"
              >
                <span className={`text-5xl p-4 rounded-full ${scanResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {scanResult.success ? '🎉' : '❌'}
                </span>
                <div>
                  <h3 className={`font-black text-base ${scanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scanResult.success ? (isAr ? 'تم تسجيل حضورك!' : 'Checked In!') : (isAr ? 'فشل تسجيل الحضور' : 'Check-in Failed')}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 font-bold px-3">
                    {scanResult.message}
                  </p>
                </div>

                {scanResult.success && scanResult.data && (
                  <div className="bg-white/3 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-secondary)] space-y-1">
                    <p>{isAr ? 'الحالة:' : 'Status:'} <span className="text-white font-extrabold uppercase">{scanResult.data.status}</span></p>
                    <p>{isAr ? 'الوقت:' : 'Time:'} <span className="text-white font-mono">{new Date(scanResult.data.scannedAt).toLocaleTimeString()}</span></p>
                  </div>
                )}

                <div className="flex gap-2 w-full pt-4">
                  <button
                    onClick={() => navigate('/student/home')}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-white rounded-xl transition-all"
                  >
                    {isAr ? 'الرئيسية' : 'Home'}
                  </button>
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-xs font-black text-black rounded-xl transition-all"
                  >
                    {isAr ? 'إعادة المحاولة' : 'Try Again'}
                  </button>
                </div>
              </motion.div>
            )}

            {!submitting && !scanResult && (
              <motion.div key="scanner" className="space-y-4">
                
                {/* Camera Scanner View */}
                {!showManualInput && (
                  <div className="relative">
                    <div
                      id="qr-reader-target"
                      className="overflow-hidden rounded-2xl bg-black border border-white/5 shadow-inner"
                      style={{ width: '100%', aspectRatio: '1 / 1', maxWidth: '280px', margin: '0 auto' }}
                    />
                    
                    {/* Visual target lines */}
                    {scannerStarted && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[60%] h-[60%] border-2 border-dashed border-[var(--accent)] opacity-60 rounded-xl animate-pulse" />
                      </div>
                    )}

                    {!scannerStarted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] rounded-2xl">
                        {isAr ? 'جاري تهيئة الكاميرا...' : 'Starting camera...'}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Text Token input fallback */}
                {showManualInput && (
                  <form onSubmit={handleManualSubmit} className="space-y-3 py-6">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                        {isAr ? 'أدخل رمز الحضور يدوياً' : 'Paste Attendance Token'}
                      </label>
                      <textarea
                        required
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder={isAr ? 'أدخل الرمز المشفر هنا...' : 'Paste encoded token here...'}
                        className="cmd-input w-full p-3 text-xs resize-none font-mono"
                        style={{ height: '110px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-black text-xs font-black rounded-xl uppercase tracking-wider transition-all"
                    >
                      🚀 {isAr ? 'تسجيل الحضور يدوياً' : 'Submit Check-in'}
                    </button>
                  </form>
                )}

                {/* Switch view buttons */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] hover:underline"
                  >
                    {showManualInput ? (isAr ? '🎦 استخدام الكاميرا' : '🎦 Use Camera') : (isAr ? '⌨️ إدخال يدوي للرمز' : '⌨️ Paste Code Manually')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/student/home')}
                    className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] hover:text-white"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
