import assert from 'assert'
import * as kv from 'borders-key-value'

const supported = { expiry: true, bucket: true }

const assertValid = (options) => {
  Object.keys(options).forEach(option => assert(supported[option], `option '${option}' not supported`))
}

// we're intentionally modifying payload, since we're calling borders-key-value commands,
// which creates fresh command objects
function addOptions(bordersCommand, options = {}) {
  assertValid(options)
  const { payload } = bordersCommand
  const { expiry, bucket } = options
  if (expiry) payload.expiry = expiry
  if (bucket) payload.bucket = bucket
  return bordersCommand
}

export const get = (key, options) => addOptions(kv.get(key), options)
export const remove = (key, options) => addOptions(kv.remove(key), options)
export const replace = (key, value, options) => addOptions(kv.replace(key, value), options)
export const upsert = (key, value, options) => addOptions(kv.upsert(key, value), options)
export const insert = (key, value, options) => addOptions(kv.insert(key, value), options)
