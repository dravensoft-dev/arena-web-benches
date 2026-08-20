export type Listing = {
  id: string;
  title: string;
  shop: string;
  shopAvatar: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  mark?: 'sale' | 'bestseller' | 'star-seller';
  freeDelivery: boolean;
  madeIn: string;
  img: string;
  gallery: string[];
};

export const CURRENCY = '£';

export function money(amount: number) {
  return `${CURRENCY}${amount.toFixed(2)}`;
}

export function reviewCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export const LISTINGS: Listing[] = [
  {
    id: 'oak-shelf',
    title: 'Floating oak shelf with brass brackets, made to measure',
    shop: 'HollowGrain',
    shopAvatar: '/img/s1.jpg',
    price: 68,
    was: 85,
    rating: 4.9,
    reviews: 1284,
    mark: 'sale',
    freeDelivery: true,
    madeIn: 'Sheffield, England',
    img: '/img/p1.jpg',
    gallery: ['/img/p1.jpg', '/img/p5.jpg', '/img/p9.jpg', '/img/p3.jpg'],
  },
  {
    id: 'linen-apron',
    title: 'Washed linen cross-back apron with deep pockets',
    shop: 'FlaxAndFold',
    shopAvatar: '/img/s2.jpg',
    price: 42,
    rating: 4.8,
    reviews: 906,
    mark: 'bestseller',
    freeDelivery: true,
    madeIn: 'Vilnius, Lithuania',
    img: '/img/p2.jpg',
    gallery: ['/img/p2.jpg', '/img/p6.jpg', '/img/p10.jpg'],
  },
  {
    id: 'stoneware-mug',
    title: 'Speckled stoneware mug, wheel thrown, 350ml',
    shop: 'KilnRoom',
    shopAvatar: '/img/s3.jpg',
    price: 24,
    was: 30,
    rating: 5,
    reviews: 2410,
    mark: 'sale',
    freeDelivery: false,
    madeIn: 'Porto, Portugal',
    img: '/img/p3.jpg',
    gallery: ['/img/p3.jpg', '/img/p7.jpg', '/img/p11.jpg'],
  },
  {
    id: 'brass-lamp',
    title: 'Small brass desk lamp with opal glass shade',
    shop: 'NorthAndPike',
    shopAvatar: '/img/s4.jpg',
    price: 145,
    rating: 4.7,
    reviews: 318,
    mark: 'star-seller',
    freeDelivery: true,
    madeIn: 'Bristol, England',
    img: '/img/p4.jpg',
    gallery: ['/img/p4.jpg', '/img/p8.jpg', '/img/p12.jpg'],
  },
  {
    id: 'wool-throw',
    title: 'Herringbone lambswool throw in moss and oat',
    shop: 'CroftMill',
    shopAvatar: '/img/s5.jpg',
    price: 96,
    was: 120,
    rating: 4.9,
    reviews: 654,
    mark: 'sale',
    freeDelivery: true,
    madeIn: 'Galway, Ireland',
    img: '/img/p5.jpg',
    gallery: ['/img/p5.jpg', '/img/p1.jpg', '/img/p9.jpg'],
  },
  {
    id: 'walnut-board',
    title: 'End grain walnut chopping board with juice groove',
    shop: 'HollowGrain',
    shopAvatar: '/img/s1.jpg',
    price: 78,
    rating: 4.8,
    reviews: 442,
    freeDelivery: false,
    madeIn: 'Sheffield, England',
    img: '/img/p6.jpg',
    gallery: ['/img/p6.jpg', '/img/p2.jpg'],
  },
  {
    id: 'ceramic-vase',
    title: 'Hand pinched bud vase in matte clay, set of three',
    shop: 'KilnRoom',
    shopAvatar: '/img/s3.jpg',
    price: 36,
    rating: 4.6,
    reviews: 187,
    mark: 'bestseller',
    freeDelivery: true,
    madeIn: 'Porto, Portugal',
    img: '/img/p7.jpg',
    gallery: ['/img/p7.jpg', '/img/p3.jpg'],
  },
  {
    id: 'leather-notebook',
    title: 'Refillable leather notebook cover, A5, hand stitched',
    shop: 'TannerRow',
    shopAvatar: '/img/s6.jpg',
    price: 54,
    was: 62,
    rating: 4.9,
    reviews: 1130,
    mark: 'sale',
    freeDelivery: true,
    madeIn: 'Cordoba, Spain',
    img: '/img/p8.jpg',
    gallery: ['/img/p8.jpg', '/img/p4.jpg'],
  },
  {
    id: 'rush-basket',
    title: 'Woven rush storage basket with leather handles',
    shop: 'FlaxAndFold',
    shopAvatar: '/img/s2.jpg',
    price: 58,
    rating: 4.7,
    reviews: 275,
    freeDelivery: false,
    madeIn: 'Vilnius, Lithuania',
    img: '/img/p9.jpg',
    gallery: ['/img/p9.jpg', '/img/p5.jpg'],
  },
  {
    id: 'copper-pan',
    title: 'Tin lined copper saucepan, 16cm, iron handle',
    shop: 'NorthAndPike',
    shopAvatar: '/img/s4.jpg',
    price: 210,
    was: 245,
    rating: 5,
    reviews: 96,
    mark: 'sale',
    freeDelivery: true,
    madeIn: 'Bristol, England',
    img: '/img/p10.jpg',
    gallery: ['/img/p10.jpg', '/img/p6.jpg'],
  },
  {
    id: 'glass-carafe',
    title: 'Mouth blown glass carafe with a tumbler lid',
    shop: 'KilnRoom',
    shopAvatar: '/img/s3.jpg',
    price: 45,
    rating: 4.5,
    reviews: 208,
    freeDelivery: true,
    madeIn: 'Porto, Portugal',
    img: '/img/p11.jpg',
    gallery: ['/img/p11.jpg', '/img/p7.jpg'],
  },
  {
    id: 'quilt-cushion',
    title: 'Patchwork cushion cover in reclaimed cotton, 45cm',
    shop: 'CroftMill',
    shopAvatar: '/img/s5.jpg',
    price: 32,
    was: 40,
    rating: 4.8,
    reviews: 519,
    mark: 'sale',
    freeDelivery: false,
    madeIn: 'Galway, Ireland',
    img: '/img/p12.jpg',
    gallery: ['/img/p12.jpg', '/img/p8.jpg'],
  },
];

export const CATEGORIES = [
  'Home and living',
  'Kitchen and dining',
  'Lighting',
  'Textiles',
  'Stationery',
];

export const FACETS = [
  { id: 'delivery', label: 'Free delivery' },
  { id: 'sale', label: 'On sale' },
  { id: 'star', label: 'Star Seller' },
  { id: 'local', label: 'Ships from the UK' },
];

export function listing(id: string) {
  const found = LISTINGS.find((one) => one.id === id);
  if (!found) throw new Error(`no listing ${id}`);
  return found;
}
