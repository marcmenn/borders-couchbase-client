/* eslint-disable no-undef,import/prefer-default-export */
export const test = {
  map(doc, meta) {
    emit(meta.id, doc)
  },
}
