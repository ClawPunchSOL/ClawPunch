import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

interface MintInfo {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string;
  decimals: number;
}

interface TokenAccountInfo {
  owner: string;
  amount: string;
}

export interface OnChainScanResult {
  isValidAddress: boolean;
  isToken: boolean;
  tokenName: string | null;
  mintAuthority: "REVOKED" | "ACTIVE";
  freezeAuthority: "REVOKED" | "ACTIVE";
  supply: string;
  decimals: number;
  topHolders: { address: string; percentage: number }[];
  holderCount: number;
  holderDistribution: "HEALTHY" | "CONCENTRATED" | "WHALE_HEAVY";
  lpInfo: string;
  error?: string;
}

function parseMintData(data: Buffer): MintInfo | null {
  try {
    if (data.length < 82) return null;

    const mintAuthorityOption = data[0];
    let mintAuthority: string | null = null;
    if (mintAuthorityOption === 1) {
      mintAuthority = new PublicKey(data.slice(1, 33)).toBase58();
    }

    const supply = data.readBigUInt64LE(36);
    const decimals = data[44];

    const freezeAuthorityOption = data[45];
    let freezeAuthority: string | null = null;
    if (freezeAuthorityOption === 1) {
      freezeAuthority = new PublicKey(data.slice(46, 78)).toBase58();
    }

    return {
      mintAuthority,
      freezeAuthority,
      supply: supply.toString(),
      decimals,
    };
  } catch {
    return null;
  }
}

async function getTokenMetadataName(mint: PublicKey): Promise<string | null> {
  try {
    const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      METADATA_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);
    if (!accountInfo?.data) return null;

    const data = accountInfo.data;
    const nameLength = data.readUInt32LE(65);
    const name = data.slice(69, 69 + nameLength).toString("utf-8").replace(/\0/g, "").trim();
    return name || null;
  } catch {
    return null;
  }
}

async function getLargestHolders(mintAddress: PublicKey): Promise<TokenAccountInfo[]> {
  try {
    const result = await connection.getTokenLargestAccounts(mintAddress);
    return result.value.map(account => ({
      owner: account.address.toBase58(),
      amount: account.amount,
    }));
  } catch {
    return [];
  }
}

function analyzeHolderDistribution(
  holders: { address: string; percentage: number }[]
): "HEALTHY" | "CONCENTRATED" | "WHALE_HEAVY" {
  if (holders.length === 0) return "CONCENTRATED";

  const topHolderPct = holders[0]?.percentage || 0;
  const top3Pct = holders.slice(0, 3).reduce((sum, h) => sum + h.percentage, 0);

  if (topHolderPct > 50) return "WHALE_HEAVY";
  if (top3Pct > 70) return "CONCENTRATED";
  if (topHolderPct > 25) return "CONCENTRATED";
  return "HEALTHY";
}

const KNOWN_LP_PROGRAMS = [
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM v4
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS",  // Raydium route
  "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h", // Raydium AMM Authority
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  // Orca Whirlpool
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Orca v1
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",  // Meteora DLMM
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB", // Meteora Pool
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",  // Jupiter v6
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",  // Phoenix
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",  // Serum DEX
  "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EQMi4f",  // Openbook V2
  "11111111111111111111111111111111",                // System Program (burned)
];

