"use client";
import Image from "next/image";

import useWallet from "@/app/hooks/useWallet";
import { useState } from "react";

export default function Home() {
  const [userWallet, setUserWallet] = useState<string>("");
  const { getItems, walletItems } = useWallet();

  const handleGetItems = async () => {
    if (!userWallet) return;
    await getItems(userWallet);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b border-white/20 py-5">
        <div>
          <h1 className="text-3xl font-bold">NFT Send</h1>
          <p>Send NFTs to anyone</p>
        </div>

        <button className="rounded-md border border-white p-2">
          Connect Wallet
        </button>
      </div>

      <div className="flex flex-col pt-5">
        <label>Recipient</label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="your_wallet"
            placeholder="Enter your wallet"
            className="p-2 rounded text-black"
            onChange={(e) => setUserWallet(e.target.value)}
          />
          <button
            className="rounded-md border border-white p-2"
            onClick={() => handleGetItems()}
          >
            Lookup Items
          </button>
        </div>
      </div>

      <div>
        {walletItems.length > 0 ? (
          <div className="grid grid-cols-4">
            {walletItems.map((item: any) => (
              <div
                key={item.mint}
                className="flex flex-col items-center justify-center gap-4 p-4"
              >
                <Image
                  src={item.content.files[0].uri}
                  alt={item.content.metadata.name}
                  width={200}
                  height={200}
                  unoptimized
                />
                <p>{item.content.metadata.name}</p>
                <p>{item.content.metadata.description}</p>
                <button className="border border-white rounded p-2 w-full">
                  Send
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
