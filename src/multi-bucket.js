import { cacheBackend } from 'borders-key-value'
import { SUPPORTED_COMMANDS } from './backend'
import keyValueBackend from './backends/key-value'
import upsertViewsBackend from './backends/upsert-views'
import viewsBackend from './backends/views'

export default (bucketFactory) => {
  const buckets = {}
  const backends = {}

  const createCommand = type => async (payload, { execute }) => {
    const bucketName = (payload && payload.bucket) || undefined
    const key = bucketName || ''
    if (!buckets[key]) {
      buckets[key] = bucketFactory(bucketName)
    }
    const bucket = await buckets[key]

    return execute({
      type,
      payload,
      backend(connect) {
        if (!backends[key]) {
          backends[key] = Object.assign(
            connect(cacheBackend(), keyValueBackend(bucket)),
            connect(viewsBackend(bucket)),
            connect(upsertViewsBackend(bucket)),
          )
        }
        return backends[key]
      },
    })
  }

  const result = {}
  for (const command of SUPPORTED_COMMANDS) {
    result[command] = createCommand(command)
  }
  return result
}
