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
import promisify from 'thenify'
import { getCommands } from 'borders/backends'

export default class CouchbaseBucketKeyValueBackend {
  constructor(bucket) {
    this._bucket = bucket
    this._casCache = {}
    this._fnCache = {}
  }

  _promised(name) {
    if (!this._fnCache[name]) {
      this._fnCache[name] = promisify(this._bucket[name].bind(this._bucket))
    }
    return this._fnCache[name]
  }

  _modOptions(key, expiry) {
    return (this._casCache[key]
      ? { cas: this._casCache[key], expiry }
      : { expiry })
  }

  _updateCas(key, value) {
    const { cas } = value
    this._casCache[key] = cas
    return value
  }

  async [GET]({ key, expiry }) {
    const getAndTouch = this._promised('getAndTouch')
    const get = this._promised('get')
    const call = async () => (expiry ? getAndTouch(key, expiry) : get(key))

    try {
      const { value } = this._updateCas(key, await call())
      return value
    } catch (e) {
      if (e.code === cbErrors.keyNotFound) {
        throw new KeyNotFoundError(key)
      }
      throw e
    }
  }

  async [REMOVE]({ key }) {
    const remove = this._promised('remove')
    try {
      this._updateCas(key, await remove(key, this._modOptions(key)))
    } catch (e) {
      if (e.code === cbErrors.keyNotFound) {
        return
      }
      if (e.code === cbErrors.keyAlreadyExists) {
        throw new KeyAlreadyExistsError(key)
      }
      throw e
    }
  }

  async [UPSERT]({ key, value, expiry }) {
    const upsert = this._promised('upsert')
    try {
      this._updateCas(key, await upsert(key, value, this._modOptions(key, expiry)))
    } catch (e) {
      if (e.code === cbErrors.keyAlreadyExists) {
        throw new KeyAlreadyExistsError(key)
      }
      throw e
    }
  }

  async [REPLACE]({ key, value, expiry }) {
    const replace = this._promised('replace')
    try {
      this._updateCas(key, await replace(key, value, this._modOptions(key, expiry)))
    } catch (e) {
      if (e.code === cbErrors.keyNotFound) {
        throw new KeyNotFoundError(key)
      }
      if (e.code === cbErrors.keyAlreadyExists) {
        throw new KeyAlreadyExistsError(key)
      }
      throw e
    }
  }

  async [INSERT]({ key, value, expiry }) {
    const insert = this._promised('insert')
    try {
      this._updateCas(key, await insert(key, value, { expiry }))
    } catch (e) {
      if (e.code === cbErrors.keyAlreadyExists) {
        throw new KeyAlreadyExistsError(key)
      }
      throw e
    }
  }
}

export const SUPPORTED_COMMANDS = getCommands(new CouchbaseBucketKeyValueBackend())
