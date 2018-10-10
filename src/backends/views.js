import streamToArray from 'stream-to-array'
import streamToIterator from '../stream-to-iterator'
import { build as buildViewQuery } from '../views/build-view-query'

import query2stream from '../query2stream'
import { VIEW_AS_ARRAY, VIEW_AS_ASYNC_ITERATOR, VIEW_AS_STREAM } from '../view'

export const SUPPORTED_COMMANDS = [VIEW_AS_ARRAY, VIEW_AS_ASYNC_ITERATOR, VIEW_AS_STREAM]

export default (bucket) => {
  const queryViewAsStream = ({ ddoc, name, options }) => {
    const viewQuery = buildViewQuery(ddoc, name, options)

    // TODO remove this if Couchbase Mock supports postoptions.keys, introduced in https://github.com/couchbase/couchnode/commit/29bb706153b5cc6d7d678593158482b9c222a08f#diff-49c769c648cc38fea2382da923d00027
    if (bucket.lcbVersion === '0.0.0' && viewQuery.postoptions && viewQuery.postoptions.keys && !viewQuery.options.keys) {
      viewQuery.options.keys = JSON.stringify(viewQuery.postoptions.keys)
    }
    const query = bucket.query(viewQuery)
    return query2stream(query)
  }

  const queryViewAsAsyncIterator = async (payload) => {
    const resultStream = queryViewAsStream(payload)
    return streamToIterator(resultStream)
  }

  const queryViewAsArray = async (payload) => {
    const resultStream = queryViewAsStream(payload)
    return streamToArray(resultStream)
  }

  return {
    [VIEW_AS_STREAM]: queryViewAsStream,
    [VIEW_AS_ASYNC_ITERATOR]: queryViewAsAsyncIterator,
    [VIEW_AS_ARRAY]: queryViewAsArray,
  }
}
