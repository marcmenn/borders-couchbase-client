/* eslint-disable import/no-extraneous-dependencies */
// TODO: the following steps might work by extracting views directly from babel-ast?
// Load and transform view Source Document with babel
import path from 'path'
import { transformFileSync } from 'babel-core'
import _eval from 'eval'

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
  const views = evalled.default ? evalled.__esModule : evalled

  return { views: JSON.parse(JSON.stringify(views, replacer)) }
}

