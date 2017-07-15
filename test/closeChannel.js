// cook mango twist then skin sort option civil have still rather guilt

const test = require('blue-tape')
const p = require('util').promisify

const {
  ACCT_0_PRIVKEY,
  ACCT_0_ADDR,
  ACCT_1_PRIVKEY,
  ACCT_1_ADDR,
} = require('./constants.js')

const {
  filterLogs,
  takeSnapshot,
  revertSnapshot,
  solSha3,
  sign,
  mineBlocks,
  createChannel,
  updateState,
  endChannel,
  toSolUint256,
  toSolInt256,
} = require('./utils.js')

module.exports = async (test, instance) => {
  test('closeChannel happy path no hashlocks', async t => {
    const snapshot = await takeSnapshot()
    const eventLog = instance.allEvents()

    const channelId = '0x1000000000000000000000000000000000000000000000000000000000000000'

    await createChannel(
      instance,
      channelId,
      6, 6,
      2
    )

    await updateState(
      instance,
      channelId,
      1,
      5, 7,
      '0x'
    )

    await endChannel(
      instance,
      channelId
    )

    await mineBlocks(5)

    await instance.closeChannel(
      channelId
    )

    t.equal((await instance.balanceOf(ACCT_0_ADDR)).toString(), '11')
    t.equal((await instance.balanceOf(ACCT_1_ADDR)).toString(), '13')

    const logs = await p(eventLog.get.bind(eventLog))()
    console.log('logs', filterLogs(logs).map(log => log[1].num.toString()))
    eventLog.stopWatching()

    await revertSnapshot(snapshot)
  })

  // test.only('try getting a hashlock across', async t => {
  //   const snapshot = await takeSnapshot()
  //   const eventLog = instance.allEvents()
  //   const hashlocks = `0x${solSha3('derp').slice(2)}${toSolInt256(-13)}${solSha3('derp').slice(2)}${toSolInt256(14)}`

  //   console.log('HASLOCK', hashlocks)

  //   await instance.getHashlockAdjustment(hashlocks)

  //   let logs = await p(eventLog.get.bind(eventLog))()
    
  //   console.log('logs', filterLogs(logs).map(log => {
  //     return Object.entries(log[1]).reduce((acc, [key, val]) => {
  //       acc[key] = val.toString()

  //       return acc
  //     })
  //   }))

  //   eventLog.stopWatching()

  //   await revertSnapshot(snapshot)
  // })

  test.only('closeChannel happy path with hashlocks', async t => {
    const snapshot = await takeSnapshot()
    const eventLog = instance.allEvents()

    const channelId = '0x1000000000000000000000000000000000000000000000000000000000000000'
    const preimage1 = '0x2000000000000000000000000000000000000000000000000000000000000000'
    const preimage2 = '0x3000000000000000000000000000000000000000000000000000000000000000'

    await createChannel(
      instance,
      channelId,
      6, 6,
      2
    )

    await updateState(
      instance,
      channelId,
      1,
      5, 7,
      `0x${solSha3(preimage1).slice(2)}${toSolInt256(-14)}${solSha3(preimage2).slice(2)}${toSolInt256(13)}`
    )

    await endChannel(
      instance,
      channelId
    )

    await instance.submitPreimage(solSha3(preimage1), preimage1)
    await instance.submitPreimage(solSha3(preimage2), preimage2)

    await mineBlocks(5)

    await instance.closeChannel(
      channelId
    )

    t.equal((await instance.balanceOf(ACCT_0_ADDR)).toString(), '10')
    t.equal((await instance.balanceOf(ACCT_1_ADDR)).toString(), '14')

    const logs = await p(eventLog.get.bind(eventLog))()
    console.log('logs', filterLogs(logs).map(log => {
      return Object.entries(log[1]).reduce((acc, [key, val]) => {
        acc[key] = val.toString()

        return acc
      })
    }))
    eventLog.stopWatching()

    await revertSnapshot(snapshot)
  })
}
