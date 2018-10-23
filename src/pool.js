export default class BucketPool {
  constructor(factory) {
    this._factory = factory
    this._buckets = new Map()
  }

  gc() {
    this._buckets.forEach((bucket, key) => {
      if (bucket.connected === false) {
        this._buckets.delete(key)
      }
    })
  }

  get(key) {
    this.gc()
    if (this._buckets.has(key)) {
      return this._buckets.get(key)
    }
    const bucket = this._factory(key)
    this._buckets.set(key, bucket)
    return bucket
  }

  clear() {
    this._buckets.forEach((bucket) => {
      if (bucket.connected === false) {
        return
      }
      bucket.disconnect()
    })
    this._buckets.clear()
  }
}

Object.defineProperty(BucketPool.prototype, 'size', {
  configurable: false,
  get() {
    this.gc()
    return this._buckets.size
  },
})
