import api from './api'

const flushLocks = new Map()

const getStorageKey = (interviewId) => `proctoring-events:${interviewId}`

const safeParse = (value) => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to parse stored proctoring events:', error)
    return []
  }
}

const readQueue = (interviewId) => {
  if (typeof window === 'undefined' || !interviewId) {
    return []
  }

  return safeParse(window.localStorage.getItem(getStorageKey(interviewId)))
}

const writeQueue = (interviewId, events) => {
  if (typeof window === 'undefined' || !interviewId) {
    return
  }

  if (!events.length) {
    window.localStorage.removeItem(getStorageKey(interviewId))
    return
  }

  window.localStorage.setItem(getStorageKey(interviewId), JSON.stringify(events))
}

const generateEventId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const createProctoringEvent = (type, payload = {}) => ({
  id: generateEventId(),
  type,
  timestamp: new Date().toISOString(),
  ...payload,
})

export const queueProctoringEvent = (interviewId, event) => {
  if (!interviewId || !event?.type) {
    return
  }

  const queue = readQueue(interviewId)
  queue.push({
    timestamp: new Date().toISOString(),
    ...event,
  })

  writeQueue(interviewId, queue.slice(-250))
}

export const clearProctoringEvents = (interviewId) => {
  if (typeof window === 'undefined' || !interviewId) {
    return
  }

  window.localStorage.removeItem(getStorageKey(interviewId))
}

export const flushProctoringEvents = async (interviewId) => {
  if (!interviewId) {
    return 0
  }

  if (flushLocks.has(interviewId)) {
    return flushLocks.get(interviewId)
  }

  const pendingFlush = (async () => {
    const storageKey = getStorageKey(interviewId)
    const serializedQueue = typeof window === 'undefined'
      ? '[]'
      : window.localStorage.getItem(storageKey) || '[]'
    const events = safeParse(serializedQueue)

    if (!events.length) {
      return 0
    }

    const response = await api.post(`/interviews/${interviewId}/proctoring-events`, {
      events,
    })

    if (typeof window !== 'undefined') {
      const latestSerializedQueue = window.localStorage.getItem(storageKey) || '[]'

      if (latestSerializedQueue === serializedQueue) {
        window.localStorage.removeItem(storageKey)
      } else {
        const deliveredIds = new Set(events.map((event) => event.id))
        const remainingEvents = safeParse(latestSerializedQueue).filter(
          (event) => !deliveredIds.has(event.id)
        )
        writeQueue(interviewId, remainingEvents)
      }
    }

    return response.data?.savedCount || events.length
  })().finally(() => {
    flushLocks.delete(interviewId)
  })

  flushLocks.set(interviewId, pendingFlush)
  return pendingFlush
}
