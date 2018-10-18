import keyValueBackend from './backends/key-value'
import upsertViewsBackend from './backends/upsert-views'
import viewsBackend from './backends/views'

export default bucket => Object.assign(
  keyValueBackend(bucket),
  viewsBackend(bucket),
  upsertViewsBackend(bucket),
)
