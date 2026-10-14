export class CameraCapture {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private isCapturing = false;
  private captureInterval: number | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      
      // Request camera access with optimal settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();
      
      console.log("Camera started successfully");
    } catch (error) {
      console.error("Failed to start camera:", error);
      throw new Error("Could not access camera. Please check permissions.");
    }
  }

  stopCamera(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.isCapturing = false;
    console.log("Camera stopped");
  }

  captureFrame(): string | null {
    if (!this.videoElement || this.videoElement.readyState !== this.videoElement.HAVE_ENOUGH_DATA) {
      return null;
    }

    // Set canvas size to match video
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;

    // Draw current video frame to canvas
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

    // Convert to base64 JPEG (smaller than PNG)
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  startContinuousCapture(
    onFrame: (frameData: string) => void,
    intervalMs: number = 1000
  ): void {
    if (this.isCapturing) {
      console.warn("Already capturing");
      return;
    }

    this.isCapturing = true;
    
    this.captureInterval = window.setInterval(() => {
      const frame = this.captureFrame();
      if (frame) {
        onFrame(frame);
      }
    }, intervalMs);

    console.log(`Started continuous capture at ${1000/intervalMs} FPS`);
  }

  stopContinuousCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log("Stopped continuous capture");
  }

  isActive(): boolean {
    return this.isCapturing && this.stream !== null;
  }
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};