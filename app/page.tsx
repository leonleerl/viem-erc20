'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits, Address } from 'viem'
import { erc20Abi } from '@/lib/erc20-abi'
import { ERC20_CONTRACT_ADDRESS } from '@/lib/config'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [mintTxHash, setMintTxHash] = useState<string | null>(null)

  // 读取总发行量
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'totalSupply',
  })

  // 读取当前账户余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // 读取合约发行方（owner）
  const { data: owner } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'owner',
  })

  // 读取当前账户的持币上限
  const { data: balanceLimit } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceLimit',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // 读取代币信息
  const { data: tokenName } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'name',
  })

  const { data: tokenSymbol } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'symbol',
  })

  const { data: decimals } = useReadContract({
    address: ERC20_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  // 转账交易
  const { writeContract: writeTransfer, data: transferHash, isPending: isTransferPending } = useWriteContract()

  // Mint 交易
  const { writeContract: writeMint, data: mintHash, isPending: isMintPending } = useWriteContract()

  // 等待转账交易确认
  const { isLoading: isTransferConfirming, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  })

  // 等待 Mint 交易确认
  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  // 监听交易哈希变化
  useEffect(() => {
    if (transferHash) {
      setTxHash(transferHash)
    }
  }, [transferHash])

  useEffect(() => {
    if (mintHash) {
      setMintTxHash(mintHash)
    }
  }, [mintHash])

  // 交易成功后刷新余额
  useEffect(() => {
    if (isTransferSuccess || isMintSuccess) {
      refetchBalance()
      refetchTotalSupply()
    }
  }, [isTransferSuccess, isMintSuccess, refetchBalance, refetchTotalSupply])

  // 处理转账
  const handleTransfer = async () => {
    if (!address || !transferTo || !transferAmount || decimals === undefined) return

    try {
      const amount = parseUnits(transferAmount, Number(decimals))
      writeTransfer({
        address: ERC20_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [transferTo as Address, amount],
      })
    } catch (error) {
      console.error('转账失败:', error)
    }
  }

  // 处理 Mint
  const handleMint = async () => {
    if (!address || !mintAmount || decimals === undefined) return

    try {
      const amount = parseUnits(mintAmount, Number(decimals))
      const maxAmount = parseUnits('10000', Number(decimals))
      
      if (amount > maxAmount) {
        alert('Mint 数量不能超过 10000 枚')
        return
      }

      writeMint({
        address: ERC20_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'mint',
        args: [address, amount],
      })
    } catch (error) {
      console.error('Mint 失败:', error)
    }
  }

  const formatBalance = (value: bigint | unknown, decimals: number | bigint | unknown) => {
    if (!value || decimals === undefined || typeof value !== 'bigint') return '0'
    return formatUnits(value, Number(decimals))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              ERC20 Token 管理器
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              合约地址: <span className="font-mono text-sm">{ERC20_CONTRACT_ADDRESS}</span>
            </p>
          </div>

          {/* 连接钱包按钮 */}
          <div className="mb-8">
            <w3m-button />
          </div>

          {isConnected && address && (
            <>
              {/* 账户信息 */}
              <div className="mb-8 p-6 bg-blue-50 dark:bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">账户信息</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  地址: <span className="font-mono">{address}</span>
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  余额: {formatBalance(balance, decimals)} {String(tokenSymbol || 'TOKEN')}
                </p>
              </div>

              {/* 合约信息 */}
              <div className="mb-8 p-6 bg-green-50 dark:bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">合约信息</h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">代币名称:</span> {(tokenName as string) || '加载中...'}
                  </p>
                  <p>
                    <span className="font-semibold">代币符号:</span> {(tokenSymbol as string) || '加载中...'}
                  </p>
                  <p>
                    <span className="font-semibold">发行方:</span>{' '}
                    <span className="font-mono">{owner ? (owner as string) : '加载中...'}</span>
                  </p>
                  <p>
                    <span className="font-semibold">总发行量:</span>{' '}
                    {formatBalance(totalSupply, decimals)} {(tokenSymbol as string) || 'TOKEN'}
                  </p>
                  <p>
                    <span className="font-semibold">您的持币上限:</span>{' '}
                    {balanceLimit ? formatBalance(balanceLimit, decimals) : '无限制'} {(tokenSymbol as string) || 'TOKEN'}
                  </p>
                </div>
              </div>

              {/* 转账功能 */}
              <div className="mb-8 p-6 bg-purple-50 dark:bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">转账</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      接收地址
                    </label>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      转账数量
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                      step="0.000001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferPending || isTransferConfirming || !transferTo || !transferAmount}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTransferPending || isTransferConfirming ? '处理中...' : '转账'}
                  </button>
                  {txHash && (
                    <div className="mt-2 text-sm">
                      <p className="text-green-600 dark:text-green-400">
                        交易哈希: <span className="font-mono">{txHash}</span>
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        在区块链浏览器查看 →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Mint 功能 */}
              <div className="mb-8 p-6 bg-orange-50 dark:bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Mint Token（最多 10,000 枚）
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Mint 数量
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="0"
                      step="0.000001"
                      max="10000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      最多可 Mint 10,000 枚
                    </p>
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={isMintPending || isMintConfirming || !mintAmount}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isMintPending || isMintConfirming ? '处理中...' : 'Mint Token'}
                  </button>
                  {mintTxHash && (
                    <div className="mt-2 text-sm">
                      <p className="text-green-600 dark:text-green-400">
                        Mint 交易哈希: <span className="font-mono">{mintTxHash}</span>
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        在区块链浏览器查看 →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 刷新余额按钮 */}
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => {
                    refetchBalance()
                    refetchTotalSupply()
                  }}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  刷新余额和总发行量
                </button>
              </div>
            </>
          )}

          {!isConnected && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                请先连接钱包以使用所有功能
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
