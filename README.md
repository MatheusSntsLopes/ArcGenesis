# ArcGenesis

ArcGenesis is an Arc-native NFT faucet-style dashboard.

## Features

- Connect MetaMask / Rabby
- Switch to Arc Testnet automatically
- Show connected wallet and native balance
- Disconnect button
- Show NFTs already owned by the wallet
- Show available NFTs by rarity and faucet-style price
- Mint a real NFT through the deployed GiftArc contract on Arc

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Contract

By default this project is configured for:

`0x92Bd737bA6b7401c79bF9DD79991E4ABe27ddc85`

You can change it in `.env.local`.
