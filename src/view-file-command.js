export const TYPE = 'KV_COUCHBASE_VIEW_LOAD'

export default (name, srcFile) => ({
  type: TYPE,
  payload: { name, srcFile },
})
