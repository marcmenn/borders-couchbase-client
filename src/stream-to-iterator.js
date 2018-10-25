import './symbol-async-iterator'

const NOT_READABLE = Symbol('not readable')
const READABLE = Symbol('readable')
const ENDED = Symbol('ended')
const ERRORED = Symbol('errored')

function streamToIterator(stream) {
  let error
  let state = NOT_READABLE
  const rejections = new Set()

  const handleStreamError = (err) => {
    error = err
    state = ERRORED
    for (const reject of rejections) {
      reject(err)
    }
  }

  const handleStreamEnd = () => {
    state = ENDED
  }

  stream.once('error', handleStreamError)
  stream.once('end', handleStreamEnd)

  const untilReadable = () =>
    new Promise((resolve, reject) => {
      const handleReadable = () => {
        state = READABLE
        rejections.delete(reject)
        resolve()
      }

      stream.once('readable', handleReadable)
      rejections.add(reject)
    })

  const untilEnd = () =>
    new Promise((resolve, reject) => {
      const handleEnd = () => {
        state = ENDED
        rejections.delete(reject)
        resolve()
      }

      stream.once('end', handleEnd)
      rejections.add(reject)
    })

  const asyncIterator = {
    async next() {
      if (state === NOT_READABLE) {
        await Promise.race([
          untilReadable(),
          untilEnd(),
        ])
        return asyncIterator.next()
      }
      if (state === ENDED) {
        return { done: true, value: null }
      }
      if (state === ERRORED) {
        throw error
      }
      const data = stream.read()

      if (data != null) {
        return { done: false, value: data }
      }

      state = NOT_READABLE
      return asyncIterator.next()
    },
  }

  Object.defineProperty(
    asyncIterator,
    Symbol.asyncIterator,
    {
      configurable: true,
      value: () => asyncIterator,
    },
  )

  return asyncIterator
}

export default streamToIterator
