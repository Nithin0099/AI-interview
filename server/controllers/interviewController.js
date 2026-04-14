const Interview = require('../models/Interview')
const Question = require('../models/Question')
const Feedback = require('../models/Feedback')
const { generateQuestions, calculateScore } = require('../utils/helpers')
const fs = require('fs')

const ensureInterviewAccess = (interview, req, res) => {
  if (!interview) {
    res.status(404).json({ message: 'Interview not found' })
    return false
  }

  if (interview.userId.toString() !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ message: 'Unauthorized' })
    return false
  }

  return true
}

const parseEventTimestamp = (value) => {
  const timestamp = value ? new Date(value) : new Date()
  return Number.isNaN(timestamp.getTime()) ? new Date() : timestamp
}

const parseProctoringEvents = (rawEvents) => {
  if (!rawEvents) {
    return []
  }

  if (Array.isArray(rawEvents)) {
    return rawEvents
  }

  if (typeof rawEvents === 'string') {
    try {
      const parsed = JSON.parse(rawEvents)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  }

  return []
}

const sanitizeDetails = (details) => {
  if (details === undefined) {
    return undefined
  }

  try {
    return JSON.parse(JSON.stringify(details))
  } catch (error) {
    return { note: 'Unable to serialize event details' }
  }
}

const appendProctoringEvents = (interview, rawEvents) => {
  const events = parseProctoringEvents(rawEvents)
    .slice(-100)
    .filter((event) => event && typeof event.type === 'string')
    .map((event) => ({
      type: event.type.slice(0, 80),
      source: typeof event.source === 'string' ? event.source.slice(0, 80) : undefined,
      detectorType: typeof event.detectorType === 'string' ? event.detectorType.slice(0, 40) : undefined,
      detected: typeof event.detected === 'boolean' ? event.detected : undefined,
      timestamp: parseEventTimestamp(event.timestamp),
      details: sanitizeDetails(event.details)
    }))

  if (!events.length) {
    return 0
  }

  interview.proctoringEvents.push(...events)

  if (interview.proctoringEvents.length > 500) {
    interview.proctoringEvents = interview.proctoringEvents.slice(-500)
  }

  return events.length
}

exports.createInterview = async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body
    const resumePath = req.file ? req.file.path : null

    const interview = new Interview({
      userId: req.userId,
      jobTitle,
      jobDescription,
      resumePath,
      status: 'not_started'
    })

    await interview.save()
    res.status(201).json({ interviewId: interview._id })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    res.json(interview)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateInterview = async (req, res) => {
  try {
    const { difficulty, duration, status } = req.body
    const interview = await Interview.findById(req.params.id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    if (status === 'in_progress') {
      interview.status = 'in_progress'
      interview.startedAt = new Date()
      interview.difficulty = difficulty || 'medium'
      interview.duration = duration || 30

      const questions = generateQuestions(interview.jobTitle, interview.difficulty)
      interview.questions = questions
    }

    await interview.save()
    res.json(interview)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getQuestion = async (req, res) => {
  try {
    const { id, index } = req.params
    const interview = await Interview.findById(id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    const parsedIndex = parseInt(index, 10)
    if (!interview.questions[parsedIndex]) {
      return res.status(404).json({ message: 'Question not found' })
    }

    res.json({ question: interview.questions[parsedIndex] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params
    const { questionIndex, answer, timeSpent } = req.body

    const interview = await Interview.findById(id)
    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    interview.answers.push({
      questionIndex,
      answer,
      timeSpent,
      score: Math.random() * 100
    })

    appendProctoringEvents(interview, req.body.proctoringEvents)

    await interview.save()
    res.json({ message: 'Answer saved' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.submitProctoringEvents = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    const savedCount = appendProctoringEvents(interview, req.body.events)
    await interview.save()

    res.json({
      message: 'Proctoring events saved',
      savedCount
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.submitMedia = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' })
    }

    interview.mediaSubmissions.push({
      mediaPath: req.file.path,
      contentType: req.file.mimetype
    })

    appendProctoringEvents(interview, req.body.proctoringEvents)
    interview.status = 'completed'
    interview.completedAt = new Date()

    await interview.save()

    res.json({
      message: 'Media submitted',
      mediaPath: req.file.path
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getResults = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!ensureInterviewAccess(interview, req, res)) {
      return
    }

    const score = calculateScore(interview.answers)

    const feedback = interview.answers.map((ans, idx) => ({
      question: interview.questions[idx]?.text,
      userAnswer: ans.answer,
      feedback: 'Good attempt. Consider improving on...',
      score: ans.score || 0
    }))

    const proctoringSummary = {
      totalEvents: interview.proctoringEvents.length,
      faceDetectedCount: interview.proctoringEvents.filter((event) => event.type === 'face_detected').length,
      faceLostCount: interview.proctoringEvents.filter((event) => event.type === 'face_lost').length,
      detectorTypes: [...new Set(
        interview.proctoringEvents
          .map((event) => event.detectorType)
          .filter(Boolean)
      )]
    }

    res.json({
      score,
      questionsAnswered: interview.answers.length,
      totalQuestions: interview.questions.length,
      duration: interview.duration,
      feedback,
      proctoringSummary
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
    res.json(interviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' })
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    if (interview.resumePath) {
      fs.unlink(interview.resumePath, () => {})
    }

    interview.mediaSubmissions.forEach((submission) => {
      if (submission.mediaPath) {
        fs.unlink(submission.mediaPath, () => {})
      }
    })

    await Interview.findByIdAndDelete(req.params.id)
    res.json({ message: 'Interview deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
