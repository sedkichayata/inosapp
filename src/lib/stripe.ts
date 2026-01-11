// Stripe Payment Service for INOS Products

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  image: string;
  category: 'serum' | 'cream' | 'mask' | 'tool' | 'bundle';
  inStock: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
  clientSecret?: string;
}

// INOS Product Catalog
export const products: Product[] = [
  {
    id: 'serum-vitamin-c',
    name: 'Sérum Vitamine C Éclat',
    description: 'Illumine le regard et réduit les cernes pigmentaires. Formule concentrée à 15% de vitamine C stabilisée.',
    price: 4900, // 49.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
    category: 'serum',
    inStock: true,
    featured: true,
  },
  {
    id: 'eye-cream-caffeine',
    name: 'Contour des Yeux Caféine',
    description: 'Décongestionne et réduit les cernes vasculaires. Action immédiate avec caféine et vitamine K.',
    price: 3900, // 39.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    category: 'cream',
    inStock: true,
    featured: true,
  },
  {
    id: 'eye-patches-gold',
    name: 'Patchs Regard Or & Collagène',
    description: 'Masque hydratant intense pour le contour des yeux. Boîte de 30 paires.',
    price: 2900, // 29.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
    category: 'mask',
    inStock: true,
  },
  {
    id: 'roller-jade',
    name: 'Rouleau de Jade Froid',
    description: 'Massage lymphatique pour décongestionner le regard. Pierre de jade authentique.',
    price: 2400, // 24.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400',
    category: 'tool',
    inStock: true,
  },
  {
    id: 'serum-retinol',
    name: 'Sérum Rétinol Nuit',
    description: 'Stimule le renouvellement cellulaire pendant la nuit. Rétinol encapsulé 0.5%.',
    price: 5400, // 54.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    category: 'serum',
    inStock: true,
  },
  {
    id: 'bundle-starter',
    name: 'Kit Découverte Regard',
    description: 'Le trio essentiel: Sérum Vitamine C + Contour Caféine + 5 paires de patchs.',
    price: 7900, // 79.00€ (économie de 20€)
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    category: 'bundle',
    inStock: true,
    featured: true,
  },
  {
    id: 'cream-hyaluronic',
    name: 'Crème Acide Hyaluronique',
    description: 'Hydratation intense multi-poids moléculaires. Repulpe et lisse le contour des yeux.',
    price: 4400, // 44.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
    category: 'cream',
    inStock: true,
  },
  {
    id: 'gua-sha',
    name: 'Gua Sha Quartz Rose',
    description: 'Outil de massage traditionnel pour stimuler la circulation et réduire les poches.',
    price: 1900, // 19.00€
    currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    category: 'tool',
    inStock: true,
  },
];

export const formatPrice = (priceInCents: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(priceInCents / 100);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.featured);
};

export const getProductsByCategory = (category: Product['category']): Product[] => {
  return products.filter((p) => p.category === category);
};

export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
};

// Stripe Integration
export const isStripeConfigured = (): boolean => {
  return !!STRIPE_PUBLISHABLE_KEY;
};

export interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

// Note: In production, you would need a backend to create payment intents
// For now, this shows how the integration would work
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'eur'
): Promise<CreatePaymentIntentResponse> => {
  console.log('=== INOS Stripe Payment ===');
  console.log('Stripe configured:', isStripeConfigured());
  console.log('Amount:', amount, currency);

  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe not configured');
    return {
      success: false,
      error: 'Stripe non configuré. Veuillez ajouter votre clé Stripe.',
    };
  }

  // In a real app, you would call your backend here
  // The backend creates the PaymentIntent and returns the client secret
  // Example:
  // const response = await fetch('YOUR_BACKEND/create-payment-intent', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ amount, currency }),
  // });
  // const { clientSecret } = await response.json();

  return {
    success: false,
    error: 'Backend de paiement non configuré',
  };
};
