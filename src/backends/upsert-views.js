import { getCommands } from 'borders/lib/backends'
import promisify from 'thenify'

import prepareView from '../views/prepare-view'
import { TYPE as USE_VIEW } from '../view-file-command'
import CouchbaseViewsBackend from './views'

export default class CouchbaseUpsertViewsBackend extends CouchbaseViewsBackend {
  constructor(bucket) {
    super(bucket)
    this._fnCache = {}
  }

  _promised(name, thisObject = this._bucket) {
    if (!this._fnCache[name]) {
      this._fnCache[name] = promisify(thisObject[name].bind(thisObject))
    }
    return this._fnCache[name]
  }

  async [USE_VIEW]({ name, srcFile }) {
    const manager = this._bucket.manager()
    const upsertDesignDocument = this._promised('upsertDesignDocument', manager)
    const viewText = prepareView(srcFile)
    await upsertDesignDocument(name, viewText)
  }
}

export const SUPPORTED_COMMANDS = getCommands(new CouchbaseUpsertViewsBackend())

export const createBackendFromPool = pool => backend => new CouchbaseUpsertViewsBackend(pool.get(backend))
