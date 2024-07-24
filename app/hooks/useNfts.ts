import { Metaplex, PublicKey, token, walletAdapterIdentity } from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

export type NFTData = {
    mint: PublicKey,
    name: string,
    symbol: string,
    image: string,
};

const useNfts = (reload: {}) => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const metaplex = useMemo(() => new Metaplex(connection), [connection]);
    const feePayer = useMemo(() => {
        if (!wallet.publicKey) {
            return null;
        }
        return {
            publicKey: wallet.publicKey!,
            signTransaction: wallet.signTransaction!,
            signMessage: wallet.signMessage!,
            signAllTransactions: wallet.signAllTransactions!,
        };
    }, [wallet.publicKey]);

    useEffect(() => {
        if (feePayer) {
            metaplex.use(walletAdapterIdentity(feePayer));
        }
    }, [feePayer]);

    const [nfts, setNfts] = useState<Array<NFTData>>([]);
    const [loading, setLoading] = useState(false);

    const fetchNfts = useCallback(async (wallet: PublicKey) => {
        try {
            const walletNfts = await metaplex.nfts().findAllByOwner({ owner: wallet });
            const nfts = walletNfts.map(nft => ({
                // @ts-ignore
                mint: nft.mintAddress as PublicKey,
                name: nft.name,
                symbol: nft.symbol,
                image: "",
            }));

            await Promise.all(
                walletNfts.map(async (nft, index) => {
                    try {
                        const { data } = await axios.get(nft.uri);
                        const { image } = data;
                        nfts[index].image = image;
                    } catch (error) {
                        console.log(error);
                    }
                })
            );
            return nfts;
        } catch (error) {
            console.log(error);
            return [];
        }
    }, []);

    const transferNft = async (nftData: NFTData, recipient: PublicKey) => {
        if (!wallet.publicKey || !feePayer) return;

        const nft = await metaplex.nfts().findByMint({ mintAddress: nftData.mint });
        const txBuilder = metaplex.nfts().builders().transfer({ 
            nftOrSft: nft, 
            fromOwner: wallet.publicKey, 
            toOwner: recipient, 
            amount: token(1), 
            authority: feePayer
        });

        const blockhash = await connection.getLatestBlockhash();
        const tx = txBuilder.toTransaction(blockhash);

        const txSignature = await wallet.sendTransaction(tx, connection);
        console.log(txSignature);
        await connection.confirmTransaction(txSignature);
    };

    useEffect(() => {
        (async () => {
            if (wallet.publicKey) {
                setLoading(true);
                setNfts(await fetchNfts(wallet.publicKey));
                setLoading(false);
            }
        })();
    }, [wallet.publicKey, reload]);

    return { nfts, loading, fetchNfts, transferNft };
};

export default useNfts;