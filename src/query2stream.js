import through2 from 'through2'

export default (query) => {
  const stream = through2.obj()

  query.on('error', (error) => {
    stream.emit('error', error)
  })
  query.on('row', (row) => {
    stream.push(row)
  })
  query.on('end', () => {
    stream.push(null)
  })
  return stream
}
