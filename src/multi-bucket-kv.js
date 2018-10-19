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
    if (backendDecorator) return backendDecorator.decorate(backends)
    return backends
  }

  const commands = [...SUPPORTED_COMMANDS]

  if (backendDecorator) {
    commands.push(...backendDecorator.commands)
  }

  return multiplex(selectBackend, createBackend, commands)
}
