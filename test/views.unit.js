import Context from 'borders'
import { insert } from 'borders-key-value'
import { expect } from 'chai'
import streamToArray from 'stream-to-array'
import { KeyValueBackend, UpsertViewsBackend } from '../src/backends'
import testBucketFactory from '../src/mock-bucket-factory'
import { queryViewAsArray, queryViewAsAsyncIterator, queryViewAsStream } from '../src/view'
import useViewFile from '../src/view-file-command'

describe('data-access-server/couchbase', () => {
  describe('views', () => {
    let borderContext

    beforeEach(async () => {
      const bucket = testBucketFactory()()
      borderContext = new Context()
        .use(new KeyValueBackend(bucket))
        .use(new UpsertViewsBackend(bucket))
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
