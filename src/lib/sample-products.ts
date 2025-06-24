export interface AdditionalInfo {
  key: string;
  value: string;
}

export interface SampleProduct {
  id: string;
  name: string;
  originalPrice?: number;
  image: string;
  slug: string;
  isBundle?: boolean;
  isVariation?: boolean;
  sku: string;
  description: string;
  amount: number;
  additional_information: AdditionalInfo[];
}

export const sampleProducts: SampleProduct[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    originalPrice: 24999,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    slug: "premium-wireless-headphones",
    sku: "WH-001",
    description: "High-quality wireless headphones with noise cancellation",
    amount: 19999,
    additional_information: [
      { key: "Brand", value: "AudioTech" },
      { key: "Model", value: "WH-2000XM4" },
      { key: "Battery Life", value: "30 hours" },
      { key: "Connectivity", value: "Bluetooth 5.0" },
      { key: "Weight", value: "254g" },
    ],
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    slug: "smart-fitness-watch",
    isVariation: true,
    sku: "FW-002",
    description: "Advanced fitness tracking smartwatch with health monitoring",
    amount: 29999,
    additional_information: [
      { key: "Brand", value: "FitTech" },
      { key: "Model", value: "Sport Pro" },
      { key: "Display", value: '1.4" AMOLED' },
      { key: "Water Resistance", value: "5ATM" },
      { key: "Battery Life", value: "7 days" },
    ],
  },
  {
    id: "3",
    name: "Portable Bluetooth Speaker",
    originalPrice: 12999,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    slug: "portable-bluetooth-speaker",
    sku: "BS-003",
    description: "Portable wireless speaker with premium sound quality",
    amount: 8999,
    additional_information: [
      { key: "Brand", value: "SoundWave" },
      { key: "Model", value: "Portable Plus" },
      { key: "Power Output", value: "20W" },
      { key: "Battery Life", value: "12 hours" },
      { key: "Water Resistance", value: "IPX7" },
    ],
  },
  {
    id: "4",
    name: "Gaming Bundle Pack",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
    slug: "gaming-bundle-pack",
    isBundle: true,
    sku: "GB-004",
    description: "Complete gaming setup including controller and accessories",
    amount: 39999,
    additional_information: [
      { key: "Brand", value: "GameTech" },
      { key: "Model", value: "Ultimate Bundle" },
      { key: "Controller Type", value: "Wireless" },
      { key: "Compatibility", value: "PC/Console" },
      { key: "Included Items", value: "Controller, Headset, Charger" },
    ],
  },
  {
    id: "5",
    name: "4K Action Camera",
    originalPrice: 39999,
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    slug: "4k-action-camera",
    sku: "AC-005",
    description: "Professional 4K action camera for extreme sports",
    amount: 34999,
    additional_information: [
      { key: "Brand", value: "ActionCam" },
      { key: "Model", value: "Hero 10" },
      { key: "Resolution", value: "4K/60fps" },
      { key: "Water Resistance", value: "10m" },
      { key: "Battery Life", value: "2 hours" },
    ],
  },
  {
    id: "6",
    name: "Wireless Charging Pad",
    image:
      "https://images.unsplash.com/photo-1591290619618-904f6dd935e3?w=400&h=400&fit=crop",
    slug: "wireless-charging-pad",
    sku: "WC-006",
    description: "Fast wireless charging pad compatible with all devices",
    amount: 4999,
    additional_information: [
      { key: "Brand", value: "ChargeTech" },
      { key: "Model", value: "FastCharge Pro" },
      { key: "Power Output", value: "15W" },
      { key: "Compatibility", value: "Qi Standard" },
      { key: "Material", value: "Silicone" },
    ],
  },
  {
    id: "7",
    name: "Smart Home Hub",
    image:
      "https://images.unsplash.com/photo-1568842293346-22b714e801f6?w=400&h=400&fit=crop",
    slug: "smart-home-hub",
    isVariation: true,
    sku: "SH-007",
    description: "Central hub for controlling all smart home devices",
    amount: 17999,
    additional_information: [
      { key: "Brand", value: "SmartHome" },
      { key: "Model", value: "Hub Central" },
      { key: "Connectivity", value: "WiFi + Zigbee" },
      { key: "Voice Assistant", value: "Built-in" },
      { key: "Compatibility", value: "Alexa, Google Home" },
    ],
  },
  {
    id: "8",
    name: "Premium Coffee Maker",
    originalPrice: 15999,
    image:
      "https://images.unsplash.com/photo-1616191540374-dbea0eda0bfc?w=400&h=400&fit=crop",
    slug: "premium-coffee-maker",
    sku: "CM-008",
    description: "Professional coffee maker with programmable settings",
    amount: 12999,
    additional_information: [
      { key: "Brand", value: "BrewMaster" },
      { key: "Model", value: "Pro 2000" },
      { key: "Capacity", value: "12 cups" },
      { key: "Programmable", value: "Yes" },
      { key: "Warranty", value: "2 years" },
    ],
  },
  {
    id: "9",
    name: "Ultra HD Smart TV",
    originalPrice: 89999,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    slug: "ultra-hd-smart-tv",
    sku: "TV-009",
    description: "65-inch 4K Ultra HD Smart TV with HDR technology",
    amount: 74999,
    additional_information: [
      { key: "Brand", value: "ViewTech" },
      { key: "Model", value: "Ultra 65X" },
      { key: "Screen Size", value: "65 inches" },
      { key: "Resolution", value: "4K Ultra HD" },
      { key: "Smart Features", value: "Android TV" },
    ],
  },
  {
    id: "10",
    name: "Professional DSLR Camera",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    slug: "professional-dslr-camera",
    isVariation: true,
    sku: "DC-010",
    description: "High-end DSLR camera for professional photography",
    amount: 129999,
    additional_information: [
      { key: "Brand", value: "PhotoPro" },
      { key: "Model", value: "EOS R5" },
      { key: "Sensor", value: "45MP Full Frame" },
      { key: "Video", value: "8K RAW" },
      { key: "Lens Mount", value: "RF Mount" },
    ],
  },
  {
    id: "11",
    name: "Gaming Laptop",
    originalPrice: 199999,
    image:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
    slug: "gaming-laptop",
    sku: "GL-011",
    description: "High-performance gaming laptop with RTX graphics",
    amount: 169999,
    additional_information: [
      { key: "Brand", value: "GameLap" },
      { key: "Model", value: "Predator X15" },
      { key: "Processor", value: "Intel i9-12900H" },
      { key: "Graphics", value: "RTX 4080" },
      { key: "RAM", value: "32GB DDR5" },
    ],
  },
  {
    id: "12",
    name: "Wireless Earbuds",
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    slug: "wireless-earbuds",
    sku: "WE-012",
    description: "True wireless earbuds with active noise cancellation",
    amount: 15999,
    additional_information: [
      { key: "Brand", value: "SoundBuds" },
      { key: "Model", value: "AirPods Pro" },
      { key: "Battery Life", value: "6 hours" },
      { key: "Case Battery", value: "24 hours" },
      { key: "Water Resistance", value: "IPX4" },
    ],
  },
  {
    id: "13",
    name: "Smart Refrigerator",
    originalPrice: 249999,
    image:
      "https://images.unsplash.com/photo-1737363625082-8bbbb821286e?w=400&h=400&fit=crop",
    slug: "smart-refrigerator",
    sku: "SR-013",
    description: "Smart refrigerator with touchscreen and app control",
    amount: 199999,
    additional_information: [
      { key: "Brand", value: "CoolTech" },
      { key: "Model", value: "SmartFridge Pro" },
      { key: "Capacity", value: "25 cu ft" },
      { key: "Energy Rating", value: "A+++" },
      { key: "Smart Features", value: "WiFi, Camera, App" },
    ],
  },
  {
    id: "14",
    name: "Robot Vacuum Cleaner",
    image:
      "https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=400&h=400&fit=crop",
    slug: "robot-vacuum-cleaner",
    sku: "RV-014",
    description: "Smart robot vacuum with mapping and scheduling",
    amount: 29999,
    additional_information: [
      { key: "Brand", value: "CleanBot" },
      { key: "Model", value: "Roomba i7+" },
      { key: "Battery Life", value: "75 minutes" },
      { key: "Suction Power", value: "10x" },
      { key: "Smart Features", value: "Mapping, Scheduling" },
    ],
  },
  {
    id: "15",
    name: "Electric Standing Desk",
    originalPrice: 59999,
    image:
      "https://images.unsplash.com/photo-1622131815452-cc00d8d89f02?w=400&h=400&fit=crop",
    slug: "electric-standing-desk",
    sku: "ESD-015",
    description: "Electric standing desk with memory presets",
    amount: 44999,
    additional_information: [
      { key: "Brand", value: "DeskTech" },
      { key: "Model", value: "StandUp Pro" },
      { key: "Height Range", value: "28-48 inches" },
      { key: "Weight Capacity", value: "300 lbs" },
      { key: "Memory Presets", value: "4 positions" },
    ],
  },
  {
    id: "16",
    name: "Smart Security Camera",
    image:
      "https://images.unsplash.com/photo-1728971975421-50f3dc9663a4?w=400&h=400&fit=crop",
    slug: "smart-security-camera",
    isVariation: true,
    sku: "SSC-016",
    description:
      "Wireless security camera with night vision and motion detection",
    amount: 8999,
    additional_information: [
      { key: "Brand", value: "SecureCam" },
      { key: "Model", value: "NightWatch Pro" },
      { key: "Resolution", value: "1080p HD" },
      { key: "Night Vision", value: "Up to 30ft" },
      { key: "Storage", value: "Cloud + SD Card" },
    ],
  },
  {
    id: "17",
    name: "Portable Projector",
    originalPrice: 39999,
    image:
      "https://images.unsplash.com/photo-1638154320403-1bc308a01398?w=400&h=400&fit=crop",
    slug: "portable-projector",
    sku: "PP-017",
    description: "Portable mini projector for home entertainment",
    amount: 29999,
    additional_information: [
      { key: "Brand", value: "ProjTech" },
      { key: "Model", value: "MiniBeam" },
      { key: "Brightness", value: "500 ANSI lumens" },
      { key: "Resolution", value: "1280x720" },
      { key: "Battery Life", value: "3 hours" },
    ],
  },
  {
    id: "18",
    name: "Smart Air Purifier",
    image:
      "https://images.unsplash.com/photo-1730299789489-b55bf96b22bf?w=400&h=400&fit=crop",
    slug: "smart-air-purifier",
    sku: "SAP-018",
    description: "HEPA air purifier with air quality monitoring",
    amount: 19999,
    additional_information: [
      { key: "Brand", value: "AirPure" },
      { key: "Model", value: "CleanAir Pro" },
      { key: "Coverage", value: "1500 sq ft" },
      { key: "Filter Type", value: "HEPA H13" },
      { key: "Smart Features", value: "App Control, Auto Mode" },
    ],
  },
];
