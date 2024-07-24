import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    const item = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetProof',
          params: {
            id
          },
        }),
      }
    ).then((res) => res.json());


    return Response.json({
      message: "success",
      item: item.result,
    });
  } catch (error) {
    console.error(error);
  }
}
