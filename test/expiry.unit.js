import * as kv from 'borders-key-value'
import Context from 'borders'
import { Mock } from 'couchbase'
import chai from 'chai'
import sinon from 'sinon'
import backend from '../src/backend'
import * as cb from '../src/commands'

const { expect } = chai

const VALUE = {}

const GETANDTOUCH_EXPIRY = 1
const INSERT_OPTIONS = 2
const UPSERT_OPTIONS = 2
const REPLACE_OPTIONS = 2

describe('expiry', () => {
  let sandbox
  let bucket
  let insertSpy
  let getSpy
  let getAndTouchSpy
  let replaceSpy
  let upsertSpy

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    bucket = new Mock.Cluster().openBucket('name', 'password')
    insertSpy = sandbox.spy(bucket, 'insert')
    replaceSpy = sandbox.spy(bucket, 'replace')
    upsertSpy = sandbox.spy(bucket, 'upsert')
    getSpy = sandbox.spy(bucket, 'get')
    getAndTouchSpy = sandbox.spy(bucket, 'getAndTouch')
  })

  afterEach(() => sandbox.restore())

  const testWithBackend = test => async () => {
    const context = new Context().use(backend(bucket))
    await context.execute(test())
  }

  describe('commands with expiry', () => {
    const expiry = 1

    it('should pass expiry on insert', testWithBackend(function* test() {
      yield cb.insert('key', VALUE, { expiry })
      expect(insertSpy.firstCall.args[INSERT_OPTIONS]).to.include({ expiry })
    }))

    it('should use plain get on get without expiry', testWithBackend(function* test() {
      yield cb.insert('key', VALUE)
      yield cb.get('key')
      expect(getSpy.callCount).to.eq(1)
    }))

    it('should pass expiry on get to getAndTouch', testWithBackend(function* test() {
      yield cb.insert('key', VALUE)
      yield cb.get('key', { expiry })
      expect(getAndTouchSpy.firstCall.args[GETANDTOUCH_EXPIRY]).to.eq(expiry)
    }))

    it('should pass expiry on upsert', testWithBackend(function* test() {
      yield cb.upsert('key', VALUE, { expiry })
      expect(upsertSpy.firstCall.args[UPSERT_OPTIONS]).to.include({ expiry })
    }))

    it('should pass expiry on replace', testWithBackend(function* test() {
      yield cb.insert('key', VALUE)
      yield cb.replace('key', VALUE, { expiry })
      expect(replaceSpy.firstCall.args[REPLACE_OPTIONS]).to.include({ expiry })
    }))
  })

  describe('plain border key value', () => {
    const expiry = undefined

    it('should not pass expiry on insert', testWithBackend(function* test() {
      yield kv.insert('key', VALUE)
      expect(insertSpy.firstCall.args[INSERT_OPTIONS]).to.include({ expiry })
    }))

    it('should not pass expiry on get to getAndTouch', testWithBackend(function* test() {
      yield kv.insert('key', VALUE)
      yield kv.get('key')
      expect(getAndTouchSpy.callCount).to.eq(0)
    }))

    it('should not pass expiry on upsert', testWithBackend(function* test() {
      yield kv.upsert('key', VALUE)
      expect(upsertSpy.firstCall.args[UPSERT_OPTIONS]).to.include({ expiry })
    }))

    it('should not pass expiry on replace', testWithBackend(function* test() {
      yield kv.insert('key', VALUE)
      yield kv.replace('key', VALUE)
      expect(replaceSpy.firstCall.args[REPLACE_OPTIONS]).to.include({ expiry })
    }))
  })
})
