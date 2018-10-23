import { multiplex } from 'borders/backends'
import upsertViewsBackend, { SUPPORTED_COMMANDS as UPSERT_VIEWS_SUPPORTED } from './backends/upsert-views'
import viewsBackend, { SUPPORTED_COMMANDS as VIEWS_SUPPORTED } from './backends/views'
import _selectBackend from './select-by-bucket'

const SUPPORTED_COMMANDS = [...VIEWS_SUPPORTED, ...UPSERT_VIEWS_SUPPORTED]

const selectBackend = _selectBackend('')

export default (bucketFactory, backendDecorator) => {
  const createBackend = async (key) => {
    const bucket = await (key === '' ? bucketFactory() : bucketFactory(key))
    const backends = [Object.assign(
      viewsBackend(bucket),
      upsertViewsBackend(bucket),
    )]
    if (backendDecorator) return backendDecorator.decorate(backends)
    return backends
  }

  const commands = [...SUPPORTED_COMMANDS]

  if (backendDecorator) {
    commands.push(...backendDecorator.commands)
  }

  return multiplex(selectBackend, createBackend, commands)
}
