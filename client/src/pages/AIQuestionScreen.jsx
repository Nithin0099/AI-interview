import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const AIQuestionScreen = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)

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
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleNext = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer before proceeding')
      return
    }

    setLoading(true)
    try {
      await api.post(`/interviews/${id}/answer`, {
        questionIndex,
        answer,
        timeSpent: 300 - timeLeft
      })

      setAnswer('')
      setTimeLeft(300)
      
      // Check if there are more questions
      const response = await api.get(`/interviews/${id}/question/${questionIndex + 1}`)
      if (response.data.question) {
        setQuestionIndex(questionIndex + 1)
      } else {
        navigate(`/results/${id}`)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        navigate(`/results/${id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (!question) {
    return <div className="text-center py-8">Loading question...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Question {questionIndex + 1}</h1>
        <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <p className="text-xl text-gray-800 mb-6">{question.text}</p>
        
        {question.hint && (
          <div className="bg-blue-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-600"><strong>Hint:</strong> {question.hint}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <label className="block text-gray-700 font-semibold mb-4">Your Answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows="6"
          className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 mb-4"
        />

        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Next Question'}
        </button>
      </div>
    </div>
  )
}

export default AIQuestionScreen
