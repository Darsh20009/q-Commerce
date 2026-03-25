import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, language } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80"];

  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images]);

  const imageVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      scale: 1.1,
      x: direction > 0 ? 100 : -100,
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      scale: 0.9,
      x: direction > 0 ? -100 : 100,
    }),
  };

  const transition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.6 },
    scale: { duration: 0.6 },
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/products/${product.id}`}>
        <Card className="group overflow-hidden border-none rounded-none bg-white hover-elevate transition-all duration-500 cursor-pointer">
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary/20">
            <AnimatePresence mode="wait" custom={1}>
              <motion.div
                key={currentImageIndex}
                custom={1}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0"
              >
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex ? "bg-white w-6" : "bg-white/50 w-1.5"
                    }`}
                    animate={{
                      width: idx === currentImageIndex ? 24 : 6,
                    }}
                  />
                ))}
              </div>
            )}

            <Button
              size="sm"
              className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 rounded-none font-black uppercase text-[10px]"
            >
              {t('viewDetails')}
            </Button>
            
            {product.isFeatured && (
              <motion.div
                initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'} bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1`}
              >
                {t('featured')}
              </motion.div>
            )}
          </div>
          
          <CardContent className="p-4 text-center">
            <h3 className="font-black uppercase tracking-tighter text-sm mb-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground font-bold">{Number(product.price).toLocaleString()} {t('currency')}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
