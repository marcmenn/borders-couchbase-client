import {
  GET,
  INSERT,
  KeyAlreadyExistsError,
  KeyNotFoundError,
  REMOVE,
  REPLACE,
  UPSERT,
} from 'borders-key-value'
import { errors as cbErrors } from 'couchbase'
import streamToArray from 'stream-to-array'
import streamToIterator from 'stream-to-iterator'
import promisify from 'thenify'
import { build as buildViewQuery } from './views/build-view-query'

import prepareView from './views/prepare-view'
import { TYPE as GET_BUCKET } from './get-bucket-command'
import query2stream from './query2stream'
import { VIEW_AS_ARRAY, VIEW_AS_ASYNC_ITERATOR, VIEW_AS_STREAM } from './view'
import { TYPE as USE_VIEW } from './view-file-command'

export const SUPPORTED_COMMANDS = [GET, REMOVE, UPSERT, REPLACE, INSERT, GET_BUCKET,
  USE_VIEW, VIEW_AS_ARRAY, VIEW_AS_ASYNC_ITERATOR, VIEW_AS_STREAM]

export default (bucket) => {
  const casCache = {}
  const fnCache = {}
  const promised = (name, thisObject) => {
    if (!fnCache[name]) fnCache[name] = promisify(thisObject[name].bind(thisObject))
    return fnCache[name]
  }
  const modOptions = (key, expiry) => (casCache[key]
    ? { cas: casCache[key], expiry }
    : { expiry })
  const updateCas = (key, value) => {
    const { cas } = value
    casCache[key] = cas
    return value
  }

  const queryViewAsStream = ({ ddoc, name, options }) => {
    const query = bucket.query(buildViewQuery(ddoc, name, options))
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
    async [GET]({ key, expiry }) {
      const getAndTouch = promised('getAndTouch', bucket)
      const get = promised('get', bucket)
      const call = async () => (expiry ? getAndTouch(key, expiry) : get(key))

      try {
        const { value } = updateCas(key, await call())
        return value
      } catch (e) {
        if (e.code === cbErrors.keyNotFound) {
          throw new KeyNotFoundError(key)
        }
        throw e
      }
    },

    async [REMOVE]({ key }) {
      const remove = promised('remove', bucket)
      try {
        updateCas(key, await remove(key, modOptions(key)))
      } catch (e) {
        if (e.code === cbErrors.keyNotFound) {
          return
        }
        if (e.code === cbErrors.keyAlreadyExists) {
          throw new KeyAlreadyExistsError(key)
        }
        throw e
      }
    },

    async [UPSERT]({ key, value, expiry }) {
      const upsert = promised('upsert', bucket)
      try {
        updateCas(key, await upsert(key, value, modOptions(key, expiry)))
      } catch (e) {
        if (e.code === cbErrors.keyAlreadyExists) {
          throw new KeyAlreadyExistsError(key)
        }
        throw e
      }
    },

    async [REPLACE]({ key, value, expiry }) {
      const replace = promised('replace', bucket)
      try {
        updateCas(key, await replace(key, value, modOptions(key, expiry)))
      } catch (e) {
        if (e.code === cbErrors.keyNotFound) {
          throw new KeyNotFoundError(key)
        }
        if (e.code === cbErrors.keyAlreadyExists) {
          throw new KeyAlreadyExistsError(key)
        }
        throw e
      }
    },

    async [INSERT]({ key, value, expiry }) {
      const insert = promised('insert', bucket)
      try {
        updateCas(key, await insert(key, value, { expiry }))
      } catch (e) {
        if (e.code === cbErrors.keyAlreadyExists) {
          throw new KeyAlreadyExistsError(key)
        }
        throw e
      }
    },

    [GET_BUCKET]() {
      return bucket
    },

    async [USE_VIEW]({ name, srcFile }) {
      const manager = bucket.manager()
      const upsertDesignDocument = promised('upsertDesignDocument', manager)
      const viewText = prepareView(srcFile)
      await upsertDesignDocument(name, viewText)
    },
    [VIEW_AS_STREAM]: queryViewAsStream,
    [VIEW_AS_ASYNC_ITERATOR]: queryViewAsAsyncIterator,
    [VIEW_AS_ARRAY]: queryViewAsArray,
  }
}
