export const marketFactoryAbi = [
  {
    "inputs": [{ "internalType": "address", "name": "_resolver", "type": "address" }, { "internalType": "address", "name": "_vault", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "inputs": [], "name": "DeadlineInPast", "type": "error" },
  { "inputs": [], "name": "InvalidPaginationLimit", "type": "error" },
  { "inputs": [], "name": "InvalidResolver", "type": "error" },
  { "inputs": [], "name": "InvalidVault", "type": "error" },
  { "inputs": [], "name": "MarketNotFound", "type": "error" },
  { "inputs": [], "name": "QuestionRequired", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "marketAddress", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "question", "type": "string" },
      { "indexed": false, "internalType": "uint64", "name": "deadline", "type": "uint64" },
      { "indexed": false, "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "string", "name": "question", "type": "string" }, { "internalType": "uint64", "name": "deadline", "type": "uint64" }, { "internalType": "string", "name": "metadataURI", "type": "string" }],
    "name": "createMarket",
    "outputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }, { "internalType": "address", "name": "marketAddress", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }],
    "name": "getMarket",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "marketId", "type": "uint256" },
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "address", "name": "marketAddress", "type": "address" },
        { "internalType": "string", "name": "question", "type": "string" },
        { "internalType": "string", "name": "metadataURI", "type": "string" },
        { "internalType": "uint64", "name": "deadline", "type": "uint64" },
        { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
      ],
      "internalType": "struct MarketFactory.MarketDetails",
      "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "creator", "type": "address" }],
    "name": "getMarketsByCreator",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "offset", "type": "uint256" }, { "internalType": "uint256", "name": "limit", "type": "uint256" }],
    "name": "listMarketIds",
    "outputs": [{ "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "offset", "type": "uint256" }, { "internalType": "uint256", "name": "limit", "type": "uint256" }],
    "name": "listMarkets",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "marketId", "type": "uint256" },
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "address", "name": "marketAddress", "type": "address" },
        { "internalType": "string", "name": "question", "type": "string" },
        { "internalType": "string", "name": "metadataURI", "type": "string" },
        { "internalType": "uint64", "name": "deadline", "type": "uint64" },
        { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
      ],
      "internalType": "struct MarketFactory.MarketDetails[]",
      "name": "markets", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "nextMarketId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [], "name": "resolver", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalMarkets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "vault", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }
] as const;

export const predictionMarketAbi = [
  { "inputs": [{ "internalType": "string", "name": "_question", "type": "string" }, { "internalType": "string", "name": "_metadataURI", "type": "string" }, { "internalType": "uint64", "name": "_deadline", "type": "uint64" }, { "internalType": "address", "name": "_creator", "type": "address" }, { "internalType": "address", "name": "_resolver", "type": "address" }, { "internalType": "address", "name": "_vault", "type": "address" }, { "internalType": "uint256", "name": "_marketId", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "AlreadyClaimed", "type": "error" },
  { "inputs": [], "name": "ClaimAlreadySettled", "type": "error" },
  { "inputs": [], "name": "ClaimNotRequested", "type": "error" },
  { "inputs": [], "name": "DeadlineInPast", "type": "error" },
  { "inputs": [], "name": "InvalidConfidenceBps", "type": "error" },
  { "inputs": [], "name": "InvalidMarketId", "type": "error" },
  { "inputs": [], "name": "InvalidStatus", "type": "error" },
  { "inputs": [], "name": "InvalidVault", "type": "error" },
  { "inputs": [], "name": "MarketStillActive", "type": "error" },
  { "inputs": [], "name": "NotCreator", "type": "error" },
  { "inputs": [], "name": "NotResolverOrCreator", "type": "error" },
  { "inputs": [], "name": "PositionAlreadyExists", "type": "error" },
  { "inputs": [], "name": "PositionNotFound", "type": "error" },
  { "inputs": [], "name": "QuestionRequired", "type": "error" },
  { "inputs": [{ "internalType": "bytes32", "name": "handle", "type": "bytes32" }, { "internalType": "address", "name": "sender", "type": "address" }], "name": "SenderNotAllowedToUseHandle", "type": "error" },
  { "inputs": [], "name": "ZamaProtocolUnsupported", "type": "error" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }], "name": "BetIncreased", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }], "name": "BetPlaced", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "winner", "type": "bool" }, { "indexed": false, "internalType": "uint256", "name": "payoutWei", "type": "uint256" }], "name": "ClaimSettled", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }], "name": "Claimed", "type": "event" },
  { "anonymous": false, "inputs": [], "name": "MarketCancelled", "type": "event" },
  { "anonymous": false, "inputs": [], "name": "MarketClosed", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "bool", "name": "outcomeYes", "type": "bool" }], "name": "MarketResolved", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "account", "type": "address" }], "name": "PoolAccessGranted", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint16", "name": "confidenceYesBps", "type": "uint16" }, { "indexed": false, "internalType": "int16", "name": "confidenceDeltaBps24h", "type": "int16" }, { "indexed": false, "internalType": "uint8", "name": "signalStrength", "type": "uint8" }], "name": "SnapshotPublished", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amountWei", "type": "uint256" }], "name": "StakeEscrowed", "type": "event" },
  { "inputs": [], "name": "cancelMarket", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "claim", "outputs": [{ "internalType": "ebool", "name": "isWinner", "type": "bytes32" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "claimSettled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "closeMarket", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "confidenceDeltaBps24h", "outputs": [{ "internalType": "int16", "name": "", "type": "int16" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "confidenceYesBps", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "confidentialProtocolId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "creator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deadline", "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getEncryptedPools", "outputs": [{ "internalType": "euint32", "name": "yesPool", "type": "bytes32" }, { "internalType": "euint32", "name": "noPool", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getMyPosition", "outputs": [{ "internalType": "ebool", "name": "sideYes", "type": "bytes32" }, { "internalType": "euint32", "name": "amount", "type": "bytes32" }, { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "bool", "name": "claimed", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "grantPoolAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "externalEuint32", "name": "inputAdditionalAmount", "type": "bytes32" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" }], "name": "increaseBet", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "marketId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "metadataURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "outcomeSet", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "participantCount", "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "externalEbool", "name": "inputSideYes", "type": "bytes32" }, { "internalType": "externalEuint32", "name": "inputAmount", "type": "bytes32" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" }], "name": "placeBet", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint16", "name": "_confidenceYesBps", "type": "uint16" }, { "internalType": "int16", "name": "_confidenceDeltaBps24h", "type": "int16" }, { "internalType": "uint8", "name": "_signalStrength", "type": "uint8" }], "name": "publishSnapshot", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "question", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "bool", "name": "outcomeYes", "type": "bool" }], "name": "resolveMarket", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "resolvedOutcome", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "resolver", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address payable", "name": "user", "type": "address" }, { "internalType": "bool", "name": "winner", "type": "bool" }, { "internalType": "uint256", "name": "payoutWei", "type": "uint256" }], "name": "settleClaim", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "signalStrength", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "status", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "vault", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }
] as const;
