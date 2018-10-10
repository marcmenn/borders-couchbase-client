import keyValueBackend, { SUPPORTED_COMMANDS as KV_SUPPORTED } from './backends/key-value'
import upsertViewsBackend, { SUPPORTED_COMMANDS as UPSERT_VIEWS_SUPPORTED } from './backends/upsert-views'
import viewsBackend, { SUPPORTED_COMMANDS as VIEWS_SUPPORTED } from './backends/views'

export const SUPPORTED_COMMANDS = [...KV_SUPPORTED, ...UPSERT_VIEWS_SUPPORTED, ...VIEWS_SUPPORTED]

export default bucket => Object.assign(
  keyValueBackend(bucket),
  viewsBackend(bucket),
  upsertViewsBackend(bucket),
)
