import Context from 'borders'
import { insert, KeyAlreadyExistsError, remove, replace, upsert } from 'borders-key-value'
import { AssertionError, expect } from 'chai'
import { version } from 'couchbase/package.json'
import Pending from 'mocha/lib/pending'
import semver from 'semver'
import getBucket from '../src/get-bucket-command'
import testBucketFactory from '../src/mock-bucket-factory'
import createBackend from '../src/multi-bucket'
import promised from '../src/promised'

describe('data-access-server/couchbase/cas', () => {
  const key = 'key'
  const value = { key: 'value' }
  const secondValue = { key: 'value2' }
  const thirdValue = { key: 'value3' }

  const expectThrow = error => function* exec(_value) {
    try {
      yield _value
    } catch (e) {
      expect(e, e.toString()).to.be.instanceOf(error)
      return
    }
    throw new AssertionError(`expected yielding ${_value} to generate ${error.name}`)
  }

  const expectEntityConflict = expectThrow(KeyAlreadyExistsError)

  let backend

  beforeEach(() => {
    backend = createBackend(testBucketFactory)
  })

  const execute = fn => () => new Context().use(backend).execute(fn())

  it('should fail replacing if cas changed from outside', execute(function* test() {
    const bucket = yield getBucket()
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    yield bucketReplace(key, secondValue)
    yield* expectEntityConflict(replace(key, thirdValue))
  }))

  it('should fail upserting if cas changed from outside', execute(function* test() {
    const bucket = yield getBucket()
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    yield bucketReplace(key, secondValue)
    yield* expectEntityConflict(upsert(key, thirdValue))
  }))

  it('should fail removing if cas changed from outside', execute(function* test() {
    if (semver.satisfies(version, '<= 2.4.1')) { // unsupported in Mock yet
      throw new Pending()
    }
    const bucket = yield getBucket()
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    yield bucketReplace(key, secondValue)
    yield* expectEntityConflict(remove(key, thirdValue))
  }))
})
