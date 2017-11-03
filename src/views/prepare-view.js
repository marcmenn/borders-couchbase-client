/* eslint-disable import/no-extraneous-dependencies */
import { transformFileSync } from 'babel-core'
import _eval from 'eval'
import path from 'path'

const babelOptions = {
  presets: ['es2015'],
}

// Transform to json with sourcecode of functions
function replacer(key, value) {
  if (typeof (value) === 'function') {
    return value.toString()
  }
  return value
}

export default function (src) {
  const babelResult = transformFileSync(path.resolve(src), babelOptions)
  // Evaluate as if required
  const evalled = _eval(babelResult.code)
  // extract default export
  const views = evalled.__esModule && evalled.default && Object.keys(evalled).length === 1
    ? evalled.default
    : evalled

  return { views: JSON.parse(JSON.stringify(views, replacer)) }
}

