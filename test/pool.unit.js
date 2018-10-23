import { Mock } from 'couchbase'
import { expect } from 'chai'
import sinon from 'sinon'

import BucketPool from '../src/pool'

describe('pool', () => {
  const mockFactory = (() => {
    let cluster = null
    return (name) => {
      if (!cluster) {
        cluster = new Mock.Cluster()
      }
      return cluster.openBucket(name, 'pssword')
    }
  })()

  let pool
  let factorySpy

  beforeEach(() => {
    factorySpy = sinon.spy(mockFactory)
    pool = new BucketPool(factorySpy)
  })

  afterEach(() => {
    pool.clear()
  })

  describe('test cb expectation', () => {
    it('should have connected property that is initially null', () => {
      const bucket = mockFactory('test')
      expect(bucket).to.have.property('connected').that.is.equal(null)
    })

    it('should emit `connect` event and set `connected`', (cb) => {
      const bucket = mockFactory('test')
      expect(bucket).to.respondTo('on')
      bucket.on('connect', () => {
        expect(bucket).to.have.property('connected').that.is.equal(true)
        cb()
      })
    })

    it('should set connected to false when disconnecting a bucket', (cb) => {
      const bucket = mockFactory('test')
      bucket.on('connect', () => {
        bucket.disconnect()
        expect(bucket).to.have.property('connected').that.is.equal(false)
        cb()
      })
    })
  })

  it('should return a bucket', () => {
    const bucket = pool.get('default')
    expect(bucket).to.respondTo('get')
    expect(bucket).to.respondTo('upsert')
    expect(bucket).to.respondTo('replace')
  })

  it('should call factory once per bucket', () => {
    pool.get('default')
    pool.get('default')
    expect(factorySpy.callCount).to.equal(1)
    pool.get('test')
    pool.get('test')
    expect(factorySpy.callCount).to.equal(2)
  })

  it('should re-call factory if bucket was disconnected', () => {
    const bucket = pool.get('default')
    bucket.disconnect()
    pool.get('default')
    expect(factorySpy.callCount).to.equal(2)
  })

  it('should return the size of active buckets', () => {
    expect(pool.size).to.equal(0)
    const bucket = pool.get('default')
    expect(pool.size).to.equal(1)
    pool.get('test')
    expect(pool.size).to.equal(2)
    bucket.disconnect()
    expect(pool.size).to.equal(1)
  })

  it('should empty pool on clear', () => {
    pool.get('default')
    expect(pool.size).to.equal(1)
    pool.clear()
    expect(pool.size).to.equal(0)
  })

  it('should disconnect buckets on clear', () => {
    const bucket = pool.get('default')
    const disconnectSpy = sinon.spy(bucket, 'disconnect')
    expect(pool.size).to.equal(1)
    pool.clear()
    expect(pool.size).to.equal(0)
    expect(disconnectSpy.callCount).to.equal(1)
  })
})
