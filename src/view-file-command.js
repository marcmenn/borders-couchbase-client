import commandWithStackFrame from 'borders/command-with-stackframe'

export const TYPE = 'KV_COUCHBASE_VIEW_LOAD'

export default commandWithStackFrame((name, srcFile) => ({
  type: TYPE,
  payload: { name, srcFile },
}))
