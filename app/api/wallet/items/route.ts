import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  try {
    const items = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAssetsByOwner",
          params: {
            ownerAddress: wallet,
            page: 1,
            limit: 1000,
          },
        }),
      }
    ).then((res) => res.json());


    return Response.json({
      message: "success",
      items: items.result.items,
    });
  } catch (error) {
    console.error(error);
  }
}
