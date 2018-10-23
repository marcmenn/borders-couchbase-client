export default (defaultBucket = 'default') => payload =>
  (payload && payload.bucket) || defaultBucket
