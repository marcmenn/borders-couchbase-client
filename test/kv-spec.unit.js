import { keyValueBackend as testKeyValueBackend } from 'borders-key-value/spec'
import { KeyValueBackend } from '../src/backends'
import testBucketFactory from '../src/mock-bucket-factory'

describe('data-access-server/couchbase', () => {
  testKeyValueBackend(() => [new KeyValueBackend(testBucketFactory()())])
})
