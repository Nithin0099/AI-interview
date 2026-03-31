import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const VoiceRecordingScreen = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState('')
  const [loading, setLoading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleSubmit = async () => {
    if (!audioURL) {
      alert('Please record your answer first')
      return
    }

    setLoading(true)
    try {
      const audioBlob = await fetch(audioURL).then(r => r.blob())
      const formData = new FormData()
      formData.append('audio', audioBlob, 'answer.wav')

      await api.post(`/interviews/${id}/submit-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      navigate(`/results/${id}`)
    } catch (error) {
      alert('Failed to submit recording')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Voice Recording</h1>

        <div className="mb-8 p-6 bg-blue-50 rounded-lg text-center">
          <div className="text-6xl mb-4">🎤</div>
          <p className="text-gray-700 mb-4">Click record to start your voice response</p>

          <div className="flex gap-4 justify-center mb-4">
            <button
              onClick={startRecording}
              disabled={isRecording}
              className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>

            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              Stop Recording
            </button>
          </div>

          {audioURL && (
            <div className="mt-6">
              <p className="text-gray-600 mb-2">Preview your recording:</p>
              <audio controls src={audioURL} className="w-full" />
              <button
                onClick={() => setAudioURL('')}
                className="mt-4 px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Re-record
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !audioURL}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Recording'}
        </button>
      </div>
    </div>
  )
}

export default VoiceRecordingScreen
