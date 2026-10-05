import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { overlayCard } from "../context/OverlayCardContext";

function createCenterAspectCrop(mediaWidth, mediaHeight, aspect) {
  if (!aspect) {
    return {
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    };
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Rotates an image by 90 degrees clockwise using an off-screen canvas
 */
function rotateImage90(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}

/**
 * Flips an image horizontally using an off-screen canvas
 */
function flipImageHorizontal(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}

const PhotoCropperModal = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  initialAspect = 1,
  lockAspect = false,
  circularCrop = false,
  title = "Crop & Edit Photo",
}) => {
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [aspect, setAspect] = useState(initialAspect);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef(null);

  // Sync internal image source when prop changes
  useEffect(() => {
    if (imageSrc) {
      setCurrentSrc(imageSrc);
    }
  }, [imageSrc]);

  useEffect(() => {
    if (lockAspect) {
      setAspect(initialAspect);
    }
  }, [lockAspect, initialAspect]);

  const onImageLoad = useCallback(
    (e) => {
      const { width, height } = e.currentTarget;
      setCrop(createCenterAspectCrop(width, height, aspect));
    },
    [aspect]
  );

  const handleAspectChange = (newAspect) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(createCenterAspectCrop(width, height, newAspect));
    }
  };

  const handleRotate90 = async () => {
    if (!currentSrc || isProcessing) return;
    try {
      setIsProcessing(true);
      const rotated = await rotateImage90(currentSrc);
      setCurrentSrc(rotated);
    } catch (err) {
      console.error("Failed to rotate image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlipHorizontal = async () => {
    if (!currentSrc || isProcessing) return;
    try {
      setIsProcessing(true);
      const flipped = await flipImageHorizontal(currentSrc);
      setCurrentSrc(flipped);
    } catch (err) {
      console.error("Failed to flip image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(createCenterAspectCrop(width, height, aspect));
    }
  };

  const handleApplyCrop = () => {
    if (!completedCrop || !imgRef.current) {
      overlayCard.info("Please adjust crop area before applying.", { title: "Adjust Crop" });
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Use full pixel coordinates
    const pixelWidth = Math.round(completedCrop.width * scaleX);
    const pixelHeight = Math.round(completedCrop.height * scaleY);

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      overlayCard.error("Canvas 2D context not supported");
      return;
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      pixelWidth,
      pixelHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          overlayCard.error("Failed to create image file");
          return;
        }
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(blob, croppedUrl);
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  if (!isOpen || !currentSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-crop-simple"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-400">Drag corners or center to adjust framing</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Cropping Canvas Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-900/5 min-h-[300px]">
          <div className="max-w-full max-h-[50vh] overflow-hidden rounded-2xl bg-slate-950 shadow-inner flex items-center justify-center relative border border-slate-200/50">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circularCrop}
              className="max-h-[50vh]"
            >
              <img
                ref={imgRef}
                src={currentSrc}
                alt="Source to crop"
                onLoad={onImageLoad}
                className="max-h-[50vh] w-auto max-w-full object-contain block select-none"
              />
            </ReactCrop>

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold gap-2">
                <i className="fa-solid fa-spinner fa-spin text-indigo-400"></i>
                <span>Transforming image...</span>
              </div>
            )}
          </div>
        </div>

        {/* Aspect Ratio Selector & Transformation Toolbar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
          {/* Aspect Ratio Tabs (shown only when not locked) */}
          {!lockAspect && (
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Aspect:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAspectChange(1)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                    aspect === 1
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
                >
                  1:1 Square
                </button>
                <button
                  type="button"
                  onClick={() => handleAspectChange(4 / 5)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                    aspect === 4 / 5
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
                >
                  4:5 Portrait
                </button>
                <button
                  type="button"
                  onClick={() => handleAspectChange(16 / 9)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                    aspect === 16 / 9
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
                >
                  16:9 Wide
                </button>
                <button
                  type="button"
                  onClick={() => handleAspectChange(undefined)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                    aspect === undefined
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
                >
                  Freeform
                </button>
              </div>
            </div>
          )}

          {/* Quick Rotation & Flip Toolbar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate90}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Rotate 90 degrees clockwise"
              >
                <i className="fa-solid fa-rotate-right text-indigo-600"></i>
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleFlipHorizontal}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Flip image horizontally"
              >
                <i className="fa-solid fa-arrows-left-right text-indigo-600"></i>
                <span>Flip</span>
              </button>

              <button
                type="button"
                onClick={handleResetCrop}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Reset Frame
              </button>
            </div>

            {circularCrop && (
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                <i className="fa-regular fa-circle-user mr-1"></i> Avatar Circle
              </span>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <i className="fa-solid fa-check"></i>
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropperModal;
