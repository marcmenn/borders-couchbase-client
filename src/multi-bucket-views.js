import { multiplex } from 'borders/backends'
import upsertViewsBackend, { SUPPORTED_COMMANDS as UPSERT_VIEWS_SUPPORTED } from './backends/upsert-views'
import viewsBackend, { SUPPORTED_COMMANDS as VIEWS_SUPPORTED } from './backends/views'

const SUPPORTED_COMMANDS = [...VIEWS_SUPPORTED, ...UPSERT_VIEWS_SUPPORTED]

export default (bucketFactory, backendDecorator) => {
  const selectBackend = (payload) => {
    const { bucket } = payload
    return bucket || ''
  }

  const createBackend = async (key) => {
    const bucket = await (key === '' ? bucketFactory() : bucketFactory(key))
    const backends = [Object.assign(
      viewsBackend(bucket),
      upsertViewsBackend(bucket),
    )]
    if (backendDecorator) return backendDecorator(backends)
    return backends
  }

  return multiplex(selectBackend, createBackend, SUPPORTED_COMMANDS)
}
