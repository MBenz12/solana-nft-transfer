"use client";
import { useState, useEffect } from "react";
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import dynamic from 'next/dynamic';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';
import useNfts, { NFTData } from "./hooks/useNfts";
import useWalletItems from "./hooks/useWalletItems";

// Dynamically import WalletMultiButton
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [recipientWallet, setRecipientWallet] = useState<string>("");
  const [walletItems, setWalletItems] = useState<Array<NFTData>>([]);
  const { connected } = useSolanaWallet();
  const [error, setError] = useState<string | null>(null);

  const [reload, setReload] = useState({});
  const {
    // nfts: allNfts, 
    // fetchNfts, 
    transferNft
  } = useNfts(reload);
  const [selectedNft, setSelectedNft] = useState<any>();

  const { transferCompressedNFT, getProof, getItems, walletItems: allNfts, } = useWalletItems();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetItems = async () => {
    if (!recipientWallet) return;
    try {
      setWalletItems(await getItems(recipientWallet));
      setError(null);
    } catch (error) {
      console.error('Error getting recipient items:', error);
      setError('Error fetching recipient items. Please try again later.');
    }
  };

  const handleTransfer = async () => {
    try {
      if (selectedNft && recipientWallet) {
        if (selectedNft.interface === "ProgrammableNFT") {
          await transferNft(new PublicKey(selectedNft.id), new PublicKey(recipientWallet));
        } else {
          const { root, proof, tree_id} = await getProof(selectedNft.id);
          const { data_hash, creator_hash, leaf_id }= selectedNft.compression;
          const { owner, delegate } = selectedNft.ownership;

          console.log(data_hash, creator_hash, leaf_id, owner, delegate, proof, tree_id);
          await transferCompressedNFT(
            new PublicKey(tree_id),
            proof,
            root,
            data_hash,
            creator_hash,
            leaf_id,
            owner,
            new PublicKey(recipientWallet),
            delegate,
          );
        }
        setReload({});
      }
    } catch (error) {
      console.log(error);
      setError('Failed to transfer nft.');
    }
  }

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
          <button
            className="rounded-md border border-white p-2"
            disabled={!selectedNft}
            onClick={handleTransfer}
          >
            Transfer
          </button>
        </div>
      </div>

      {connected && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your NFTs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allNfts.map((nft: any) => (
              <div
                key={nft.id}
                onClick={() => {
                  if (selectedNft?.id === nft.id) {
                    setSelectedNft(undefined);
                  } else {
                    setSelectedNft(nft);
                  }
                }}
                className={`border border-gray-300 p-4 rounded-md ${(selectedNft?.id === nft.id) && "border-gray-800"}`}
              >
                {nft.content.links.image && (
                  <img src={nft.content.links.image} alt={nft.content.metadata.name} className="w-full h-auto mb-2" width={200} height={200} />
                )}
                <h3 className="font-bold">{nft.content.metadata.name}</h3>
                <p className="text-sm text-gray-500">{nft.content.metadata.symbol}</p>
                {nft.compression.compressed && <p className="text-sm text-gray-500">Compressed</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {walletItems && walletItems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Recipient&apos;s Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {walletItems.map((nft: any) => (
              <div key={nft.id} className="border border-gray-300 p-4 rounded-md">
                {nft.content.links.image && (
                  <img src={nft.content.links.image} alt={nft.content.metadata.name} className="w-full h-auto mb-2" width={200} height={200} />
                )}
                <h3 className="font-bold">{nft.content.metadata.name}</h3>
                <p className="text-sm text-gray-500">{nft.content.metadata.symbol}</p>
                {nft.compression.compressed && <p className="text-sm text-gray-500">Compressed</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
