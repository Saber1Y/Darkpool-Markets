export const marketFactoryAbi = [
  {
    inputs: [],
    name: "totalMarkets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "listMarkets",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "marketId", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "marketAddress", type: "address" },
          { internalType: "string", name: "question", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "uint64", name: "deadline", type: "uint64" },
          { internalType: "uint64", name: "createdAt", type: "uint64" }
        ],
        internalType: "struct MarketFactory.MarketDetails[]",
        name: "markets",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "marketId", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "marketAddress", type: "address" },
          { internalType: "string", name: "question", type: "string" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "uint64", name: "deadline", type: "uint64" },
          { internalType: "uint64", name: "createdAt", type: "uint64" }
        ],
        internalType: "struct MarketFactory.MarketDetails",
        name: "market",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

export const predictionMarketAbi = [
  {
    inputs: [],
    name: "status",
    outputs: [{ internalType: "enum PredictionMarket.MarketStatus", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "participantCount",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "confidenceYesBps",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "confidenceDeltaBps24h",
    outputs: [{ internalType: "int16", name: "", type: "int16" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "signalStrength",
    outputs: [{ internalType: "enum PredictionMarket.SignalStrength", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "outcomeSet",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "resolvedOutcome",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "deadline",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
