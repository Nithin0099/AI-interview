import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { useFaceDetection } from '../hooks/useFaceDetection'
import { createProctoringEvent, flushProctoringEvents, queueProctoringEvent } from '../services/proctoring'

const VideoRecordingScreen = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [mediaURL, setMediaURL] = useState('')
  const [loading, setLoading] = useState(false)

  const mediaRecorderRef = useRef(null)
  const mediaChunksRef = useRef([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const lastFaceDetectedRef = useRef(null)
  const lastDetectorStatusRef = useRef('')

  const {
    isReady,
    isLoading,
    detectorType,
    faceDetected,
    faceSnapshot,
    statusMessage,
    lastUpdateAt,
    startDetection,
    stopDetection,
    clearSnapshot,
    getLastBox,
  } = useFaceDetection({
    captureSnapshotOnDetect: true,
    intervalMs: 500,
  })

  useEffect(() => {
    queueProctoringEvent(id, createProctoringEvent('recording_screen_opened', {
      source: 'video-recording',
    }))

    return () => {
      queueProctoringEvent(id, createProctoringEvent('recording_screen_closed', {
        source: 'video-recording',
      }))
      flushProctoringEvents(id).catch((error) => {
        console.error('Failed to flush proctoring events on recording screen cleanup:', error)
      })
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      stopDetection()
    }
  }, [stopDetection])

  useEffect(() => {
    return () => {
      if (mediaURL) {
        URL.revokeObjectURL(mediaURL)
      }
    }
  }, [mediaURL])

  const drawDetectionOverlay = useCallback(() => {
    const videoElement = videoRef.current
    const canvas = canvasRef.current
    const box = getLastBox()

    if (!videoElement || !canvas || !videoElement.videoWidth) {
      return
    }

    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    if (!box) {
      return
    }

    context.strokeStyle = '#22c55e'
    context.lineWidth = 3
    context.strokeRect(box.x, box.y, box.width, box.height)

    context.fillStyle = '#22c55e'
    context.font = 'bold 18px sans-serif'
    context.fillText('Face detected', box.x, Math.max(24, box.y - 8))
  }, [getLastBox])

  useEffect(() => {
    drawDetectionOverlay()
  }, [drawDetectionOverlay, lastUpdateAt])

  useEffect(() => {
    const nextStatus = isLoading
      ? 'loading'
      : isReady
        ? `ready:${detectorType || 'unknown'}`
        : 'unavailable'

    if (nextStatus === lastDetectorStatusRef.current) {
      return
    }

    lastDetectorStatusRef.current = nextStatus

    if (isLoading) {
      return
    }

    queueProctoringEvent(id, createProctoringEvent(
      isReady ? 'detector_ready' : 'detector_unavailable',
      {
        source: 'video-recording',
        detectorType,
        details: {
          statusMessage,
        },
      }
    ))
  }, [detectorType, id, isLoading, isReady, statusMessage])

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (lastFaceDetectedRef.current === faceDetected) {
      return
    }

    lastFaceDetectedRef.current = faceDetected

    queueProctoringEvent(id, createProctoringEvent(
      faceDetected ? 'face_detected' : 'face_lost',
      {
        source: 'video-recording',
        detected: faceDetected,
        detectorType,
      }
    ))
  }, [detectorType, faceDetected, id, isLoading])

  useEffect(() => {
    if (!faceSnapshot) {
      return
    }

    queueProctoringEvent(id, createProctoringEvent('face_snapshot_captured', {
      source: 'video-recording',
      detectorType,
    }))
  }, [detectorType, faceSnapshot, id])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      flushProctoringEvents(id).catch((error) => {
        console.error('Failed to flush proctoring events:', error)
      })
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [id])

  const startRecording = async () => {
    try {
      if (!isReady) {
        alert('Face detection is still preparing. Please wait a moment and try again.')
        return
      }

      if (mediaURL) {
        URL.revokeObjectURL(mediaURL)
        setMediaURL('')
      }

      clearSnapshot()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      queueProctoringEvent(id, createProctoringEvent('camera_permission_granted', {
        source: 'video-recording',
      }))

      videoRef.current.onloadedmetadata = async () => {
        await videoRef.current.play().catch(() => {})

        const detectionStarted = await startDetection(videoRef.current)
        if (!detectionStarted) {
          stream.getTracks().forEach((track) => track.stop())
          videoRef.current.srcObject = null
          queueProctoringEvent(id, createProctoringEvent('detector_start_failed', {
            source: 'video-recording',
            detectorType,
          }))
          alert('Face detection is unavailable. Please use a supported browser or try again.')
          return
        }

        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        mediaChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          mediaChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const mediaBlob = new Blob(mediaChunksRef.current, { type: 'video/webm' })
          const objectUrl = URL.createObjectURL(mediaBlob)
          setMediaURL(objectUrl)
          stopDetection()
        }

        mediaRecorder.start()
        setIsRecording(true)
        queueProctoringEvent(id, createProctoringEvent('recording_started', {
          source: 'video-recording',
          detectorType,
        }))
      }
    } catch (error) {
      queueProctoringEvent(id, createProctoringEvent('camera_permission_denied', {
        source: 'video-recording',
        details: {
          message: error.message,
        },
      }))
      alert('Error accessing camera and microphone. Please check permissions.')
      stopDetection()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    stopDetection()
    setIsRecording(false)
    queueProctoringEvent(id, createProctoringEvent('recording_stopped', {
      source: 'video-recording',
      detectorType,
    }))
  }

  const handleSubmit = async () => {
    if (!mediaURL) {
      alert('Please record your answer first')
      return
    }

    if (!faceSnapshot) {
      alert('Face capture is required. Make sure your face is visible on the webcam and try again.')
      return
    }

    setLoading(true)
    try {
      queueProctoringEvent(id, createProctoringEvent('media_submission_started', {
        source: 'video-recording',
        detectorType,
        detected: faceDetected,
      }))
      await flushProctoringEvents(id)

      const mediaBlob = await fetch(mediaURL).then((response) => response.blob())
      const formData = new FormData()
      formData.append('media', mediaBlob, 'answer.webm')

      await api.post(`/interviews/${id}/submit-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      queueProctoringEvent(id, createProctoringEvent('media_submitted', {
        source: 'video-recording',
        detectorType,
      }))
      await flushProctoringEvents(id)

      navigate(`/results/${id}`)
    } catch (error) {
      console.error('Failed to submit recording or save proctoring events:', error)
      alert('Failed to submit recording')
    } finally {
      setLoading(false)
    }
  }

  const handleRerecord = () => {
    if (mediaURL) {
      URL.revokeObjectURL(mediaURL)
    }

    setMediaURL('')
    clearSnapshot()
    queueProctoringEvent(id, createProctoringEvent('recording_reset', {
      source: 'video-recording',
    }))
  }

  const detectorLabel = detectorType === 'native'
    ? 'Browser native'
    : detectorType === 'face-api'
      ? 'face-api.js fallback'
      : 'Unavailable'

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Video Recording</h1>

        <div className="mb-8 p-4 sm:p-6 bg-blue-50 rounded-lg text-center">
          <div className="text-3xl sm:text-5xl font-semibold text-blue-700 mb-4">Face Check</div>
          <p className="text-gray-700 mb-4 text-sm sm:text-base">
            Record your answer with your face visible so the interview session can confirm camera presence.
          </p>

          <div className="mb-4 relative inline-block w-full max-w-sm sm:max-w-md">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full border-2 border-gray-300 rounded bg-gray-900"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full border-2 border-transparent rounded pointer-events-none"
              style={{ display: isRecording ? 'block' : 'none' }}
            />
          </div>

          <div className="mb-4">
            <div className={`inline-block px-4 py-2 rounded text-white text-sm sm:text-base ${
              faceDetected ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {faceDetected ? 'Face Detected' : 'No Face Detected'}
            </div>
          </div>

          {faceSnapshot && (
            <div className="mb-4 text-left">
              <p className="text-sm sm:text-base text-gray-700 mb-2">Captured face snapshot:</p>
              <img
                src={faceSnapshot}
                alt="Captured face"
                className="w-40 h-40 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="mb-4 space-y-1">
            {isLoading && <p className="text-yellow-600">Loading face detection...</p>}
            {!isLoading && (
              <>
                <p className="text-sm text-gray-600">{statusMessage}</p>
                <p className="text-xs text-gray-500">Detection engine: {detectorLabel}</p>
                {!isRecording && (
                  <p className="text-sm text-gray-600">
                    Webcam access is required, and a face must be detected before you submit your recording.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button
              onClick={startRecording}
              disabled={isRecording || isLoading || !isReady}
              className="px-4 sm:px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm sm:text-base"
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>

            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-4 sm:px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 text-sm sm:text-base"
            >
              Stop Recording
            </button>
          </div>

          {mediaURL && (
            <div className="mt-6">
              <p className="text-gray-600 mb-2 text-sm sm:text-base">Preview your recording:</p>
              <video controls src={mediaURL} className="w-full max-w-sm sm:max-w-md mx-auto" />
              <button
                onClick={handleRerecord}
                className="mt-4 px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 text-sm sm:text-base"
              >
                Re-record
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !mediaURL}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
        >
          {loading ? 'Submitting...' : 'Submit Recording'}
        </button>
      </div>
    </div>
  )
}

export default VideoRecordingScreen
