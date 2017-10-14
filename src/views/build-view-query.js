/* eslint-disable
 no-param-reassign,
 no-prototype-builtins,
 */
import { ViewQuery } from 'couchbase'

function _slice(object, ...keys) {
  let result = null
  for (const k of keys) {
    if (object.hasOwnProperty(k)) {
      if (result == null) {
        result = {}
      }
      result[k] = object[k]
      delete object[k]
    }
  }
  return result
}

// eslint-disable-next-line import/prefer-default-export
export function build(ddoc, name, opts) {
  const query = ViewQuery.from(ddoc, name)
  if (opts != null) {
    const _single = (optionKey) => {
      const optionValue = _slice(opts, optionKey)
      if (optionValue == null) {
        return
      }
      query[optionKey](optionValue[optionKey])
    }

    const range = _slice(opts, 'startkey', 'endkey', 'inclusive_end')
    if (range != null) {
      query.range(range.startkey, range.endkey, !!range.inclusive_end)
    }

    _single('reduce')
    _single('limit')
    _single('skip')

    // TODO One CANNOT specify group AND group_level, so let group win for now
    if (opts.hasOwnProperty('group')) {
      delete opts.group_level
    }

    _single('group')

    if (opts.hasOwnProperty('group_level')) {
      query.group_level(opts.group_level)
      delete opts.group_level
    }

    if (opts.hasOwnProperty('stale')) {
      const { stale } = opts
      if (stale === false || stale === 'false') {
        query.stale(ViewQuery.Update.BEFORE)
      } else if (stale === 'update_after') {
        query.stale(ViewQuery.Update.AFTER)
      } else {
        throw new Error(`Unknown stale option: ${stale}`)
      }
      delete opts.stale
    }

    if (opts.hasOwnProperty('key')) {
      query.keys([opts.key])
      delete opts.key
    } else if (opts.hasOwnProperty('keys')) {
      query.keys(opts.keys)
      delete opts.keys
    }

    if (opts.hasOwnProperty('descending')) {
      query.order(opts.descending ? ViewQuery.Order.DESCENDING : ViewQuery.Order.ASCENDING)
      delete opts.descending
    }

    if (Object.keys(opts).length > 0) {
      throw new Error(`Unknown options: ${JSON.stringify(opts)}`)
    }
  }

  return query
}
