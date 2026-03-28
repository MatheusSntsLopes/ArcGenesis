export type StoreNft = {
  key: string;
  rarity: string;
  title: string;
  price: number;
  image: string;
  message: string;
  accent: string;
};

export const STORE_NFTS: StoreNft[] = [
  {
    key: "common-seed-node",
    rarity: "COMMON",
    title: "Seed Node",
    price: 10,
    image: "/nfts/common.png",
    message: "The first spark of the network.",
    accent: "#58d4ff",
  },
  {
    key: "uncommon-pulse-unit",
    rarity: "UNCOMMON",
    title: "Pulse Unit",
    price: 20,
    image: "/nfts/uncommon.png",
    message: "A stronger pulse for the next layer.",
    accent: "#3ec1ff",
  },
  {
    key: "rare-cognition-core",
    rarity: "RARE",
    title: "Cognition Core",
    price: 30,
    image: "/nfts/rare.png",
    message: "Where signal becomes intelligence.",
    accent: "#7f8cff",
  },
  {
    key: "epic-neural-architect",
    rarity: "EPIC",
    title: "Neural Architect",
    price: 40,
    image: "/nfts/epic.png",
    message: "A rare architecture forged in the Arc.",
    accent: "#b46cff",
  },
  {
    key: "legendary-ascended-intelligence",
    rarity: "LEGENDARY",
    title: "Ascended Intelligence",
    price: 50,
    image: "/nfts/legendary.png",
    message: "The highest tier of synthetic light.",
    accent: "#ffbc4a",
  },
];
