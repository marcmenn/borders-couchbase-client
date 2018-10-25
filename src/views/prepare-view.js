import _eval from 'eval'
import path from 'path'

const getBabel6 = () => {
  const { transformFileSync } = require('babel-core') // eslint-disable-line
  const babelOptions = {
    presets: ['env'],
  }
  return { transformFileSync, babelOptions }
}

const getBabel7 = () => {
  const { transformFileSync } = require('@babel/core') // eslint-disable-line
  const babelOptions = {
    presets: ['@babel/env'],
  }
  return { transformFileSync, babelOptions }
}

const getBabel = () => {
  try {
    return getBabel6()
  } catch (e) {
    return getBabel7()
  }
}

const { babelOptions, transformFileSync } = getBabel()

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
