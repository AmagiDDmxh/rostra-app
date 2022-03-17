import React, { useRef, ReactNode, useState } from "react"
import {
  Button,
} from "@chakra-ui/react"
import { GetStaticProps } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { addressToScript, serializeScript, scriptToHash, rawTransactionToHash, serializeWitnessArgs } from '@nervosnetwork/ckb-sdk-utils'
import {
  Service,
  Collector,
  Aggregator,
  generateDefineCotaTx,
  generateIssuerInfoTx,
  generateMintCotaTx,
  generateClaimCotaTx,
  generateWithdrawCotaTx,
  generateTransferCotaTx,
  generateRegisterCotaTx,
  getAlwaysSuccessLock,
  Claim,
  CotaInfo,
  IssuerInfo,
  MintCotaInfo,
  TransferWithdrawal,
} from '@nervina-labs/cota-sdk'
import CKB from '@nervosnetwork/ckb-sdk-core'
import signWitnesses from '@nervosnetwork/ckb-sdk-core/lib/signWitnesses'


const TEST_PRIVATE_KEY = '0xd4537602bd78139bfde0771f43f7c007ea1bbb858507055d2ef6225d4ebec23e'
const TEST_ADDRESS = 'ckt1qyqdtuf6kx8f7664atn9xkmwc9qcv4phs4xsackhmh'
const RECEIVER_PRIVATE_KEY = '0x305fbaead56bde6f675fe0294e2126377d7025f36bf4bc1c8f840cb0e22eafef'
const RECEIVER_ADDRESS = 'ckt1qyqrvzu5yw30td23fzw5259j0l0pymj2lc9shtynac'
const OTHER_ADDRESS = 'ckt1qyqz8vxeyrv4nur4j27ktp34fmwnua9wuyqqggd748'

const secp256k1CellDep = async (ckb: CKB): Promise<CKBComponents.CellDep> => {
  const secp256k1Dep = (await ckb.loadDeps()).secp256k1Dep
  return { outPoint: secp256k1Dep?.outPoint || null, depType: 'depGroup' }
}

const service: Service = {
  collector: new Collector({
    ckbNodeUrl: 'https://ckb-testnet.rebase.network/rpc', ckbIndexerUrl: 'https://testnet.ckbapp.dev/indexer'
    // ckbNodeUrl: 'https://testnet.ckb.dev/rpc', ckbIndexerUrl: 'https://testnet.ckbapp.dev/indexer'
    // ckbNodeUrl: 'https://testnet.ckbapp.dev/rpc', ckbIndexerUrl: 'https://testnet.ckbapp.dev/indexer'
  }),
  aggregator: new Aggregator({ registryUrl: 'http://cota-registry-aggregator.rostra.xyz', cotaUrl: 'http://cota-aggregator.rostra.xyz' }),
}
const ckb = service.collector.getCkb()

let cotaId: string = '0x3c7a0ff1c0331c46b84696595eab954613fbf2f3'

const registerCota = async (address = TEST_ADDRESS, privateKey = TEST_PRIVATE_KEY) => {
  const provideCKBLock = addressToScript(address)
  const unregisteredCotaLock = addressToScript(address)
  let rawTx = await generateRegisterCotaTx(service, [unregisteredCotaLock], provideCKBLock)
  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const registryLock = getAlwaysSuccessLock(false)

  let keyMap = new Map<string, string>()
  keyMap.set(scriptToHash(registryLock), '')
  keyMap.set(scriptToHash(provideCKBLock), privateKey)

  const cells = rawTx.inputs.map((input, index) => ({
    outPoint: input.previousOutput,
    lock: index === 0 ? registryLock : provideCKBLock,
  }))

  const transactionHash = rawTransactionToHash(rawTx)

  const signedWitnesses = signWitnesses(keyMap)({
    transactionHash,
    witnesses: rawTx.witnesses,
    inputCells: cells,
    skipMissingKeys: true,
  })
  const signedTx = {
    ...rawTx,
    witnesses: signedWitnesses.map(witness => (typeof witness === 'string' ? witness : serializeWitnessArgs(witness))),
  }
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.log(`Register cota cell tx has been sent with tx hash ${txHash}`)
}

const defineNFT = async () => {
  const defineLock = addressToScript(TEST_ADDRESS)

  const cotaInfo: CotaInfo = {
    name: "Rostra launched",
    description: "Rostra launched, new age comes",
    image: "https://i.loli.net/2021/04/29/qyJNSE4iHAas7GL.png",
  }

  let { rawTx, cotaId: cId } = await generateDefineCotaTx(service, defineLock, 100, '0x00', cotaInfo)
  cotaId = cId
  console.log(` ======> cotaId: ${cotaId}`)
  let secp256k1Dep = await secp256k1CellDep(ckb)
  console.log(' ===================== secp256k1Dep ===================== ')
  rawTx.cellDeps.push(secp256k1Dep)
  try {
    const signedTx = ckb.signTransaction(TEST_PRIVATE_KEY)(rawTx)
    console.log('signedTx: ', JSON.stringify(signedTx))
    let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
    console.info(`Define cota nft tx has been sent with tx hash ${txHash}`)
  } catch (error) {
    console.error('error happened:', error)
  }
}

