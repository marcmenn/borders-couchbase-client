import { Mock } from 'couchbase'

export default () => {
  const cluster = new Mock.Cluster()
  return name => cluster.openBucket(name || 'default', 'password')
}
