import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-shell">
        <div className="landing-badge">Arc-native NFT Faucet</div>
        <h1>Mint collectible NFTs on Arc with a clean dashboard flow.</h1>
        <p>
          Connect your wallet, switch to Arc, see your balance, view your owned NFTs,
          and mint new rarities directly through the deployed contract.
        </p>
        <Link href="/dashboard" className="primary-link">
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
