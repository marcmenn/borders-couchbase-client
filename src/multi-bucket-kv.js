import { multiplex } from 'borders/backends'
import { CACHE_STATS, CacheBackend } from 'borders-key-value'
import keyValueBackend, { SUPPORTED_COMMANDS } from './backends/key-value'
import _selectBackend from './select-by-bucket'

const selectBackend = _selectBackend('')

export default (bucketFactory, backendDecorator) => {
  const createBackend = async (key) => {
    const bucket = await (key === '' ? bucketFactory() : bucketFactory(key))
    const backends = [new CacheBackend(), keyValueBackend(bucket)]
    if (backendDecorator) return backendDecorator.decorate(backends)
    return backends
  }

  const commands = [...SUPPORTED_COMMANDS, CACHE_STATS]

  if (backendDecorator) {
    commands.push(...backendDecorator.commands)
  }

  return multiplex(selectBackend, createBackend, commands)
}
