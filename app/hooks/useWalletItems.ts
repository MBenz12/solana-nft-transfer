import { useState, useCallback } from "react";
// import {
//   Transaction,
//   Connection,
//   PublicKey,
//   SystemProgram,
// } from "@solana/web3.js";
// import {
//   createTransferCheckedInstruction,
//   createAssociatedTokenAccountInstruction,
//   getAssociatedTokenAddress,
// } from "@solana/spl-token";

// interface WithdrawItemProps {
//   from: string;
//   to: string;
//   tokenMint: string;
//   isCompressed?: boolean;
// }

export default function useWallet() {
  const [loading, setLoading] = useState(false);
  const [walletItems, setWalletItems] = useState<any>([]);
//   const [listedItems, setListedItems] = useState<any>([]);

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
      setWalletItems(data.items);
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
      setWalletItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // const withdrawItem = async ({
  //   from,
  //   to,
  //   tokenMint,
  //   isCompressed,
  // }: WithdrawItemProps) => {
  //   setLoading(true);
  //   try {
  //     const mintPubkey = new PublicKey(tokenMint);
  //     const ownerPubkey = new PublicKey(from);
  //     const receiveAddress = new PublicKey(to);

  //     // Get the token account of the from wallet (owner)
  //     const fromTokenAccount = await getAssociatedTokenAddress(
  //       mintPubkey,
  //       ownerPubkey
  //     );

  //     // Ensure the receiver has an ATA for this mint
  //     const toTokenAccount = await getAssociatedTokenAddress(
  //       mintPubkey,
  //       receiveAddress
  //     );

  //     const sendTxn = new Transaction();

  //     // Check if the receiver's token account exists
  //     const receiverAccountInfo = await connection.getAccountInfo(
  //       toTokenAccount
  //     );

  //     if (!receiverAccountInfo) {
  //       sendTxn.add(
  //         createAssociatedTokenAccountInstruction(
  //           ownerPubkey,
  //           toTokenAccount,
  //           receiveAddress,
  //           mintPubkey
  //         )
  //       );
  //     }

  //     // Add the transfer instruction
  //     sendTxn.add(
  //       createTransferCheckedInstruction(
  //         fromTokenAccount, // source
  //         mintPubkey, // mint (token address)
  //         toTokenAccount, // destination
  //         ownerPubkey, // owner of source account
  //         1, // amount, for NFT it's usually 1
  //         0 // decimals, for NFT it's usually 0
  //       )
  //     );

  //     //@ts-ignore
  //     const signer = await primaryWallet.connector.getSigner<any>();

  //     // Sign and send the transaction
  //     const signedTransaction = await signer.signAndSendTransaction(sendTxn);

  //     return { success: true, signedTransaction };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error,
  //     };
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return {
    // withdrawItem,
    getItems,
    loading,
    walletItems,
  };
}
