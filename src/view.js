export const VIEW_AS_STREAM = 'KV_COUCHBASE_VIEW_AS_STREAM'
export const VIEW_AS_ASYNC_ITERATOR = 'KV_COUCHBASE_VIEW_AS_ASYNC_ITERATOR'
export const VIEW_AS_ARRAY = 'KV_COUCHBASE_VIEW_AS_ARRAY'

const queryView = type => (ddoc, name, options = {}) => ({
  type,
  payload: {
    ddoc,
    name,
    options,
  },
})

export const queryViewAsStream = queryView(VIEW_AS_STREAM)
export const queryViewAsAsyncIterator = queryView(VIEW_AS_ASYNC_ITERATOR)
export const queryViewAsArray = queryView(VIEW_AS_ARRAY)

export const key = row => row.key
export const id = row => row.id
export const value = row => row.value
