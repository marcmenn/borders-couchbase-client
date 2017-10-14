import * as kv from 'borders-key-value'
import Context from 'borders'
import { Mock } from 'couchbase'
import chai from 'chai'
import sinon from 'sinon'
import backend from '../src/multi-bucket'
import * as cb from '../src/commands'

const { expect } = chai

describe('multi-bucket', () => {
  const KEY = 'key'
  const VALUE = { paylod: 'multi-bucket-test-value' }
  const FIRST_BUCKET = 'first'
  const SECOND_BUCKET = 'second'

  let sandbox
  let bucketFactorySpy

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => sandbox.restore())

  const testWithBackend = test => async () => {
    const bucketFactory = name => new Mock.Cluster().openBucket(name || 'default', 'password')
    bucketFactorySpy = sinon.spy(bucketFactory)
    const context = new Context().use(backend(bucketFactorySpy))
    await context.execute(test())
  }

  it('should not call bucket factory without command', testWithBackend(function* test() {
    expect(bucketFactorySpy.callCount).to.eq(0)
    yield Promise.resolve()
  }))

  it('should call bucket factory for every bucket', testWithBackend(function* test() {
    yield cb.insert(KEY, VALUE, { bucket: FIRST_BUCKET })
    yield cb.insert(KEY, VALUE, { bucket: SECOND_BUCKET })
    expect(bucketFactorySpy.callCount).to.eq(2)
    expect(bucketFactorySpy.withArgs(FIRST_BUCKET).callCount).to.eq(1)
    expect(bucketFactorySpy.withArgs(SECOND_BUCKET).callCount).to.eq(1)
  }))

  it('should call bucket factory only once', testWithBackend(function* test() {
    yield kv.insert(KEY, VALUE)
    expect(bucketFactorySpy.callCount).to.eq(1)
  }))

  it('should use default bucket for default command', testWithBackend(function* test() {
    yield kv.insert(KEY, VALUE)
    const value = yield cb.get(KEY)
    expect(value).to.not.eq(null)
  }))

  it('should use specified bucket', testWithBackend(function* test() {
    yield cb.insert(KEY, { msg: 'conflict if in the same bucket' }, { bucket: FIRST_BUCKET })
    yield kv.insert(KEY, VALUE)
    const value = yield cb.get(KEY, { bucket: null })
    expect(value).to.deep.eq(VALUE)
  }))
})
