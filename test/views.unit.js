import Context from 'borders'
import { expect } from 'chai'
import { insert } from 'borders-key-value'
import streamToArray from 'stream-to-array'
import { queryViewAsStream, queryViewAsArray, queryViewAsAsyncIterator } from '../src/view'
import testBucketFactory from '../src/mock-bucket-factory'
import createBackend from '../src/multi-bucket'
import useViewFile from '../src/view-file-command'

describe('data-access-server/couchbase', () => {
  describe('views', () => {
    let borderContext

    beforeEach(async () => {
      const backend = createBackend(testBucketFactory)
      borderContext = new Context().use(backend)
      await borderContext.execute(function* _loadView() {
        yield useViewFile('test', 'test/_couchbase-view.js')
      }())
    })

    describe('queryViewAsStream command', () => {
      it('should receive data from view', async () => {
        // views are eventual consistent, so this might work only with memory mock of couchbase
        await borderContext.execute(async function* test() {
          yield insert('a', { name: 'A' })
          yield insert('b', { name: 'B' })

          const resultStream = yield queryViewAsStream('test', 'test')
          const resultRows = await streamToArray(resultStream)

          expect(resultRows).to.deep.have.members([
            {
              id: 'a',
              key: 'a',
              value: {
                name: 'A',
              },
            },
            {
              id: 'b',
              key: 'b',
              value: {
                name: 'B',
              },
            },
          ])
        }())
      })
    })

    describe('queryViewAsArray command', () => {
      it('should receive data from view', async () => {
        // views are eventual consistent, so this might work only with memory mock of couchbase
        await borderContext.execute(async function* test() {
          yield insert('a', { name: 'A' })
          yield insert('b', { name: 'B' })

          const resultRows = yield queryViewAsArray('test', 'test')

          expect(resultRows).to.deep.have.members([
            {
              id: 'a',
              key: 'a',
              value: {
                name: 'A',
              },
            },
            {
              id: 'b',
              key: 'b',
              value: {
                name: 'B',
              },
            },
          ])
        }())
      })
    })

    describe('queryViewAsAsyncIterator command', () => {
      it('should receive data from view', async () => {
        // views are eventual consistent, so this might work only with memory mock of couchbase
        await borderContext.execute(async function* test() {
          yield insert('a', { name: 'A' })
          yield insert('b', { name: 'B' })

          const resultIterator = yield queryViewAsAsyncIterator('test', 'test')
          const resultRows = []

          for await (const row of resultIterator) {
            resultRows.push(row)
          }

          expect(resultRows).to.deep.have.members([
            {
              id: 'a',
              key: 'a',
              value: {
                name: 'A',
              },
            },
            {
              id: 'b',
              key: 'b',
              value: {
                name: 'B',
              },
            },
          ])
        }())
      })
    })
  })
})
