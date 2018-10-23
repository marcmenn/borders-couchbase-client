import { getCommands } from 'borders/backends'
import streamToArray from 'stream-to-array'
import streamToIterator from '../stream-to-iterator'
import { build as buildViewQuery } from '../views/build-view-query'

import query2stream from '../query2stream'
import { VIEW_AS_ARRAY, VIEW_AS_ASYNC_ITERATOR, VIEW_AS_STREAM } from '../view'

export default class CouchbaseViewsBackend {
  constructor(bucket) {
    this._bucket = bucket
  }

  [VIEW_AS_STREAM]({ ddoc, name, options }) {
    const viewQuery = buildViewQuery(ddoc, name, options)

    // TODO remove this if Couchbase Mock supports postoptions.keys, introduced in https://github.com/couchbase/couchnode/commit/29bb706153b5cc6d7d678593158482b9c222a08f#diff-49c769c648cc38fea2382da923d00027
    if (this._bucket.lcbVersion === '0.0.0' && viewQuery.postoptions && viewQuery.postoptions.keys && !viewQuery.options.keys) {
      viewQuery.options.keys = JSON.stringify(viewQuery.postoptions.keys)
    }
    const query = this._bucket.query(viewQuery)
    return query2stream(query)
  }

  async [VIEW_AS_ASYNC_ITERATOR](payload) {
    const resultStream = this[VIEW_AS_STREAM](payload)
    return streamToIterator(resultStream)
  }

  async [VIEW_AS_ARRAY](payload) {
    const resultStream = this[VIEW_AS_STREAM](payload)
    return streamToArray(resultStream)
  }
}

export const SUPPORTED_COMMANDS = getCommands(new CouchbaseViewsBackend())

export const createBackendFromPool = pool => backend => new CouchbaseViewsBackend(pool.get(backend))