const setIssuer = async () => {
  console.log(` ======> cotaId: ${cotaId}`)
  const cotaLock = addressToScript(TEST_ADDRESS)

  const issuer: IssuerInfo = {
    name: "Rostra",
    description: "Community building protocol",
    avatar: "https://i.loli.net/2021/04/29/IigbpOWP8fw9qDn.png",
  }

  let rawTx = await generateIssuerInfoTx(service, cotaLock, issuer)

  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const signedTx = ckb.signTransaction(TEST_PRIVATE_KEY)(rawTx)
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Set issuer information tx has been sent with tx hash ${txHash}`)
}

const getNFTInfo = async () => {
  const aggregator = service.aggregator
  const holds = await aggregator.getHoldCotaNft({
    lockScript:
      '0x490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000dc70f33de86fdf381b4fc5bf092bb23d02774801',
    page: 0,
    pageSize: 10,
  })
  console.log('======= holds: ', JSON.stringify(holds))

  const senderLockHash = await aggregator.getCotaNftSender({
    lockScript:
      '0x490000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80114000000dc70f33de86fdf381b4fc5bf092bb23d02774801',
    cotaId,
    tokenIndex: '0x00000000',
  })
  console.log('======= senderLockHash: ', JSON.stringify(senderLockHash))
}


const mint = async () => {
  console.log(` ======> cotaId: ${cotaId}`)
  const mintLock = addressToScript(TEST_ADDRESS)

  const mintCotaInfo: MintCotaInfo = {
    cotaId,
    withdrawals: [
      {
        tokenIndex: '0x00000000', // can only increase from 0x00000000
        state: '0x00',
        characteristic: '0x0505050505050505050505050505050505050505',
        toLockScript: serializeScript(addressToScript(RECEIVER_ADDRESS)),
      },
      {
        tokenIndex: '0x00000001',
        state: '0x00',
        characteristic: '0x0505050505050505050505050505050505050505',
        toLockScript: serializeScript(addressToScript(RECEIVER_ADDRESS)),
      },
    ],
  }
  let rawTx = await generateMintCotaTx(service, mintLock, mintCotaInfo)

  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const signedTx = ckb.signTransaction(TEST_PRIVATE_KEY)(rawTx)
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Mint cota nft tx has been sent with tx hash ${txHash}`)
}

const claim = async () => {
  console.log(` ======> cotaId: ${cotaId}`)
  const claimLock = addressToScript(RECEIVER_ADDRESS)
  const withdrawLock = addressToScript(TEST_ADDRESS)

  const claims: Claim[] = [
    {
      cotaId,
      tokenIndex: '0x00000000',
    }
  ]
  let rawTx = await generateClaimCotaTx(service, claimLock, withdrawLock, claims)

  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const signedTx = ckb.signTransaction(RECEIVER_PRIVATE_KEY)(rawTx)
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Claim cota nft tx has been sent with tx hash ${txHash}`)
}

const withdraw = async () => {
  console.log(` ======> cotaId: ${cotaId}`)
  const withdrawLock = addressToScript(RECEIVER_ADDRESS)
  const toLock = addressToScript(TEST_ADDRESS)

  const withdrawals: TransferWithdrawal[] = [
    {
      cotaId,
      tokenIndex: '0x00000001',
      toLockScript: serializeScript(toLock),
    },
  ]
  let rawTx = await generateWithdrawCotaTx(service, withdrawLock, withdrawals)

  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const signedTx = ckb.signTransaction(RECEIVER_PRIVATE_KEY)(rawTx)
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Withdraw cota nft tx has been sent with tx hash ${txHash}`)
}

const transfer = async () => {
  console.log(` ======> cotaId: ${cotaId}`)
  const cotaLock = addressToScript(RECEIVER_ADDRESS)
  const withdrawLock = addressToScript(TEST_ADDRESS)

  const transfers: TransferWithdrawal[] = [
    {
      cotaId,
      tokenIndex: '0x00000001',
      toLockScript: serializeScript(addressToScript(OTHER_ADDRESS)),
    },
  ]
  let rawTx = await generateTransferCotaTx(service, cotaLock, withdrawLock, transfers)

  const secp256k1Dep = await secp256k1CellDep(ckb)
  rawTx.cellDeps.push(secp256k1Dep)

  const signedTx = ckb.signTransaction(RECEIVER_PRIVATE_KEY)(rawTx)
  console.log('signedTx: ', JSON.stringify(signedTx))
  let txHash = await ckb.rpc.sendTransaction(signedTx, 'passthrough')
  console.info(`Transfer cota nft tx has been sent with tx hash ${txHash}`)
}

export default function CreateRedPacket() {
  return (
    <>
      <Button onClick={() => registerCota(TEST_ADDRESS, TEST_PRIVATE_KEY)}> registerCota(Owner) </Button>
      <Button onClick={() => registerCota(RECEIVER_ADDRESS, RECEIVER_PRIVATE_KEY)}> registerCota(Receiver) </Button>
      <Button onClick={defineNFT}> defineNFT </Button>
      <Button onClick={setIssuer}> setIssuer </Button>
      <Button onClick={getNFTInfo}> getNFTInfo </Button>
      <Button onClick={mint}> mint </Button>
      <Button onClick={claim}> claim </Button>
      <Button onClick={withdraw}> withdraw </Button>
      <Button onClick={transfer}> transfer </Button>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ["common"])),
    },
  }
}
