import { cacheBackend } from 'borders-key-value'
import { SUPPORTED_COMMANDS } from './backend'
import keyValueBackend from './backends/key-value'
import upsertViewsBackend from './backends/upsert-views'
import viewsBackend from './backends/views'

export default (bucketFactory) => {
  const backends = {}

  const createCommand = type => async (payload, { connect, invoke }) => {
    const bucketName = (payload && payload.bucket) || undefined
    const key = bucketName || ''
    if (!backends[key]) {
      const create = async () => {
        const bucket = await bucketFactory(bucketName)
        return Object.assign(
          connect(cacheBackend(), keyValueBackend(bucket)),
          connect(viewsBackend(bucket)),
          connect(upsertViewsBackend(bucket)),
        )
      }
      backends[key] = create()
    }
    const backend = await backends[key]
    const result = invoke({ type, payload }, backend)
    return Promise.resolve(result)
  }

  const result = {}
  for (const command of SUPPORTED_COMMANDS) {
    result[command] = createCommand(command)
  }
  return result
}
