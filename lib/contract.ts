import { Contract } from "ethers";

export const GIFTARC_ABI = [
  "event GiftMinted(address indexed minter,uint256 indexed tokenId,string rarity,uint256 visualAmount,string designName)",
  "function mintFee() view returns (uint256)",
  "function mintGift(string rarity,uint256 visualAmount,string designName,string imageURI,string message) payable returns (uint256)",
  "function tokensOf(address owner) view returns (uint256[] memory)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function gifts(uint256 tokenId) view returns (string rarity, uint256 visualAmount, string designName, string message, uint256 mintedAt)"
] as const;

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GIFTARC_CONTRACT ||
  "0x92Bd737bA6b7401c79bF9DD79991E4ABe27ddc85";

export function getGiftArcContract(runner: any) {
  return new Contract(CONTRACT_ADDRESS, GIFTARC_ABI, runner);
}

export type OwnedNft = {
  tokenId: number;
  name: string;
  rarity: string;
  amount: number;
  image: string;
  message: string;
};
