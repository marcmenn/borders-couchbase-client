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

export const SUPPORTED_COMMANDS = [GET, REMOVE, UPSERT, REPLACE, INSERT]

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
  }
}
