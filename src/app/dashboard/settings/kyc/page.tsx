"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVerifyKycMutation } from "@/redux/auth/auth_api";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastProvider";
import { TokenManager } from "@/utils/token-manager";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Camera,
  RefreshCw,
  Video,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { paths } from "@/utils/paths";

type KycStep = "levels" | "nin" | "face-intro" | "camera" | "success";

export default function KycVerificationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const authUser = useAppSelector((state: any) => state.auth.user);
  const userInfo = authUser?.user || authUser || {};
  const verifyAccountStatus = userInfo?.verify_account ?? 0;

  const [verifyKyc, { isLoading }] = useVerifyKycMutation();

  const [step, setStep] = useState<KycStep>("levels");
  const [ninInput, setNinInput] = useState("");
  const [error, setError] = useState("");

  // Webcam states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setError("");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      showToast("Camera access was denied or is not available.", "error");
    }
  };

  // Turn off camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Countdown auto-trigger effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning && countdown > 0 && !isProcessing) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isScanning && countdown === 0 && !isProcessing) {
      handleCapture();
    }
    return () => clearInterval(interval);
  }, [isScanning, countdown, isProcessing]);

  // Lifecycle control for camera access
  useEffect(() => {
    if (step === "camera") {
      startCamera();
    } else {
      stopCamera();
      setIsScanning(false);
      setCountdown(5);
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [step]);

  const handleVerifyNin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (ninInput.length !== 11) {
      setError("NIN must be exactly 11 digits");
      return;
    }
    setStep("face-intro");
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsProcessing(true);
    try {
      // Capture at video native resolution or fallback to default aspect
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], "kyc_photo.jpg", { type: "image/jpeg" });
            
            // Generate visual preview
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              setCapturedImage(reader.result as string);
            };

            await submitKyc(file);
          } else {
            showToast("Failed to process photo frame", "error");
            setIsScanning(false);
            setCountdown(5);
            setIsProcessing(false);
          }
        },
        "image/jpeg",
        0.8
      );
    } catch (err) {
      console.error("Frame capture error:", err);
      showToast("Photo capture failed.", "error");
      setIsScanning(false);
      setCountdown(5);
      setIsProcessing(false);
    }
  };

  const handleSimulation = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("https://picsum.photos/400/400");
      const blob = await response.blob();
      const file = new File([blob], "kyc_photo.jpg", { type: "image/jpeg" });

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };

      await submitKyc(file);
    } catch (err) {
      showToast("Verification simulation failed.", "error");
      setIsProcessing(false);
    }
  };

  const submitKyc = async (photoFile: File) => {
    try {
      const token = TokenManager.getToken() || "";
      const formData = new FormData();
      formData.append("nin", ninInput);
      formData.append("token", token);
      formData.append("username", userInfo?.username || "");
      formData.append("photo", photoFile);

      const response = await verifyKyc(formData).unwrap();

      if (response?.status === "success" || response?.status === true || response?.success === true) {
        showToast("KYC Verification Submitted Successfully!", "success");
        setStep("success");
      } else {
        showToast(response?.message || "Verification failed. Please try again.", "error");
        setIsScanning(false);
        setCountdown(5);
        setCapturedImage(null);
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Something went wrong";
      showToast(errMsg, "error");
      setIsScanning(false);
      setCountdown(5);
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const kycLevels = [
    {
      level: 1,
      title: "Level 1 (Email & Phone)",
      description: "Daily trading limit: ₦5,000,000. Active upon registration.",
      status: "active",
    },
    {
      level: 2,
      title: "Level 2 (National Identity & Face)",
      description: "Daily trading limit: ₦10,000,000. Requires NIN & Face verification.",
      status: verifyAccountStatus === 1 ? "active" : "pending",
      action: () => setStep("nin"),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-10">
      {/* Header with Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "levels") {
              router.back();
            } else if (step === "nin") {
              setStep("levels");
            } else if (step === "face-intro") {
              setStep("nin");
            } else if (step === "camera") {
              setStep("face-intro");
            } else if (step === "success") {
              setStep("levels");
            }
          }}
          className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          {step === "levels" && "KYC Verification Levels"}
          {step === "nin" && "NIN Registration"}
          {step === "face-intro" && "Facial Verification"}
          {step === "camera" && "Liveness Camera Check"}
          {step === "success" && "Verification Status"}
        </h3>
      </div>

      {/* STEP 1: LEVELS VIEW */}
      {step === "levels" && (
        <div className="flex flex-col gap-6">
          {/* Status Panel */}
          <div className="relative overflow-hidden rounded-[30px] p-6 text-white bg-linear-to-br from-primary-500 to-primary-800 shadow-lg flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-h5 font-primary-bold">Account Status</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-primary-bold select-none ${
                      verifyAccountStatus === 1
                        ? "bg-white text-primary-500"
                        : "bg-white/20 text-white border border-white/10"
                    }`}
                  >
                    {verifyAccountStatus === 1 ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="mt-4 flex flex-col">
                  <span className="text-white/70 text-b3 font-primary-regular">Daily Withdrawal Limit</span>
                  <span className="text-h4 font-primary-bold leading-tight">
                    {verifyAccountStatus === 1 ? "₦10,000,000" : "₦5,000,000"}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-center p-3 bg-white/10 rounded-2xl border border-white/10">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="border-t border-dashed border-white/20 w-full my-1" />

            <div className="flex flex-col gap-2.5 text-b2">
              <div className="flex justify-between items-center">
                <span className="font-primary-medium text-white/80">Sell Gift Card</span>
                <span className="font-primary-bold uppercase">Unlimited</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-primary-medium text-white/80">Sell Crypto</span>
                <span className="font-primary-bold uppercase">Unlimited</span>
              </div>
            </div>
          </div>

          {/* Level List */}
          <div className="flex flex-col gap-4">
            {kycLevels.map((lvl) => (
              <div
                key={lvl.level}
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-5 rounded-[24px] flex items-center justify-between"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-light-100 dark:bg-dark-700 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark shrink-0">
                    {lvl.level === 1 ? <UserCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                      {lvl.title}
                    </h5>
                    <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                      {lvl.description}
                    </p>
                  </div>
                </div>

                {lvl.status === "active" ? (
                  <span className="text-[10px] uppercase font-primary-bold px-2.5 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={lvl.action}
                    className="p-2 rounded-xl text-primary-500 hover:bg-primary-500/10 transition-colors flex items-center cursor-pointer select-none"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Call to action */}
          {verifyAccountStatus === 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => setStep("nin")} fullWidth className="py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600">
                <Sparkles className="w-4 h-4 text-white" />
                <span>Become a Verified Trader</span>
              </Button>
              <p className="text-center text-b3 font-primary-medium text-text-disabled-light dark:text-text-disabled-dark">
                Become a verified user for better withdrawal benefits.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: NIN SUBMISSION FORM */}
      {step === "nin" && (
        <form onSubmit={handleVerifyNin} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Verify your NIN
            </h4>
            <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Submit your correct 11-digit National Identity Number (NIN) to upgrade your account to Level 2.
            </p>
          </div>

          <Input
            label="NIN (National Identity Number)"
            placeholder="Please enter 11-digit NIN"
            maxLength={11}
            type="text"
            inputMode="numeric"
            value={ninInput}
            onChange={(e) => setNinInput(e.target.value.replace(/[^0-9]/g, ""))}
            error={error}
          />

          <div className="flex gap-4 mt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setStep("levels")}>
              Back
            </Button>
            <Button type="submit" fullWidth>
              Verify
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: FACE VERIFICATION INTRO */}
      {step === "face-intro" && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Face Verification
            </h4>
            <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              We need to take a scan of your face to verify you're a real person and secure your identity.
            </p>
          </div>

          {/* Central Logo/Illustration */}
          <div className="flex justify-center py-6">
            <div className="w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center text-primary-500 border border-primary-500/10">
              <Camera className="w-16 h-16 animate-pulse" />
            </div>
          </div>

          {/* Instructions panel */}
          <div className="bg-light-75 dark:bg-dark-800/40 border border-border-light dark:border-border-dark/20 p-5 rounded-[20px] flex flex-col gap-4">
            <span className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Instructions to follow
            </span>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-3 text-b2 leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary-500 text-white font-primary-bold text-xs flex items-center justify-center mt-0.5 select-none">!</span>
                <span>Stay where your face is bright and not dark.</span>
              </div>
              <div className="flex items-start gap-3 text-b2 leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary-500 text-white font-primary-bold text-xs flex items-center justify-center mt-0.5 select-none">!</span>
                <span>Put the camera at the same level as your face.</span>
              </div>
              <div className="flex items-start gap-3 text-b2 leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary-500 text-white font-primary-bold text-xs flex items-center justify-center mt-0.5 select-none">!</span>
                <span>Position your face inside the ellipse overlay frame.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => setStep("camera")} fullWidth className="py-3 rounded-2xl bg-primary-500">
              Get Started
            </Button>
            <Button variant="secondary" onClick={() => setStep("nin")} fullWidth>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: ACTIVE WEBCAM CAPTURE & OVERLAY SCANNER */}
      {step === "camera" && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6 items-center">
          <div className="w-full text-center flex flex-col gap-1">
            <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              Position your face in the frame
            </h4>
            <p className="text-b2 text-text-secondary-light dark:text-text-secondary-dark">
              Keep holding until the camera takes a photo.
            </p>
          </div>

          {/* Camera Viewport Container */}
          <div className="relative overflow-hidden w-full aspect-[3/4] max-w-sm rounded-[30px] bg-black border border-border-light dark:border-border-dark shadow-inner">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Selfie"
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Canvas (Hidden) for snapping frames */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Oval Frame Mask Overlay (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <mask id="webcam-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <ellipse cx="50" cy="45" rx="35" ry="25" fill="black" />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="rgba(0,0,0,0.68)"
                mask="url(#webcam-mask)"
              />
              <ellipse
                cx="50"
                cy="45"
                rx="35"
                ry="25"
                stroke="white"
                strokeWidth="0.6"
                strokeDasharray="1.5,1.5"
                fill="none"
              />
            </svg>

            {/* Checking/Denials State Overlay */}
            {hasPermission === false && (
              <div className="absolute inset-0 bg-black/90 z-20 flex flex-col justify-center items-center p-6 text-center gap-3">
                <AlertCircle className="w-12 h-12 text-danger-500 animate-bounce" />
                <span className="text-b2 font-primary-bold text-white">Camera Access Denied</span>
                <p className="text-b3 text-white/80 leading-relaxed">
                  Please enable camera permissions in your browser settings to perform facial liveness verification.
                </p>
                <Button onClick={startCamera} className="mt-2 text-b3 px-5 py-2 h-10 min-h-[40px] rounded-xl">
                  Try Granting Access
                </Button>
              </div>
            )}

            {hasPermission === null && (
              <div className="absolute inset-0 bg-black/95 z-20 flex flex-col justify-center items-center p-6 text-center gap-3">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
                <span className="text-b2 font-primary-medium text-white/95">Checking permissions...</span>
              </div>
            )}
          </div>

          {/* Action & Status Panels */}
          <div className="w-full flex flex-col gap-4 items-center">
            {isScanning && (
              <div className="bg-black/60 dark:bg-black/80 px-5 py-2.5 rounded-full flex items-center gap-2 select-none shadow-md">
                <div className="w-4 h-4 rounded-full bg-primary-500 text-white font-primary-bold text-[9px] flex items-center justify-center">i</div>
                <span className="text-white text-b3 font-primary-medium">
                  {countdown > 0 ? `Please hold still for ${countdown}s` : "Uploading selfie verification..."}
                </span>
              </div>
            )}

            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Verifying identity payload...
                </span>
              </div>
            ) : (
              !isScanning && hasPermission === true && (
                <div className="w-full flex flex-col gap-3">
                  <Button
                    onClick={() => setIsScanning(true)}
                    fullWidth
                    className="py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-primary-bold text-lg"
                  >
                    Start Selfie Scan
                  </Button>

                  {/* Dev Mode Simulation */}
                  <Button
                    variant="secondary"
                    onClick={handleSimulation}
                    fullWidth
                    className="py-2.5 rounded-2xl border border-primary-500/20 text-primary-500 font-primary-bold text-b2 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span>Simulate Scan (Dev mode)</span>
                  </Button>
                </div>
              )
            )}

            <span className="text-center text-[11px] font-primary-medium text-text-disabled-light dark:text-text-disabled-dark max-w-xs mt-2 select-none leading-relaxed">
              We prioritize the encryption and security of your biometrics.
            </span>
          </div>
        </div>
      )}

      {/* STEP 5: VERIFICATION SUCCESS */}
      {step === "success" && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-[24px] flex flex-col gap-6 items-center text-center">
          <div className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-950/40 flex items-center justify-center text-success-500 border border-success-500/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-h5 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
              KYC Verification Submitted
            </h4>
            <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark leading-relaxed max-w-sm">
              Your National Identity Number (NIN) and facial check are under review. Level 2 limit updates will apply shortly!
            </p>
          </div>

          <div className="border border-dashed border-border-light dark:border-border-dark/60 w-full rounded-2xl p-4 flex flex-col gap-2 bg-light-75 dark:bg-dark-800/20 text-b2 text-left">
            <div className="flex justify-between items-center text-text-secondary-light dark:text-text-secondary-dark">
              <span>Verification Level</span>
              <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">Level 2</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary-light dark:text-text-secondary-dark">
              <span>Daily Limit</span>
              <span className="font-primary-bold text-text-primary-light dark:text-text-primary-dark">₦10,000,000</span>
            </div>
          </div>

          <Button onClick={() => setStep("levels")} fullWidth className="py-3.5 rounded-2xl bg-primary-500 mt-2">
            Back to Levels
          </Button>
        </div>
      )}
    </div>
  );
}
