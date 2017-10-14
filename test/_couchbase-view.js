/* eslint-disable no-undef */
module.exports = {
  test: {
    map(doc, meta) {
      emit(meta.id, doc)
    },
  },
}
