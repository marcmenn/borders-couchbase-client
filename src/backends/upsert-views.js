import promisify from 'thenify'

import prepareView from '../views/prepare-view'
import { TYPE as USE_VIEW } from '../view-file-command'

export const SUPPORTED_COMMANDS = [USE_VIEW]

export default (bucket) => {
  const fnCache = {}
  const promised = (name, thisObject) => {
    if (!fnCache[name]) fnCache[name] = promisify(thisObject[name].bind(thisObject))
    return fnCache[name]
  }

  return {
    async [USE_VIEW]({ name, srcFile }) {
      const manager = bucket.manager()
      const upsertDesignDocument = promised('upsertDesignDocument', manager)
      const viewText = prepareView(srcFile)
      await upsertDesignDocument(name, viewText)
    },
  }
}