export async function scanSolanaToken(contractAddress: string): Promise<OnChainScanResult> {
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(contractAddress);
  } catch {
    return {
      isValidAddress: false,
      isToken: false,
      tokenName: null,
      mintAuthority: "ACTIVE",
      freezeAuthority: "ACTIVE",
      supply: "0",
      decimals: 0,
      topHolders: [],
      holderCount: 0,
      holderDistribution: "CONCENTRATED",
      lpInfo: "UNKNOWN",
      error: "Invalid Solana address",
    };
  }

  try {
    const accountInfo = await connection.getAccountInfo(pubkey);

    if (!accountInfo) {
      return {
        isValidAddress: true,
        isToken: false,
        tokenName: null,
        mintAuthority: "ACTIVE",
        freezeAuthority: "ACTIVE",
        supply: "0",
        decimals: 0,
        topHolders: [],
        holderCount: 0,
        holderDistribution: "CONCENTRATED",
        lpInfo: "UNKNOWN",
        error: "Account not found on-chain",
      };
    }

    const isTokenProgram =
      accountInfo.owner.equals(TOKEN_PROGRAM_ID) ||
      accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);

    if (!isTokenProgram) {
      return {
        isValidAddress: true,
        isToken: false,
        tokenName: null,
        mintAuthority: "ACTIVE",
        freezeAuthority: "ACTIVE",
        supply: "0",
        decimals: 0,
        topHolders: [],
        holderCount: 0,
        holderDistribution: "CONCENTRATED",
        lpInfo: "NOT_A_TOKEN",
        error: `Not a token mint. Owner program: ${accountInfo.owner.toBase58().slice(0, 8)}...`,
      };
    }

    const mintInfo = parseMintData(accountInfo.data as Buffer);
    if (!mintInfo) {
      return {
        isValidAddress: true,
        isToken: true,
        tokenName: null,
        mintAuthority: "ACTIVE",
        freezeAuthority: "ACTIVE",
        supply: "0",
        decimals: 0,
        topHolders: [],
        holderCount: 0,
        holderDistribution: "CONCENTRATED",
        lpInfo: "UNKNOWN",
        error: "Failed to parse mint data",
      };
    }

    const [tokenName, largestAccounts] = await Promise.all([
      getTokenMetadataName(pubkey),
      getLargestHolders(pubkey),
    ]);

    const totalSupplyBig = BigInt(mintInfo.supply);
    const ZERO = BigInt(0);
    const TEN_THOUSAND = BigInt(10000);
    const topHolders = largestAccounts
      .filter(a => BigInt(a.amount) > ZERO)
      .map(a => ({
        address: a.owner,
        percentage: totalSupplyBig > ZERO
          ? Number((BigInt(a.amount) * TEN_THOUSAND) / totalSupplyBig) / 100
          : 0,
      }))
      .slice(0, 10);

    const holderDistribution = analyzeHolderDistribution(topHolders);

    let lpInfo = "NO_LP_FOUND";
    let totalLpPercent = 0;
    let lpProgramName = "AMM";

    const holdersToCheck = topHolders.slice(0, 5);
    const holderAddresses = holdersToCheck.map(h => new PublicKey(h.address));

    try {
      const accountInfos = await connection.getMultipleAccountsInfo(holderAddresses);

      const tokenOwners: { pubkey: PublicKey; holderIndex: number }[] = [];

      for (let i = 0; i < accountInfos.length; i++) {
        const info = accountInfos[i];
        if (!info || info.data.length < 64) continue;

        const ownerBytes = (info.data as Buffer).slice(32, 64);
        const ownerPubkey = new PublicKey(ownerBytes);
        const ownerStr = ownerPubkey.toBase58();

        console.log(`[SCAN] Holder ${i}: ${holdersToCheck[i].address.slice(0, 8)}... (${holdersToCheck[i].percentage.toFixed(1)}%) owned by ${ownerStr.slice(0, 12)}...`);

        if (KNOWN_LP_PROGRAMS.includes(ownerStr)) {
          totalLpPercent += holdersToCheck[i].percentage;
          lpProgramName = ownerStr.slice(0, 8);
          console.log(`[SCAN] -> DIRECT LP MATCH: ${ownerStr.slice(0, 12)}...`);
        } else {
          tokenOwners.push({ pubkey: ownerPubkey, holderIndex: i });
        }

        if (info.owner && !info.owner.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")) &&
            !info.owner.equals(new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"))) {
          const tokenProgOwner = info.owner.toBase58();
          if (KNOWN_LP_PROGRAMS.includes(tokenProgOwner)) {
            totalLpPercent += holdersToCheck[i].percentage;
            lpProgramName = tokenProgOwner.slice(0, 8);
            console.log(`[SCAN] -> TOKEN PROGRAM OWNER LP MATCH: ${tokenProgOwner.slice(0, 12)}...`);
          }
        }
      }

      if (totalLpPercent === 0 && tokenOwners.length > 0) {
        const ownerPubkeys = tokenOwners.map(o => o.pubkey);
        const ownerInfos = await connection.getMultipleAccountsInfo(ownerPubkeys);

        for (let i = 0; i < ownerInfos.length; i++) {
          const ownerInfo = ownerInfos[i];
          if (!ownerInfo) continue;
          const ownerOwnerStr = ownerInfo.owner.toBase58();
          console.log(`[SCAN] Owner-of-owner for holder ${tokenOwners[i].holderIndex}: ${ownerOwnerStr.slice(0, 12)}...`);

          if (KNOWN_LP_PROGRAMS.includes(ownerOwnerStr)) {
            totalLpPercent += holdersToCheck[tokenOwners[i].holderIndex].percentage;
            lpProgramName = ownerOwnerStr.slice(0, 8);
            console.log(`[SCAN] -> PDA LP MATCH: ${ownerOwnerStr.slice(0, 12)}...`);
          }
        }
      }
    } catch (err) {
      console.error("[SCAN] LP check error:", err);
    }

    if (totalLpPercent > 0) {
      lpInfo = `LOCKED_IN_LP (${totalLpPercent.toFixed(1)}% in LP pools, ${lpProgramName}...)`;
    }

    return {
      isValidAddress: true,
      isToken: true,
      tokenName: tokenName || null,
      mintAuthority: mintInfo.mintAuthority ? "ACTIVE" : "REVOKED",
      freezeAuthority: mintInfo.freezeAuthority ? "ACTIVE" : "REVOKED",
      supply: mintInfo.supply,
      decimals: mintInfo.decimals,
      topHolders,
      holderCount: topHolders.length,
      holderDistribution,
      lpInfo,
    };
  } catch (error: any) {
    return {
      isValidAddress: true,
      isToken: false,
      tokenName: null,
      mintAuthority: "ACTIVE",
      freezeAuthority: "ACTIVE",
      supply: "0",
      decimals: 0,
      topHolders: [],
      holderCount: 0,
      holderDistribution: "CONCENTRATED",
      lpInfo: "UNKNOWN",
      error: `RPC error: ${error.message?.slice(0, 100)}`,
    };
  }
}
