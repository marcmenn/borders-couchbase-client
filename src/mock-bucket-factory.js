import { Mock } from 'couchbase'

export default name => new Mock.Cluster().openBucket(name || 'default', 'password')
