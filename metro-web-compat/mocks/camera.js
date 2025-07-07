/**
 * Web-compatible Camera implementation using WebRTC
 * Compatible with expo-camera and react-native-camera
 */

class Camera {
  static Constants = {
    Type: {
      back: 'back',
      front: 'front'
    },
    FlashMode: {
      on: 'on',
      off: 'off',
      auto: 'auto',
      torch: 'torch'
    },
    AutoFocus: {
      on: 'on',
      off: 'off'
    },
    WhiteBalance: {
      auto: 'auto',
      sunny: 'sunny',
      cloudy: 'cloudy',
      shadow: 'shadow',
      incandescent: 'incandescent',
      fluorescent: 'fluorescent'
    }
  };

  static async requestCameraPermissionsAsync() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return { status: 'granted', granted: true };
    } catch (error) {
      return { status: 'denied', granted: false };
    }
  }

  static async getCameraPermissionsAsync() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return {
        status: result.state === 'granted' ? 'granted' : 'denied',
        granted: result.state === 'granted'
      };
    } catch (error) {
      return { status: 'undetermined', granted: false };
    }
  }

  static async takePictureAsync(options = {}) {
    try {
      const canvas = document.createElement('canvas');
      const video = document.querySelector('video');
      
      if (!video) {
        throw new Error('No video element found. Make sure camera is active.');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', options.quality || 1.0);
      
      return {
        uri: dataUrl,
        width: canvas.width,
        height: canvas.height,
        base64: options.base64 ? dataUrl.split(',')[1] : undefined
      };
    } catch (error) {
      throw new Error(`Failed to take picture: ${error.message}`);
    }
  }

  static async recordAsync(options = {}) {
    console.warn('Video recording not fully supported in web environment');
    return Promise.resolve({
      uri: '',
      status: 'not-supported'
    });
  }

  static async stopRecording() {
    console.warn('Video recording not fully supported in web environment');
    return Promise.resolve();
  }
}

// React component wrapper for web
export const CameraView = ({ style, type, onCameraReady, ...props }) => {
  const [stream, setStream] = React.useState(null);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: type === 'front' ? 'user' : 'environment'
          }
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          if (onCameraReady) {
            onCameraReady();
          }
        }
      } catch (error) {
        console.error('Failed to start camera:', error);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [type]);

  return React.createElement('video', {
    ref: videoRef,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      ...style
    },
    autoPlay: true,
    playsInline: true,
    muted: true,
    ...props
  });
};

export default Camera;