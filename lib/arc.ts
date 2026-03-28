export const ARC_NETWORK = {
  chainIdHex: "0x4cef52",
  chainIdDec: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002),
  chainName: process.env.NEXT_PUBLIC_ARC_NETWORK_NAME || "Arc Testnet",
  rpcUrls: [process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"],
  blockExplorerUrls: [
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app",
  ],
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
};

export const ARC_EXPLORER =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app";
