import Context from 'borders'
import { insert, KeyAlreadyExistsError, remove, replace, upsert } from 'borders-key-value'
import { AssertionError, expect } from 'chai'
import { version } from 'couchbase/package.json'
import Pending from 'mocha/lib/pending'
import semver from 'semver'
import { KeyValueBackend } from '../src/backends'
import testBucketFactory from '../src/mock-bucket-factory'
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
  let bucket

  beforeEach(() => {
    bucket = testBucketFactory()()
    backend = new KeyValueBackend(bucket)
  })

  const execute = fn => () => new Context().use(backend).execute(fn())

  it('should fail replacing if cas changed from outside', execute(async function* test() {
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    await bucketReplace(key, secondValue)
    yield* expectEntityConflict(replace(key, thirdValue))
  }))

  it('should fail upserting if cas changed from outside', execute(async function* test() {
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    await bucketReplace(key, secondValue)
    yield* expectEntityConflict(upsert(key, thirdValue))
  }))

  it('should fail removing if cas changed from outside', execute(async function* test() {
    if (semver.satisfies(version, '<= 2.6.0')) { // unsupported in Mock yet
      throw new Pending()
    }
    const { replace: bucketReplace } = promised(bucket, 'replace')
    yield insert(key, value)
    await bucketReplace(key, secondValue)
    yield* expectEntityConflict(remove(key, thirdValue))
  }))
})
