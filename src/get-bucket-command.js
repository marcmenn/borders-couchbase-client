import commandWithStackFrame from 'borders/command-with-stackframe'

export const TYPE = 'GET_BUCKET'

export default commandWithStackFrame(() => ({ type: TYPE }))
