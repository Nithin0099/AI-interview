import { useCallback, useEffect, useRef, useState } from 'react'

const MODEL_URL = `${import.meta.env.BASE_URL}models`

let faceApiImportPromise
let faceApiModelsPromise

const captureVideoFrame = (videoElement) => {
  if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
    return ''
  }

  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const context = canvas.getContext('2d')
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png')
}

const loadFaceApi = async () => {
  if (!faceApiImportPromise) {
    faceApiImportPromise = import('face-api.js')
  }

  return faceApiImportPromise
}

const loadFaceApiModels = async () => {
  const faceapi = await loadFaceApi()

  if (!faceApiModelsPromise) {
    faceApiModelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    ])
      .then(() => faceapi)
      .catch((error) => {
        faceApiModelsPromise = null
        throw error
      })
  }

  return faceApiModelsPromise
}

const normalizeNativeDetection = (detection) => {
  const box = detection.boundingBox

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    score: 1,
  }
}

const normalizeFaceApiDetection = (detection) => {
  const faceApiDetection = detection?.detection?.box
    ? detection.detection
    : detection?.box
      ? detection
      : null

  if (!faceApiDetection?.box) {
    return null
  }

  const box = faceApiDetection.box

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    score: faceApiDetection.score ?? 0,
  }
}

export const useFaceDetection = ({
  captureSnapshotOnDetect = false,
  intervalMs = 700,
} = {}) => {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceSnapshot, setFaceSnapshot] = useState('')
  const [detectorType, setDetectorType] = useState('')
  const [statusMessage, setStatusMessage] = useState('Preparing face detection...')
  const [lastUpdateAt, setLastUpdateAt] = useState(0)

  const detectorRef = useRef(null)
  const intervalRef = useRef(null)
  const isDetectingRef = useRef(false)
  const lastBoxRef = useRef(null)
  const videoElementRef = useRef(null)

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    isDetectingRef.current = false
    setFaceDetected(false)
    lastBoxRef.current = null
    setLastUpdateAt(Date.now())
  }, [])

  const loadDetector = useCallback(async () => {
    setIsLoading(true)
    setStatusMessage('Preparing face detection...')

    if ('FaceDetector' in window) {
      detectorRef.current = {
        type: 'native',
        instance: new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        }),
      }

      setDetectorType('native')
      setStatusMessage('Native face detection is ready.')
      setIsReady(true)
      setIsLoading(false)
      return
    }

    try {
      const faceapi = await loadFaceApiModels()

      detectorRef.current = {
        type: 'face-api',
        instance: faceapi,
      }

      setDetectorType('face-api')
      setStatusMessage('Face detection is ready.')
      setIsReady(true)
    } catch (error) {
      console.error('Face detection setup failed:', error)
      detectorRef.current = null
      setDetectorType('')
      setIsReady(false)
      setStatusMessage('Face detection is unavailable in this browser right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDetector()
  }, [loadDetector])

  const detectFace = useCallback(async () => {
    const videoElement = videoElementRef.current

    if (
      isDetectingRef.current ||
      !detectorRef.current ||
      !videoElement ||
      videoElement.readyState < 2 ||
      !videoElement.videoWidth
    ) {
      return null
    }

    isDetectingRef.current = true

    try {
      let normalizedDetection = null

      if (detectorRef.current.type === 'native') {
        const detections = await detectorRef.current.instance.detect(videoElement)
        normalizedDetection = detections.length > 0 ? normalizeNativeDetection(detections[0]) : null
      } else {
        const detection = await detectorRef.current.instance.detectSingleFace(
          videoElement,
          new detectorRef.current.instance.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.35,
          })
        )

        normalizedDetection = detection ? normalizeFaceApiDetection(detection) : null
      }

      lastBoxRef.current = normalizedDetection
      setFaceDetected(Boolean(normalizedDetection))
      setLastUpdateAt(Date.now())

      if (normalizedDetection && captureSnapshotOnDetect && !faceSnapshot) {
        setFaceSnapshot(captureVideoFrame(videoElement))
      }

      return normalizedDetection
    } catch (error) {
      console.error('Face detection failed:', error)
      lastBoxRef.current = null
      setFaceDetected(false)
      setLastUpdateAt(Date.now())
      return null
    } finally {
      isDetectingRef.current = false
    }
  }, [captureSnapshotOnDetect, faceSnapshot])

  const startDetection = useCallback(async (videoElement) => {
    if (!videoElement) {
      return false
    }

    videoElementRef.current = videoElement

    if (!detectorRef.current) {
      if (isLoading) {
        return false
      }

      await loadDetector()
    }

    if (!detectorRef.current) {
      return false
    }

    stopDetection()
    await detectFace()
    intervalRef.current = window.setInterval(detectFace, intervalMs)

    return true
  }, [detectFace, intervalMs, isLoading, loadDetector, stopDetection])

  const captureSnapshot = useCallback(() => {
    const snapshot = captureVideoFrame(videoElementRef.current)

    if (snapshot) {
      setFaceSnapshot(snapshot)
    }

    return snapshot
  }, [])

  const clearSnapshot = useCallback(() => {
    setFaceSnapshot('')
  }, [])

  useEffect(() => stopDetection, [stopDetection])

  return {
    isReady,
    isLoading,
    detectorType,
    faceDetected,
    faceSnapshot,
    statusMessage,
    lastUpdateAt,
    loadDetector,
    startDetection,
    stopDetection,
    detectFace,
    captureSnapshot,
    clearSnapshot,
    getLastBox: () => lastBoxRef.current,
  }
}
