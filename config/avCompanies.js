// config/avCompanies.js
// Mapping of AV companies to stock tickers and metadata

export const avCompanies = [
  // Pure-Play AV Companies
  {
    name: "Waymo",
    ticker: null, // Private (Alphabet subsidiary)
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    parentCompany: "Alphabet",
    parentTicker: "GOOGL"
  },
  {
    name: "Cruise",
    ticker: null, // Private (GM subsidiary)
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    parentCompany: "General Motors",
    parentTicker: "GM"
  },
  {
    name: "Aurora",
    ticker: "AUR",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Autonomous Vehicles",
    description: "Self-driving technology company"
  },
  {
    name: "Motional",
    ticker: null, // Private (Hyundai/Aptiv JV)
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    parentCompany: "Aptiv",
    parentTicker: "APTV"
  },
  {
    name: "Zoox",
    ticker: null, // Private (Amazon subsidiary)
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    parentCompany: "Amazon",
    parentTicker: "AMZN"
  },
  {
    name: "Argo AI",
    ticker: null, // Defunct as of 2022
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    status: "defunct"
  },
  {
    name: "Mobileye",
    ticker: "MBLY",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Autonomous Vehicles",
    description: "Intel-owned AV technology"
  },
  {
    name: "TuSimple",
    ticker: "TSP",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Autonomous Vehicles - Trucking",
    description: "Autonomous trucking"
  },
  {
    name: "Plus",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles - Trucking"
  },
  
  // Traditional Auto Makers with AV Programs
  {
    name: "Tesla",
    ticker: "TSLA",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Electric Vehicles / Autonomous",
    description: "EV and FSD technology"
  },
  {
    name: "General Motors",
    ticker: "GM",
    exchange: "NYSE",
    isPublic: true,
    sector: "Automotive",
    description: "Traditional auto with Cruise"
  },
  {
    name: "Ford",
    ticker: "F",
    exchange: "NYSE",
    isPublic: true,
    sector: "Automotive",
    description: "Traditional auto with AV programs"
  },
  {
    name: "Volkswagen",
    ticker: "VWAGY",
    exchange: "OTC",
    isPublic: true,
    sector: "Automotive",
    description: "German automaker with AV tech"
  },
  {
    name: "Toyota",
    ticker: "TM",
    exchange: "NYSE",
    isPublic: true,
    sector: "Automotive",
    description: "Japanese automaker with AV research"
  },
  {
    name: "BMW",
    ticker: "BMWYY",
    exchange: "OTC",
    isPublic: true,
    sector: "Automotive"
  },
  {
    name: "Mercedes-Benz",
    ticker: "MBGAF",
    exchange: "OTC",
    isPublic: true,
    sector: "Automotive"
  },
  {
    name: "Hyundai",
    ticker: "HYMTF",
    exchange: "OTC",
    isPublic: true,
    sector: "Automotive"
  },
  {
    name: "Honda",
    ticker: "HMC",
    exchange: "NYSE",
    isPublic: true,
    sector: "Automotive"
  },
  {
    name: "Nissan",
    ticker: "NSANY",
    exchange: "OTC",
    isPublic: true,
    sector: "Automotive"
  },
  
  // Tech Companies with AV Interest
  {
    name: "Alphabet",
    ticker: "GOOGL",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Parent of Waymo"
  },
  {
    name: "Google",
    ticker: "GOOGL",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Parent of Waymo"
  },
  {
    name: "Amazon",
    ticker: "AMZN",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Owner of Zoox"
  },
  {
    name: "Apple",
    ticker: "AAPL",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Rumored AV project"
  },
  {
    name: "Microsoft",
    ticker: "MSFT",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Cloud services for AV"
  },
  {
    name: "NVIDIA",
    ticker: "NVDA",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "AI chips for autonomous systems"
  },
  {
    name: "Intel",
    ticker: "INTC",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Owner of Mobileye"
  },
  {
    name: "Qualcomm",
    ticker: "QCOM",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "AV chipsets"
  },
  
  // Chinese AV Companies
  {
    name: "Baidu",
    ticker: "BIDU",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Technology",
    description: "Apollo autonomous platform"
  },
  {
    name: "NIO",
    ticker: "NIO",
    exchange: "NYSE",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "Chinese EV with autonomous features"
  },
  {
    name: "XPeng",
    ticker: "XPEV",
    exchange: "NYSE",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "Chinese EV with ADAS"
  },
  {
    name: "Li Auto",
    ticker: "LI",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "Chinese EV maker"
  },
  {
    name: "BYD",
    ticker: "BYDDY",
    exchange: "OTC",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "Chinese EV leader"
  },
  {
    name: "Pony.ai",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    description: "Chinese-American AV company"
  },
  {
    name: "WeRide",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    description: "Chinese robotaxi company"
  },
  
  // Sensor/Components Companies
  {
    name: "Luminar",
    ticker: "LAZR",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "LiDAR / Sensors",
    description: "LiDAR technology"
  },
  {
    name: "Velodyne",
    ticker: null, // Merged with Ouster
    exchange: null,
    isPublic: false,
    sector: "LiDAR / Sensors",
    status: "merged"
  },
  {
    name: "Ouster",
    ticker: "OUST",
    exchange: "NYSE",
    isPublic: true,
    sector: "LiDAR / Sensors",
    description: "LiDAR sensors"
  },
  {
    name: "Innoviz",
    ticker: "INVZ",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "LiDAR / Sensors",
    description: "LiDAR technology"
  },
  {
    name: "Cerence",
    ticker: "CRNC",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Software",
    description: "Automotive AI software"
  },
  
  // Ride-Sharing Companies
  {
    name: "Uber",
    ticker: "UBER",
    exchange: "NYSE",
    isPublic: true,
    sector: "Ride-Sharing",
    description: "Former AV development, now partner"
  },
  {
    name: "Lyft",
    ticker: "LYFT",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Ride-Sharing",
    description: "Ride-sharing with AV partnerships"
  },
  {
    name: "Didi",
    ticker: "DIDI",
    exchange: "OTC",
    isPublic: true,
    sector: "Ride-Sharing",
    description: "Chinese ride-sharing with AV"
  },
  
  // Other Related Companies
  {
    name: "Aptiv",
    ticker: "APTV",
    exchange: "NYSE",
    isPublic: true,
    sector: "Automotive Suppliers",
    description: "Co-owner of Motional"
  },
  {
    name: "Rivian",
    ticker: "RIVN",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "EV trucks and vans"
  },
  {
    name: "Lucid",
    ticker: "LCID",
    exchange: "NASDAQ",
    isPublic: true,
    sector: "Electric Vehicles",
    description: "Luxury electric vehicles"
  },
  {
    name: "May Mobility",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    description: "AV shuttle service"
  },
  {
    name: "Nuro",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    description: "Autonomous delivery"
  },
  {
    name: "Gatik",
    ticker: null,
    exchange: null,
    isPublic: false,
    sector: "Autonomous Vehicles",
    description: "Autonomous middle-mile logistics"
  }
];

// Helper function to find company by name (case-insensitive)
export function findCompanyByName(name) {
  const normalized = name.toLowerCase().trim();
  return avCompanies.find(c => c.name.toLowerCase() === normalized);
}

// Helper function to get all public companies
export function getPublicCompanies() {
  return avCompanies.filter(c => c.isPublic && c.ticker);
}

// Helper function to get companies by sector
export function getCompaniesBySector(sector) {
  return avCompanies.filter(c => c.sector === sector);
}

// Get mapping for SQL insert
export function getCompanyInsertData() {
  return avCompanies.map(c => ({
    name: c.name,
    ticker: c.ticker,
    exchange: c.exchange,
    is_public: c.isPublic,
    sector: c.sector,
    description: c.description || null,
    website: c.website || null
  }));
}
