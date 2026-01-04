import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// 获取项目 ID，如果没有设置环境变量，使用默认值
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// 创建查询客户端
export const queryClient = new QueryClient()

// 创建 Wagmi 适配器
const metadata = {
  name: 'ERC20 Token Manager',
  description: 'ERC20 Token 管理应用',
  url: 'https://example.com',
  icons: ['https://example.com/icon.png']
}

// 配置支持的网络
const networks = [mainnet, sepolia]

// 创建 Wagmi 适配器实例
const wagmiAdapter = new WagmiAdapter({ networks: networks as any, projectId })

// 创建 AppKit
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
})

// 导出 wagmi 配置
export const wagmiConfig = wagmiAdapter.wagmiConfig

// ERC20 合约地址
export const ERC20_CONTRACT_ADDRESS = '0xa7d726B7F1085F943056C2fB91abE0204eC6d6DA' as const

