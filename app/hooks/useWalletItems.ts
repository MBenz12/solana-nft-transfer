import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useCallback, useEffect } from "react";
import { AccountMeta, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferInstruction, PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

export default function useWalletItems() {
  const [loading, setLoading] = useState(false);
  const [walletItems, setWalletItems] = useState<any>([]);
  const wallet = useWallet();
  const { connection } = useConnection();

  const getProof = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/proof?id=${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 60,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      console.log(data.item);
      return data.item;
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getItems = useCallback(async (wallet: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wallet/items?wallet=${wallet}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 60,
        },
      });


      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      console.log(data.items);
      return data.items;
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (wallet.publicKey) {
        setWalletItems(await getItems(wallet.publicKey.toString()));
      }
    })();
  }, [wallet.publicKey]);

  const transferCompressedNFT = useCallback(async (
    treeAddress: PublicKey,
    proof: string[],
    root: string,
    dataHash: string,
    creatorHash: string,
    leafId: number,
    owner: string,
    newLeafOwner: PublicKey,
    delegate: string
  ) => {
    if (!wallet.publicKey) return;

    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, treeAddress);

    const treeAuthority = treeAccount.getAuthority();
    const canopyDepth = treeAccount.getCanopyDepth();

    const proofPath: AccountMeta[] = proof
      .map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
      }))
      .slice(0, proof.length - (!!canopyDepth ? canopyDepth : 0));

    const leafOwner = new PublicKey(owner);
    const leafDelegate = delegate ? new PublicKey(delegate) : leafOwner;

    const transferInstruction = createTransferInstruction(
      {
        merkleTree: treeAddress,
        treeAuthority,
        leafOwner,
        leafDelegate,
        newLeafOwner,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        anchorRemainingAccounts: proofPath,
      },
      {
        root: [...new PublicKey(root.trim()).toBytes()],
        dataHash: [...new PublicKey(dataHash.trim()).toBytes()],
        creatorHash: [...new PublicKey(creatorHash.trim()).toBytes()],
        nonce: leafId,
        index: leafId,
      },
      PROGRAM_ID
    );

    try {
      const txt = new Transaction().add(transferInstruction);
      txt.feePayer = wallet.publicKey;

      const transactionSignature = await wallet.sendTransaction(txt, connection);
      await connection.confirmTransaction(transactionSignature, "confirmed");
      console.log(`Successfully transfered the cNFT with txt sig: ${transactionSignature}`);
    } catch (error: any) {
      console.error(`Failed to transfer cNFT with error: ${error}`);
    }
  }, [wallet.publicKey, connection]);

  return {
    transferCompressedNFT,
    getItems,
    getProof,
    loading,
    walletItems,
  };
}