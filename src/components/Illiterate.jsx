import React, { useState, useRef, useEffect } from 'react';

const ReadForMeApp = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Text-to-Speech function
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'kn-IN'; // Kannada language
      utterance.rate = 0.8;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech not supported in this browser');
    }
  };

  // Voice Recognition
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'kn-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        speakText('ಕೇಳುತ್ತಿದ್ದೇನೆ'); // "Listening" in Kannada
      };

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };

      recognition.onerror = () => {
        setIsListening(false);
        speakText('ದೋಷ ಸಂಭವಿಸಿದೆ'); // "Error occurred" in Kannada
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Voice recognition not supported in this browser');
    }
  };

  // Handle voice commands
  const handleVoiceCommand = (command) => {
    if (command.includes('ಫೋಟೋ') || command.includes('photo') || command.includes('capture')) {
      captureImage();
    } else if (command.includes('ಓದು') || command.includes('read') || command.includes('speak')) {
      if (extractedText) {
        speakText(extractedText);
      }
    } else if (command.includes('ನಿಲ್ಲಿಸು') || command.includes('stop')) {
      window.speechSynthesis.cancel();
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      
      // Try different camera constraints
      let stream;
      try {
        // First try with back camera (mobile)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: 640, height: 480 }
        });
      } catch (err) {
        console.log('Back camera failed, trying any camera...');
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }
        });
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera loaded successfully');
          setCameraActive(true);
          speakText('ಕ್ಯಾಮೆರಾ ಸಿದ್ಧವಾಗಿದೆ'); // "Camera ready" in Kannada
        };
        
        // Handle video errors
        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
          alert('Video display error. Try refreshing the page.');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // More specific error messages
      let errorMessage = 'Camera access failed: ';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Make sure your device has a camera.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      speakText('ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ'); // "Cannot access camera"
    }
  };

  // Capture image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      
      setCapturedImage(imageData);
      speakText('ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ'); // "Photo captured" in Kannada
      
      // Here you would typically send the image to OCR service
      // For demo, we'll simulate text extraction
      setTimeout(() => {
        const demoText = 'ಇದು ಪರೀಕ್ಷಾ ಪಠ್ಯ. This is sample text for demonstration.';
        setExtractedText(demoText);
        speakText('ಪಠ್ಯ ಕಂಡುಹಿಡಿಯಲಾಗಿದೆ'); // "Text found"
      }, 2000);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Welcome message on load
  useEffect(() => {
    speakText('ನಮಸ್ಕಾರ. ರೀಡ್ ಫಾರ್ ಮೀ ಅಪ್ಲಿಕೇಶನ್ ಗೆ ಸ್ವಾಗತ'); // Welcome message in Kannada
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>📖 Read for Me</h1>
        <p style={styles.subtitle}>ನನಗಾಗಿ ಓದು (Read for Me in Kannada)</p>
      </header>

      <main style={styles.main}>
        {/* Debug Info */}
        {/* <div style={styles.debugSection}>
          <h3 style={styles.sectionTitle}>📋 System Check</h3>
          <div style={styles.debugInfo}>
            <p>🌐 Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : navigator.userAgent.includes('Firefox') ? 'Firefox ⚠️' : 'Other'}</p>
            <p>📱 HTTPS: {window.location.protocol === 'https:' ? 'Yes ✅' : 'No ⚠️ (May cause issues)'}</p>
            <p>🎥 Camera API: {navigator.mediaDevices ? 'Available ✅' : 'Not Available ❌'}</p>
            <p>🎤 Microphone API: {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? 'Available ✅' : 'Not Available ❌'}</p>
          </div>
          <button 
            style={styles.debugButton}
            onClick={() => {
              console.log('Browser:', navigator.userAgent);
              console.log('Location:', window.location);
              console.log('MediaDevices:', navigator.mediaDevices);
              navigator.mediaDevices?.enumerateDevices().then(devices => {
                console.log('Available devices:', devices);
                const cameras = devices.filter(device => device.kind === 'videoinput');
                console.log('Cameras found:', cameras.length);
                alert(`Found ${cameras.length} camera(s). Check browser console for details.`);
              }).catch(err => {
                console.error('Device enumeration failed:', err);
                alert('Cannot check cameras. See console for details.');
              });
            }}
          >
            🔍 Check Camera Devices
          </button>
        </div> */}

        {/* Camera Section */}
        <div style={styles.cameraSection}>
          {/* Video element - always present but hidden when not active */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{
              ...styles.video,
              display: cameraActive ? 'block' : 'none'
            }}
          />
          
          {!cameraActive ? (
            <div>
              <button 
                style={styles.primaryButton}
                onClick={startCamera}
                onMouseEnter={() => speakText('ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ')}
              >
                📷 Start Camera<br/>
                <span style={styles.kannadaText}>ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ</span>
              </button>
              
              {/* Simple Test Button */}
              {/* <button 
                style={{...styles.secondaryButton, marginTop: '10px'}}
                onClick={async () => {
                  try {
                    console.log('Testing camera access...');
                    alert('Testing camera - check console for details');
                    
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    console.log('All devices:', devices);
                    
                    const cameras = devices.filter(d => d.kind === 'videoinput');
                    console.log('Cameras found:', cameras);
                    
                    if (cameras.length === 0) {
                      alert('❌ No cameras found!');
                      return;
                    }
                    
                    const stream = await navigator.mediaDevices.getUserMedia({video: true});
                    console.log('✅ Camera access successful!', stream);
                    
                    // Test if video element works
                    if (videoRef.current) {
                      console.log('✅ Video element found!');
                      videoRef.current.srcObject = stream;
                      videoRef.current.style.display = 'block';
                      videoRef.current.style.width = '100%';
                      videoRef.current.style.maxWidth = '500px';
                      videoRef.current.style.height = 'auto';
                      videoRef.current.style.border = '3px solid red';
                      videoRef.current.style.borderRadius = '10px';
                      videoRef.current.style.backgroundColor = 'black';
                      
                      // Force video to play
                      videoRef.current.play().then(() => {
                        console.log('✅ Video is playing!');
                        alert('✅ Camera feed should be visible with RED BORDER!');
                      }).catch(err => {
                        console.error('❌ Video play failed:', err);
                        alert('❌ Video play failed: ' + err.message);
                      });
                    } else {
                      console.error('❌ Video element is null');
                      alert('❌ Video element not found!');
                    }
                    
                  } catch (error) {
                    console.error('❌ Camera test failed:', error);
                    alert('❌ Camera test failed: ' + error.message);
                  }
                }}
              >
                🧪 Test Camera (Debug)
              </button> */}
            </div>
          ) : (
            <div style={styles.cameraContainer}>
              <div style={styles.cameraControls}>
                <button 
                  style={styles.captureButton}
                  onClick={captureImage}
                  onMouseEnter={() => speakText('ಫೋಟೋ ತೆಗೆಯಿರಿ')}
                >
                  📸 Capture<br/>
                  <span style={styles.kannadaText}>ಫೋಟೋ ತೆಗೆಯಿರಿ</span>
                </button>
                <button 
                  style={styles.secondaryButton}
                  onClick={stopCamera}
                >
                  ⏹️ Stop Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Captured Image */}
        {capturedImage && (
          <div style={styles.imageSection}>
            <h3 style={styles.sectionTitle}>Captured Image / ತೆಗೆದ ಚಿತ್ರ</h3>
            <img src={capturedImage} alt="Captured" style={styles.capturedImage} />
          </div>
        )}

        {/* Extracted Text */}
        {extractedText && (
          <div style={styles.textSection}>
            <h3 style={styles.sectionTitle}>Extracted Text / ಹೊರತೆಗೆದ ಪಠ್ಯ</h3>
            <div style={styles.textBox}>
              {extractedText}
            </div>
            <button 
              style={{...styles.primaryButton, ...styles.speakButton}}
              onClick={() => speakText(extractedText)}
              disabled={isSpeaking}
            >
              {isSpeaking ? '🔊 Speaking...' : '🔊 Read Aloud'}
              <br/>
              <span style={styles.kannadaText}>
                {isSpeaking ? 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ' : 'ಜೋರಾಗಿ ಓದಿ'}
              </span>
            </button>
          </div>
        )}

        {/* Voice Control */}
        <div style={styles.voiceSection}>
          <button 
            style={{
              ...styles.primaryButton,
              ...(isListening ? styles.listeningButton : {})
            }}
            onClick={startListening}
            disabled={isListening}
          >
            {isListening ? '🎤 Listening...' : '🎤 Voice Command'}
            <br/>
            <span style={styles.kannadaText}>
              {isListening ? 'ಕೇಳುತ್ತಿದ್ದೇನೆ' : 'ಧ್ವನಿ ಆದೇಶ'}
            </span>
          </button>
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.sectionTitle}>Voice Commands / ಧ್ವನಿ ಆದೇಶಗಳು</h3>
          <ul style={styles.commandList}>
            <li>"ಫೋಟೋ" or "Photo" - Take a picture</li>
            <li>"ಓದು" or "Read" - Read the text aloud</li>
            <li>"ನಿಲ್ಲಿಸು" or "Stop" - Stop speaking</li>
          </ul>
        </div>
      </main>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '3px solid #2196F3',
    paddingBottom: '20px'
  },
  title: {
    fontSize: '2.5rem',
    color: '#1565C0',
    margin: '0',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#424242',
    margin: '10px 0 0 0'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  cameraSection: {
    textAlign: 'center'
  },
  cameraContainer: {
    border: '3px solid #2196F3',
    borderRadius: '10px',
    padding: '15px',
    backgroundColor: '#f5f5f5'
  },
  video: {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    borderRadius: '8px',
    border: '2px solid #ccc'
  },
  cameraControls: {
    marginTop: '15px',
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '20px 30px',
    fontSize: '1.2rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    minWidth: '150px',
    minHeight: '80px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  },
  secondaryButton: {
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    padding: '15px 25px',
    fontSize: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '20px 30px',
    fontSize: '1.2rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    minWidth: '150px',
    minHeight: '80px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  },
  listeningButton: {
    backgroundColor: '#FF5722',
    animation: 'pulse 1s infinite'
  },
  speakButton: {
    backgroundColor: '#FF9800',
    marginTop: '15px'
  },
  kannadaText: {
    fontSize: '0.9rem',
    display: 'block',
    marginTop: '5px'
  },
  imageSection: {
    textAlign: 'center',
    border: '2px solid #4CAF50',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  capturedImage: {
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '300px',
    borderRadius: '8px',
    border: '2px solid #ddd'
  },
  textSection: {
    border: '2px solid #FF9800',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  textBox: {
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    minHeight: '100px',
    marginBottom: '15px'
  },
  voiceSection: {
    textAlign: 'center',
    border: '2px solid #9C27B0',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  instructions: {
    border: '2px solid #607D8B',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: '1.4rem',
    color: '#1565C0',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  commandList: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#424242'
  },
  debugSection: {
    border: '2px solid #795548',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fff3e0'
  },
  debugInfo: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '15px',
    fontFamily: 'monospace'
  },
  debugButton: {
    backgroundColor: '#795548',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default ReadForMeApp;