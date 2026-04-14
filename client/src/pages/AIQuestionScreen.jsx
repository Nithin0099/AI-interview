import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { useFaceDetection } from '../hooks/useFaceDetection'
import { createProctoringEvent, flushProctoringEvents, queueProctoringEvent } from '../services/proctoring'

const AIQuestionScreen = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const speechRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const handleNextRef = useRef(null)
  const lastFaceDetectedRef = useRef(null)
  const lastDetectorStatusRef = useRef('')

  const {
    isReady,
    isLoading: isFaceDetectionLoading,
    detectorType,
    faceDetected,
    statusMessage,
    startDetection,
    stopDetection,
  } = useFaceDetection({
    intervalMs: 900,
  })

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await api.get(`/interviews/${id}/question/${questionIndex}`)
        setQuestion(response.data.question)
      } catch (error) {
        console.error('Failed to fetch question:', error)
      }
    }

    fetchQuestion()
  }, [id, questionIndex])

  useEffect(() => {
    queueProctoringEvent(id, createProctoringEvent('question_session_started', {
      source: 'question-screen',
    }))

    return () => {
      queueProctoringEvent(id, createProctoringEvent('question_session_ended', {
        source: 'question-screen',
      }))
      flushProctoringEvents(id).catch((error) => {
        console.error('Failed to flush proctoring events on question screen cleanup:', error)
      })
    }
  }, [id])

  useEffect(() => {
    handleNextRef.current = async () => {
      if (!answer.trim()) {
        alert('Please provide an answer before proceeding')
        return
      }

      setLoading(true)
      try {
        queueProctoringEvent(id, createProctoringEvent('answer_submitted', {
          source: 'question-screen',
          detected: faceDetected,
          detectorType,
          details: {
            questionIndex,
            timeSpent: 300 - timeLeft,
          },
        }))
        await flushProctoringEvents(id)

        await api.post(`/interviews/${id}/answer`, {
          questionIndex,
          answer,
          timeSpent: 300 - timeLeft,
        })

        setAnswer('')
        setTimeLeft(300)

        const response = await api.get(`/interviews/${id}/question/${questionIndex + 1}`)
        if (response.data.question) {
          setQuestionIndex(questionIndex + 1)
        } else {
          navigate(`/results/${id}`)
        }
      } catch (error) {
        console.error('Failed to save answer or proctoring events:', error)
        if (error.response?.status === 404) {
          navigate(`/results/${id}`)
        }
      } finally {
        setLoading(false)
      }
    }
  }, [answer, detectorType, faceDetected, id, navigate, questionIndex, timeLeft])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          window.setTimeout(() => {
            handleNextRef.current?.()
          }, 0)
          return 0
        }

        return previousTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        setHasPermissions(true)
        queueProctoringEvent(id, createProctoringEvent('camera_permission_granted', {
          source: 'question-screen',
        }))
      } catch (error) {
        console.error('Error accessing camera/mic:', error)
        queueProctoringEvent(id, createProctoringEvent('camera_permission_denied', {
          source: 'question-screen',
          details: {
            message: error.message,
          },
        }))
        alert('Please allow camera and microphone permissions to proceed with the interview.')
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      window.speechSynthesis.cancel()
      stopDetection()
    }
  }, [id, stopDetection])

  useEffect(() => {
    if (!hasPermissions || !isReady || !videoRef.current) {
      return
    }

    startDetection(videoRef.current)
  }, [hasPermissions, isReady, startDetection])

  useEffect(() => {
    const nextStatus = isFaceDetectionLoading
      ? 'loading'
      : isReady
        ? `ready:${detectorType || 'unknown'}`
        : 'unavailable'

    if (nextStatus === lastDetectorStatusRef.current) {
      return
    }

    lastDetectorStatusRef.current = nextStatus

    if (isFaceDetectionLoading) {
      return
    }

    queueProctoringEvent(id, createProctoringEvent(
      isReady ? 'detector_ready' : 'detector_unavailable',
      {
        source: 'question-screen',
        detectorType,
        details: {
          statusMessage,
        },
      }
    ))
  }, [detectorType, id, isFaceDetectionLoading, isReady, statusMessage])

  useEffect(() => {
    if (!hasPermissions || isFaceDetectionLoading) {
      return
    }

    if (lastFaceDetectedRef.current === faceDetected) {
      return
    }

    lastFaceDetectedRef.current = faceDetected

    queueProctoringEvent(id, createProctoringEvent(
      faceDetected ? 'face_detected' : 'face_lost',
      {
        source: 'question-screen',
        detected: faceDetected,
        detectorType,
      }
    ))
  }, [detectorType, faceDetected, hasPermissions, id, isFaceDetectionLoading])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      flushProctoringEvents(id).catch((error) => {
        console.error('Failed to flush proctoring events:', error)
      })
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [id])

  const handleNext = async () => {
    await handleNextRef.current?.()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const playQuestion = () => {
    if (speechRef.current) {
      window.speechSynthesis.cancel()
    }

    if (question) {
      const utterance = new SpeechSynthesisUtterance(question.text)
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      speechRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopQuestion = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      queueProctoringEvent(id, createProctoringEvent('voice_input_unavailable', {
        source: 'question-screen',
      }))
      alert('Speech recognition is not supported in this browser.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      queueProctoringEvent(id, createProctoringEvent('voice_input_started', {
        source: 'question-screen',
      }))
    }

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          finalTranscript += event.results[index][0].transcript
        }
      }

      if (finalTranscript) {
        setAnswer((previousAnswer) => `${previousAnswer} ${finalTranscript}`.trim())
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      queueProctoringEvent(id, createProctoringEvent('voice_input_stopped', {
        source: 'question-screen',
      }))
    }

    recognitionRef.current.start()
  }

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  if (!question) {
    return <div className="text-center py-8">Loading question...</div>
  }

  const detectorLabel = detectorType === 'native'
    ? 'Native detector'
    : detectorType === 'face-api'
      ? 'face-api fallback'
      : 'Detector unavailable'

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start border-b pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Question {questionIndex + 1}</h1>
          <div
            className={`text-xl sm:text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="w-32 h-32 relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 mt-4 sm:mt-0 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
            aria-label="Video feed for face detection"
          />
          {hasPermissions && (
            <>
              <div className={`absolute bottom-0 left-0 right-0 text-xs font-semibold py-1 text-center text-white ${faceDetected ? 'bg-green-500/80' : 'bg-red-500/90'}`}>
                {faceDetected ? 'Face Detected' : 'No Face'}
              </div>
              <div className="absolute top-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                {isFaceDetectionLoading ? 'Loading detector...' : detectorLabel}
              </div>
            </>
          )}
          {!hasPermissions && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 text-center p-2 bg-gray-50 dark:bg-gray-800">
              Starting Camera...
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">{question.text}</p>
          <button
            onClick={isPlaying ? stopQuestion : playQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
            aria-label={isPlaying ? 'Stop reading question aloud' : 'Read question aloud'}
          >
            {isPlaying ? 'Stop' : 'Play'} Question
          </button>
        </div>

        {question.hint && (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Hint:</strong> {question.hint}</p>
          </div>
        )}

        <div className={`rounded border px-3 py-2 text-sm ${
          faceDetected
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-yellow-200 bg-yellow-50 text-yellow-800'
        }`}>
          {statusMessage}
          {!faceDetected && !isFaceDetectionLoading ? ' Keep your face centered in the camera frame during the interview.' : ''}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8">
        <label htmlFor="answer-textarea" className="block text-gray-700 dark:text-gray-300 font-semibold mb-4 text-sm sm:text-base">
          Your Answer
        </label>
        <textarea
          id="answer-textarea"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer here..."
          rows="6"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 mb-4 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          aria-describedby="answer-help"
        />
        <div className="flex gap-2 mb-4">
          <button
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`px-4 py-2 rounded text-sm sm:text-base ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? 'Stop Voice' : 'Start Voice'}
          </button>
        </div>
        <p id="answer-help" className="sr-only">Use the text area to type your answer or use voice input. You have 5 minutes to answer.</p>

        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
          aria-label="Submit answer and go to next question"
        >
          {loading ? 'Saving...' : 'Next Question'}
        </button>
      </div>
    </div>
  )
}

export default AIQuestionScreen
