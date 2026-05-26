export type ProductId = "shirt" | "candle" | "pin" | "tote" | "journal";

export type Variant = { id: string; label: string };

export type Product = {
  id: ProductId;
  name: string;
  caption: string;
  priceUsdc: number;
  variants: Variant[];
  /** Two-stop radial gradient composed to read as a product photograph. */
  art: string;
  category: "Apparel" | "Home" | "Stationery" | "Accessories";
};

export const MERCHANT_ADDRESS = "0x5B8ecaB7096F8aBED873D246629ef9f05f467605";

export const SHIPPING_FREE_OVER = 50;

export const CATALOG: Product[] = [
  {
    id: "shirt",
    name: "Linen camp shirt",
    caption: "Ecru / heavy 240gsm / matte horn buttons",
    priceUsdc: 48,
    variants: [
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
      { id: "xl", label: "XL" },
    ],
    art: "radial-gradient(120% 80% at 30% 25%, #d6c4a3 0%, #b89a72 55%, #8a6a48 100%)",
    category: "Apparel",
  },
  {
    id: "candle",
    name: "Fig + cedar candle",
    caption: "Ceramic vessel · 8oz · 45-hour burn",
    priceUsdc: 32,
    variants: [{ id: "8oz", label: "8oz" }],
    art: "radial-gradient(120% 80% at 70% 30%, #f0e2c4 0%, #c69b6f 60%, #7a4f30 100%)",
    category: "Home",
  },
  {
    id: "pin",
    name: "Tortoise reading glasses",
    caption: "Acetate · amber tortoise · neutral lens",
    priceUsdc: 29,
    variants: [{ id: "amber", label: "Amber" }],
    art: "radial-gradient(120% 80% at 25% 30%, #b89160 0%, #6a4423 65%, #2a1a0c 100%)",
    category: "Accessories",
  },
  {
    id: "tote",
    name: "Atelier weekend tote",
    caption: "Waxed canvas · saddle leather handles",
    priceUsdc: 96,
    variants: [
      { id: "natural", label: "Natural" },
      { id: "umber", label: "Umber" },
    ],
    art: "radial-gradient(120% 80% at 65% 40%, #cdb094 0%, #94714d 60%, #5a3d23 100%)",
    category: "Accessories",
  },
  {
    id: "journal",
    name: "Hardcover field journal",
    caption: "Letterpressed · 192 pages · ribbon marker",
    priceUsdc: 24,
    variants: [
      { id: "rust", label: "Rust" },
      { id: "olive", label: "Olive" },
    ],
    art: "radial-gradient(120% 80% at 30% 25%, #c98c66 0%, #944c2e 65%, #4f1f0d 100%)",
    category: "Stationery",
  },
];
