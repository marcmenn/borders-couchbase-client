import keyValueBackend from './multi-bucket-kv'
import viewsBackend from './multi-bucket-views'

export default (bucketFactory, kvBackendDecorator, viewBackendDecorator) => {
  const buckets = {}

  const _bucketFactory = (bucketName) => {
    if (!buckets[bucketName]) {
      buckets[bucketName] = bucketFactory(bucketName)
    }
    return buckets[bucketName]
  }

  return Object.assign(
    keyValueBackend(_bucketFactory, kvBackendDecorator),
    viewsBackend(_bucketFactory, viewBackendDecorator),
  )
}
