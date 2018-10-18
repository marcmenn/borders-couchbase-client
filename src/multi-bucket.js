import keyValueBackend from './multi-bucket-kv'
import viewsBackend from './multi-bucket-views'

export default (bucketFactory, kvBackendDecorator, viewBackendDecorator) => {
  const buckets = {}

  const _bucketFactory = async (bucketName) => {
    if (!buckets[bucketName]) {
      buckets[bucketName] = bucketFactory(bucketName)
    }
    const bucket = await buckets[bucketName]
    if (bucket.connected === false) {
      buckets[bucketName] = null
      return _bucketFactory(bucketName)
    }
    return bucket
  }

  return Object.assign(
    keyValueBackend(_bucketFactory, kvBackendDecorator),
    viewsBackend(_bucketFactory, viewBackendDecorator),
  )
}
