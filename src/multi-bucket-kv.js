import { multiplex } from 'borders/backends'
import { cacheBackend } from 'borders-key-value'
import keyValueBackend, { SUPPORTED_COMMANDS } from './backends/key-value'

export default (bucketFactory, backendDecorator) => {
  const selectBackend = (payload) => {
    const { bucket } = payload
    return bucket || ''
  }

  const createBackend = async (key) => {
    const bucket = await (key === '' ? bucketFactory() : bucketFactory(key))
    const backends = [cacheBackend(), keyValueBackend(bucket)]
    if (backendDecorator) return backendDecorator(backends)
    return backends
  }

  return multiplex(selectBackend, createBackend, SUPPORTED_COMMANDS)
}
