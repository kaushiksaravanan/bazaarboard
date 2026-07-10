/**
 * Retail-vertical presets. Every entry is a real Indian retail
 * category where the demo lands hard because the audience recognizes
 * the products. Hindi/Tamil/Kannada renders will surprise judges who
 * assumed AI image gen can't handle Indic scripts correctly.
 */

export interface RetailPreset {
  id: string;
  vertical: string;
  businessName: string;
  brandColor: string;
  items: Array<{ productName: string; price: string }>;
}

export const PRESETS: RetailPreset[] = [
  {
    id: "kirana",
    vertical: "Kirana (grocery)",
    businessName: "Rathi Kirana",
    brandColor: "#F26B1F",
    items: [
      { productName: "Alphonso mango pulp", price: "₹120 / kg" },
      { productName: "Basmati rice (aged 1yr)", price: "₹95 / kg" },
      { productName: "Tur dal (unpolished)", price: "₹140 / kg" },
      { productName: "Cold-pressed groundnut oil", price: "₹220 / L" },
      { productName: "Ghee (A2 desi)", price: "₹850 / kg" },
      { productName: "Jeera whole", price: "₹380 / kg" },
      { productName: "Chana besan", price: "₹75 / kg" },
      { productName: "Poha (thick)", price: "₹65 / kg" },
    ],
  },
  {
    id: "sweetshop",
    vertical: "Sweet shop (mithai)",
    businessName: "Balaji Sweets & Snacks",
    brandColor: "#E43C4B",
    items: [
      { productName: "Kaju katli", price: "₹800 / kg" },
      { productName: "Motichoor laddoo", price: "₹450 / kg" },
      { productName: "Rasgulla (500g pack)", price: "₹280" },
      { productName: "Soan papdi", price: "₹360 / kg" },
      { productName: "Gulab jamun (dozen)", price: "₹180" },
      { productName: "Mysore pak (fresh)", price: "₹520 / kg" },
    ],
  },
  {
    id: "chaat",
    vertical: "Chaat & street food",
    businessName: "Mumbai Chaat Bhandar",
    brandColor: "#FFB43C",
    items: [
      { productName: "Pani puri (10 pcs)", price: "₹60" },
      { productName: "Bhel puri (plate)", price: "₹80" },
      { productName: "Dahi puri", price: "₹90" },
      { productName: "Sev puri", price: "₹80" },
      { productName: "Ragda pattice", price: "₹120" },
      { productName: "Vada pav", price: "₹40" },
    ],
  },
  {
    id: "textile",
    vertical: "Textile / saree shop",
    businessName: "Kumaran Silks",
    brandColor: "#2E7B4E",
    items: [
      { productName: "Kanchipuram silk saree", price: "₹18,500" },
      { productName: "Chikankari kurti", price: "₹1,850" },
      { productName: "Cotton dupatta (block print)", price: "₹650" },
      { productName: "Silk stole (Banarasi)", price: "₹2,200" },
    ],
  },
  {
    id: "pharmacy",
    vertical: "Neighbourhood pharmacy",
    businessName: "Apollo Nearby",
    brandColor: "#4A7BC8",
    items: [
      { productName: "Home BP monitor", price: "₹1,499" },
      { productName: "N95 mask (5 pack)", price: "₹120" },
      { productName: "Oximeter (fingertip)", price: "₹599" },
      { productName: "Thermometer digital", price: "₹149" },
    ],
  },
];

export function findPreset(id: string): RetailPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
