
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'ساخن' | 'بارد' | 'أكل';
  image?: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export const STATUSES = ['ساخن', 'بارد', 'أكل'] as const;
