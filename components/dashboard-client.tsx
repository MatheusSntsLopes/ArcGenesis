"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { ARC_EXPLORER, ARC_NETWORK } from "@/lib/arc";
import { getGiftArcContract, type OwnedNft } from "@/lib/contract";
import { STORE_NFTS, type StoreNft } from "@/lib/nft-data";
import { formatBalance, parseDataTokenUri, shortAddress } from "@/lib/utils";
import Link from "next/link";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type TxState = {
  hash?: string;
  explorerUrl?: string;
  tokenId?: string | number;
  message?: string;
};

function getVirtualBalanceKey(wallet: string) {
  return `arcgenesis_balance_${wallet.toLowerCase()}`;
}

function readVirtualBalance(wallet: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const saved = sessionStorage.getItem(getVirtualBalanceKey(wallet));
  if (!saved) return fallback;
  const parsed = Number(saved);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function writeVirtualBalance(wallet: string, value: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getVirtualBalanceKey(wallet), String(value));
}

export default function DashboardClient() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0.00");
  const [virtualBalance, setVirtualBalance] = useState<number>(0);
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [mintingKey, setMintingKey] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const p = new BrowserProvider(window.ethereum);
    setProvider(p);

    const onAccountsChanged = (accounts: string[]) => {
      setAddress(accounts?.[0] || null);
      setTxState(null);
      setError(null);
    };

    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    return () => window.ethereum.removeListener?.("accountsChanged", onAccountsChanged);
  }, []);

  useEffect(() => {
    if (!provider || !address) {
      setOwnedNfts([]);
      setBalance("0.00");
      setVirtualBalance(0);
      return;
    }
    void loadWalletData(provider, address);
  }, [provider, address]);

  async function connectWallet() {
    if (!window.ethereum) {
      setError("MetaMask or Rabby not found");
      return;
    }

    try {
      setError(null);

      let freshProvider = new BrowserProvider(window.ethereum);
      setProvider(freshProvider);

      await ensureArcNetwork();

      freshProvider = new BrowserProvider(window.ethereum);
      setProvider(freshProvider);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts?.[0] || null);
    } catch (err: any) {
      console.error("Connect wallet error:", err);
      setError(err?.shortMessage || err?.reason || err?.message || "Failed to connect wallet");
    }
  }

  function disconnectWallet() {
    setAddress(null);
    setOwnedNfts([]);
    setBalance("0.00");
    setVirtualBalance(0);
    setTxState(null);
    setError(null);
  }

  async function ensureArcNetwork() {
    if (!window.ethereum) throw new Error("Wallet not found");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_NETWORK.chainIdHex }],
      });
    } catch (error: any) {
      if (error?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ARC_NETWORK],
        });
      } else {
        throw error;
      }
    }
  }

  async function loadWalletData(currentProvider: BrowserProvider, currentAddress: string) {
    try {
      setLoadingOwned(true);

      const nativeBalance = await currentProvider.getBalance(currentAddress);
      const realBalance = Number(formatEther(nativeBalance));
      setBalance(formatBalance(String(realBalance)));

      const initialVirtualBalance = readVirtualBalance(currentAddress, 100);
      setVirtualBalance(initialVirtualBalance);

      const contract = getGiftArcContract(currentProvider);
      const tokenIds = await contract.tokensOf(currentAddress);
      const nftList: OwnedNft[] = [];
      const validKeys = new Set(STORE_NFTS.map((item) => item.key));
      const validImages = new Set(
        STORE_NFTS.map((item) => `${typeof window !== "undefined" ? window.location.origin : ""}${item.image}`)
      );

      for (const rawId of tokenIds as bigint[]) {
        const tokenId = Number(rawId);

        let tokenUri = "";
        let parsed: any = null;

        try {
          tokenUri = await contract.tokenURI(tokenId);
          parsed = parseDataTokenUri(tokenUri);
        } catch (err) {
          console.warn("Skipping token with invalid tokenURI:", tokenId, err);
          continue;
        }

        let rarity = "UNKNOWN";
        let amount = 0;
        let name = `NFT #${tokenId}`;
        let image = "/nfts/common.png";
        let message = "";
        let designName = "";

        try {
          const gift = await contract.gifts(tokenId);
          rarity = gift[0] || rarity;
          amount = Number(gift[1] || 0);
          designName = gift[2] || "";
          message = gift[3] || "";
        } catch {}

        if (parsed) {
          name = parsed.name || name;
          image = parsed.image || image;

          if (Array.isArray(parsed.attributes)) {
            const rarityAttr = parsed.attributes.find((attr: any) => attr.trait_type === "Rarity");
            const amountAttr = parsed.attributes.find((attr: any) => attr.trait_type === "Visual Amount");
            const messageAttr = parsed.attributes.find((attr: any) => attr.trait_type === "Message");
            const designAttr = parsed.attributes.find((attr: any) => attr.trait_type === "Design");

            rarity = rarityAttr?.value || rarity;
            amount = Number(amountAttr?.value || amount || 0);
            message = messageAttr?.value || message;
            designName = designAttr?.value || designName;
          }
        } else if (designName) {
          name = designName;
        }

        const storeMatch = STORE_NFTS.find(
          (item) =>
            item.key === designName ||
            `${typeof window !== "undefined" ? window.location.origin : ""}${item.image}` === image
        );

        if (!storeMatch && !validKeys.has(designName) && !validImages.has(image)) {
          continue;
        }

        nftList.push({
          tokenId,
          name: storeMatch?.title || name,
          rarity: storeMatch?.rarity || rarity,
          amount: storeMatch?.price || amount,
          image: storeMatch?.image || image,
          message: message || storeMatch?.message || "",
        });
      }

      setOwnedNfts(nftList.reverse());
    } catch (err: any) {
      console.error("loadWalletData error:", err);
      setError(err?.shortMessage || err?.reason || err?.message || "Failed to load wallet data");
    } finally {
      setLoadingOwned(false);
    }
  }

  async function mintNft(nft: StoreNft) {
    if (!provider) {
      setError("Connect your wallet first.");
      return;
    }

    if (!address) {
      setError("Connect your wallet first.");
      return;
    }

    if (virtualBalance < nft.price) {
      setError("You don't have enough balance to mint this NFT.");
      return;
    }

    if (!window.ethereum) {
      setError("Wallet not found");
      return;
    }

    try {
      setError(null);
      setTxState(null);
      setMintingKey(nft.key);

      await ensureArcNetwork();

      const freshProvider = new BrowserProvider(window.ethereum);
      const signer = await freshProvider.getSigner();
      const signerAddress = await signer.getAddress();

      const contract = getGiftArcContract(signer);
      const contractAddress = process.env.NEXT_PUBLIC_GIFTARC_CONTRACT!;
      const code = await freshProvider.getCode(contractAddress);

      if (code === "0x") {
        throw new Error("No contract found at configured address on current network");
      }

      const mintFee = await contract.mintFee();
      const imageUri = `${window.location.origin}${nft.image}`;

      await contract.mintGift.staticCall(
        nft.rarity,
        nft.price,
        nft.key,
        imageUri,
        nft.message,
        { value: mintFee }
      );

      const tx = await contract.mintGift(
        nft.rarity,
        nft.price,
        nft.key,
        imageUri,
        nft.message,
        { value: mintFee }
      );

      const receipt = await tx.wait();
      let tokenId: string | number | undefined;

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "GiftMinted") {
            tokenId = parsed.args.tokenId?.toString();
            break;
          }
        } catch {}
      }

      const explorerUrl = `${ARC_EXPLORER}/tx/${tx.hash}`;
      setTxState({
        hash: tx.hash,
        explorerUrl,
        tokenId,
        message: `${nft.rarity} minted successfully on Arc.`,
      });

      const newBalance = Math.max(0, virtualBalance - nft.price);
      setVirtualBalance(newBalance);
      writeVirtualBalance(address, newBalance);

      await loadWalletData(freshProvider, signerAddress);
    } catch (err: any) {
      console.error("Mint error full:", err);
      console.error("Mint error info:", {
        message: err?.message,
        shortMessage: err?.shortMessage,
        reason: err?.reason,
        code: err?.code,
        data: err?.data,
        error: err?.error,
        info: err?.info,
      });

      setError(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Mint failed"
      );
    } finally {
      setMintingKey(null);
    }
  }

  const isConnected = !!address;
  const stats = useMemo(
    () => ({
      balance: virtualBalance,
      gifts: ownedNfts.length,
    }),
    [virtualBalance, ownedNfts.length]
  );

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">◈</div>
          <span>ARCGENESIS</span>
        </div>

        <div className="wallet-actions">
          {isConnected ? (
            <>
              <div className="wallet-chip">
                <div className="wallet-chip-label">Connected</div>
                <div>{shortAddress(address)}</div>
              </div>
              <button className="icon-btn" onClick={disconnectWallet} title="Disconnect">
                ↗
              </button>
            </>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Wallet Balance</div>
            <div className="stat-value">
              ${formatBalance(String(stats.balance))} <span>USDC</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Owned NFTs</div>
            <div className="stat-value">
              {stats.gifts} <span>Cards</span>
            </div>
          </div>

          <div className="stat-card action-card">
            <div>
              <div className="stat-label">Mint on Arc</div>
              <div className="action-copy">
                Choose a rarity below and mint instantly through the contract.
              </div>
            </div>
            <button
              className="primary-btn"
              onClick={() =>
                document.getElementById("available-nfts")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              + Mint Gift Card
            </button>
          </div>
        </div>

        {(error || txState) && (
          <div className="status-panel">
            {error && <p className="status-error">{error}</p>}
            {txState && (
              <div className="status-success">
                <div>{txState.message}</div>
                {txState.hash && (
                  <Link href={txState.explorerUrl || "#"} target="_blank">
                    View transaction
                  </Link>
                )}
                {txState.tokenId && <span>Token ID #{txState.tokenId}</span>}
              </div>
            )}
          </div>
        )}

        <section className="section-block">
          <div className="section-header">
            <h2>My NFTs</h2>
          </div>

          {loadingOwned ? (
            <div className="empty-state">Loading your NFTs...</div>
          ) : ownedNfts.length === 0 ? (
            <div className="empty-state">No NFTs in this wallet yet. Mint one below.</div>
          ) : (
            <div className="owned-grid">
              {ownedNfts.map((nft) => (
                <article className="owned-card" key={nft.tokenId}>
                  <img src={nft.image} alt={nft.name} className="owned-image" />
                  <div className="owned-overlay">
                    <div className="owned-top">
                      <span className="owned-title">{nft.rarity}</span>
                      <span className="owned-price">${nft.amount}</span>
                    </div>
                    <p className="owned-message">{nft.message || nft.name}</p>
                    <div className="owned-meta">
                      <div>
                        <span>FROM</span>
                        <strong>{shortAddress(address)}</strong>
                      </div>
                      <div className="owned-id">
                        <span>ID</span>
                        <strong>#{nft.tokenId}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section-block" id="available-nfts">
          <div className="section-header">
            <h2>Available NFTs</h2>
          </div>

          <div className="store-grid">
            {STORE_NFTS.map((nft) => (
              <article className="store-card" key={nft.key}>
                <img src={nft.image} alt={nft.title} className="store-image" />
                <div className="store-copy">
                  <div className="store-rarity" style={{ color: nft.accent }}>
                    {nft.rarity}
                  </div>
                  <div className="store-price">${nft.price}</div>
                  <div className="store-title">{nft.title}</div>
                </div>
                <button
                  className="mint-btn"
                  disabled={!isConnected || mintingKey === nft.key}
                  onClick={() => mintNft(nft)}
                >
                  {mintingKey === nft.key ? "Minting..." : `Mint ${nft.price}`}
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
