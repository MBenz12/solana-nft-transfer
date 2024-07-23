"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import useWalletItems from "@/app/hooks/useWallet";
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex } from "@metaplex-foundation/js";
import dynamic from 'next/dynamic';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Dynamically import WalletMultiButton
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

type CompressedNFTAsset = {
  interface: string;
  id: string;
  content: {
    json_uri: string;
    files: { uri: string; type: string }[];
    metadata: {
      name: string;
      symbol: string;
      // Add other relevant fields here
    };
  };
  // Add other relevant fields here
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [recipientWallet, setRecipientWallet] = useState<string>("");
  const { getItems, walletItems } = useWalletItems();
  const { publicKey, connected, sendTransaction } = useSolanaWallet();
  const [nfts, setNFTs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && connected && publicKey) {
      console.log("Connected wallet:", publicKey.toString());
      listNFTs(publicKey);
    }
  }, [isMounted, connected, publicKey]);

  const listNFTs = async (walletPublicKey: PublicKey) => {
    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=147a018f-8db1-4994-b3c1-eb8886e37bc2');
    const metaplex = Metaplex.make(connection);

    try {
      // Fetch regular NFTs
      const regularNfts = await metaplex.nfts().findAllByOwner({ owner: walletPublicKey });

      // Fetch compressed NFTs
      const compressedNfts = await fetchCompressedNFTs(connection, walletPublicKey);

      // Combine regular and compressed NFTs
      const allNfts = [...regularNfts, ...compressedNfts];

      console.log(allNfts);
      setNFTs(allNfts);
      setError(null);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Error fetching NFTs. Please try again later.');
    }
  };

  const fetchCompressedNFTs = async (connection: Connection, walletPublicKey: PublicKey): Promise<CompressedNFTAsset[]> => {
    const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletPublicKey.toBase58()}/compressed-assets?api-key=147a018f-8db1-4994-b3c1-eb8886e37bc2`);
    const data = await response.json();
    return data.assets;
  };

  const handleGetItems = async () => {
    if (!recipientWallet) return;
    try {
      await getItems(recipientWallet);
      setError(null);
    } catch (error) {
      console.error('Error getting recipient items:', error);
      setError('Error fetching recipient items. Please try again later.');
    }
  };

  if (!isMounted) {
    return null; // or a loading indicator
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center border-b border-white/20 py-5">
        <div>
          <h1 className="text-3xl font-bold">NFT Send</h1>
          <p>Send NFTs to anyone</p>
        </div>

        <WalletMultiButton className="rounded-md border border-white p-2" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex flex-col pt-5">
        <label>Recipient</label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="recipient_wallet"
            placeholder="Enter recipient's wallet"
            className="p-2 rounded text-black"
            onChange={(e) => setRecipientWallet(e.target.value)}
            value={recipientWallet}
          />
          <button
            className="rounded-md border border-white p-2"
            onClick={handleGetItems}
          >
            Lookup Items
          </button>
        </div>
      </div>

      {connected && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your NFTs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft: any, index: number) => (
              <div key={index} className="border border-gray-300 p-4 rounded-md">
                {(nft.json?.image || nft.content?.files?.[0]?.uri) && (
                  <Image
                    src={nft.json?.image || nft.content?.files?.[0]?.uri}
                    alt={nft.name || nft.content?.metadata?.name}
                    width={200}
                    height={200}
                    className="w-full h-auto mb-2"
                  />
                )}
                <h3 className="font-bold">{nft.name || nft.content?.metadata?.name}</h3>
                <p className="text-sm text-gray-500">{nft.symbol || nft.content?.metadata?.symbol}</p>
                {nft.compression && <p className="text-xs text-blue-500">Compressed NFT</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {walletItems && walletItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recipient's Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {walletItems.map((item: any, index: number) => (
              <div key={index} className="border border-gray-300 p-4 rounded-md">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.symbol}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
