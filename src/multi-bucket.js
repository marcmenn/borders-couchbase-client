import isPromise from 'is-promise'
import { cacheBackend } from 'borders-key-value'
import singleBackend, { SUPPORTED_COMMANDS } from './backend'

const createBackend = async (bucket) => {
  if (isPromise(bucket)) {
    return createBackend(await bucket)
  }
  return cacheBackend(singleBackend(bucket))
}

export default (bucketFactory) => {
  const backends = {}

  const createCommand = command => async (payload) => {
    const bucketName = (payload && payload.bucket) || ''
    if (!backends[bucketName]) {
      backends[bucketName] = createBackend(bucketFactory(bucketName))
    }
    const backend = await backends[bucketName]
    const result = backend[command](payload)
    return Promise.resolve(result)
  }

  const result = {}
  for (const command of SUPPORTED_COMMANDS) {
    result[command] = createCommand(command)
  }
  return result
}
