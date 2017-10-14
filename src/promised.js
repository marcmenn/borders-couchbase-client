import promisify from 'thenify'

export default (bucket, ...commands) => {
  const result = {}
  for (const command of commands) {
    result[command] = promisify(bucket[command]).bind(bucket)
  }
  return result
}
