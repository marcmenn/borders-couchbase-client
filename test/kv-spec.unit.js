import { keyValueBackend as testKeyValueBackend } from 'borders-key-value/spec'
import testBucketFactory from '../src/mock-bucket-factory'
import createBackend from '../src/multi-bucket'

describe('data-access-server/couchbase', () => {
  testKeyValueBackend(() => createBackend(testBucketFactory))
})
