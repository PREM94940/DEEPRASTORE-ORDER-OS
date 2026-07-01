export type SectionType = "hero" | "featured_products" | "banner" | "rich_text" | "whatsapp_cta" | "footer";

export interface ThemeSection {
  id: string;
  type: SectionType;
  hidden: boolean;
  props: Record<string, any>;
}

export const initialSections: ThemeSection[] = [
  { 
    id: "s1", 
    type: "hero", 
    hidden: false, 
    props: { 
      title: "LUXURY REDEFINED", 
      subtitle: "SS26 Collection",
      buttonText: "SHOP THE COLLECTION",
      buttonLink: "/collections/all",
      bgImageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
    } 
  },
  { 
    id: "s2", 
    type: "featured_products", 
    hidden: false, 
    props: { 
      heading: "FEATURED COLLECTION",
      count: 4,
      layout: "grid" 
    } 
  },
  { 
    id: "s3", 
    type: "rich_text", 
    hidden: false, 
    props: { 
      heading: "THE DEEPRASTORE PROMISE",
      body: "Uncompromising quality, meticulous attention to detail, and timeless elegance.",
      alignment: "center"
    } 
  },
  { 
    id: "s4", 
    type: "footer", 
    hidden: false, 
    props: { 
      copyrightText: "© 2026 DEEPRASTORE. All Rights Reserved."
    } 
  },
];
