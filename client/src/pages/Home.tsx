import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  ShoppingBag, Star, ShieldCheck, Truck, ChevronRight, ChevronLeft,
  Zap, Clock, RotateCcw, Headphones, Package, Tag, ArrowLeft, ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MarketingBanners } from "@/components/marketing-banners";
import logoImg from "@assets/QIROX_LOGO_1774316442270.png";
import { useQuery } from "@tanstack/react-query";

const heroSlides = [
  {
    bg: "from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]",
    accent: "#ffffff",
    tag_ar: "كولكشن ٢٠٢٥",
    tag_en: "COLLECTION 2025",
    title_ar: "أناقة\nلا حدود لها",
    title_en: "STYLE\nBEYOND LIMITS",
    sub_ar: "اكتشف أحدث التشكيلات الحصرية من Qirox Studio",
    sub_en: "Discover the latest exclusive collections from Qirox Studio",
    cta_ar: "تسوق الآن",
    cta_en: "Shop Now",
    img: "/hero-banner-1.png",
    pattern: "radial",
  },
  {
    bg: "from-[#1a0a2e] via-[#16213e] to-[#0f3460]",
    accent: "#e8c547",
    tag_ar: "عروض حصرية",
    tag_en: "EXCLUSIVE DEALS",
    title_ar: "خصومات\nاستثنائية",
    title_en: "MASSIVE\nDISCOUNTS",
    sub_ar: "عروض لا تُقاوَم على أفخر المنتجات — لفترة محدودة",
    sub_en: "Irresistible deals on premium products — limited time only",
    cta_ar: "استكشف العروض",
    cta_en: "Explore Deals",
    img: "/hero-banner-2.png",
    pattern: "grid",
  },
  {
    bg: "from-[#0d1f12] via-[#1a3a21] to-[#0d2a15]",
    accent: "#4ade80",
    tag_ar: "شحن مجاني",
    tag_en: "FREE SHIPPING",
    title_ar: "توصيل سريع\nلباب بيتك",
    title_en: "FAST DELIVERY\nTO YOUR DOOR",
    sub_ar: "شحن مجاني لجميع مناطق المملكة العربية السعودية",
    sub_en: "Free shipping to all regions of Saudi Arabia",
    cta_ar: "ابدأ التسوق",
    cta_en: "Start Shopping",
    img: "/hero-banner-3.png",
    pattern: "dots",
  },
];


const trustBadges = [
  { icon: Truck, label_ar: "شحن مجاني", sub_ar: "لجميع الطلبات فوق ١٠٠ ر.س", label_en: "Free Shipping", sub_en: "On all orders above 100 SAR" },
  { icon: RotateCcw, label_ar: "إرجاع مجاني", sub_ar: "خلال ١٤ يوم من الاستلام", label_en: "Free Returns", sub_en: "Within 14 days of receipt" },
  { icon: ShieldCheck, label_ar: "دفع آمن ١٠٠٪", sub_ar: "حماية كاملة للبيانات", label_en: "100% Secure Payment", sub_en: "Full data protection" },
  { icon: Headphones, label_ar: "دعم ٢٤/٧", sub_ar: "فريق متخصص لمساعدتك", label_en: "24/7 Support", sub_en: "Dedicated support team" },
];

function FlashCountdown({ endTime }: { endTime?: string }) {
  const getRemaining = () => {
    if (!endTime) return { h: 5, m: 59, s: 59 };
    const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
    const totalSecs = Math.floor(diff / 1000);
    return {
      h: Math.floor(totalSecs / 3600),
      m: Math.floor((totalSecs % 3600) / 60),
      s: totalSecs % 60,
    };
  };
  const [time, setTime] = useState(getRemaining);
  useEffect(() => {
    const iv = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(iv);
  }, [endTime]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-white" dir="ltr">
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-white/20 backdrop-blur-sm text-white font-black text-xl md:text-2xl w-12 h-12 flex items-center justify-center rounded-md tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-white/60 font-black text-lg">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useProducts();
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { data: dbCategories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const [heroIdx, setHeroIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const featuredProducts = products?.slice(0, 8) || [];
  const newArrivals = products?.slice(0, 4) || [];
  const bestSellers = products?.slice(4, 8) || [];

  // Flash Deals from API
  const { data: flashDealsData = [] } = useQuery<any[]>({ queryKey: ["/api/flash-deals"] });
  const hasFlashDeals = flashDealsData.length > 0;
  // Use nearest ending flash deal's endTime for countdown
  const flashEndTime = hasFlashDeals
    ? flashDealsData.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())[0]?.endTime
    : undefined;
  // Flash deal products enriched with discount info
  const flashDealProducts = hasFlashDeals
    ? flashDealsData.map((deal: any) => ({
        ...deal.product,
        _flashDeal: deal,
        price: deal.product?.price
          ? (deal.product.price * (1 - deal.discountPercent / 100)).toFixed(2)
          : deal.product?.price,
        originalPrice: deal.product?.price,
        discountBadge: `${deal.discountPercent}%`,
      }))
    : newArrivals;

  useEffect(() => {
    if (user && ["admin", "employee", "support"].includes(user.role)) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  const nextSlide = useCallback(() => setHeroIdx(p => (p + 1) % heroSlides.length), []);
  const prevSlide = useCallback(() => setHeroIdx(p => (p - 1 + heroSlides.length) % heroSlides.length), []);

  useEffect(() => {
    if (!isAutoPlay) return;
    autoRef.current = setInterval(nextSlide, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [isAutoPlay, nextSlide, heroIdx]);

  const slide = heroSlides[heroIdx];

  return (
    <Layout>
      <MarketingBanners />

      {/* ── ANNOUNCEMENT BAR ─────────────────────────────── */}
      <div className="bg-black text-white overflow-hidden h-9 flex items-center">
        <div className="flex animate-marquee whitespace-nowrap items-center gap-12 text-[11px] font-bold uppercase tracking-widest">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="flex items-center gap-2"><Truck className="w-3 h-3 opacity-60" />{isRtl ? "شحن مجاني على جميع الطلبات فوق ١٠٠ ر.س" : "Free shipping on all orders above 100 SAR"}</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-2"><Tag className="w-3 h-3 opacity-60" />{isRtl ? "كود الخصم: QIROX10 — خصم ١٠٪" : "Discount code: QIROX10 — 10% off"}</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-2"><Star className="w-3 h-3 opacity-60" />{isRtl ? "جودة مضمونة أو استرداد كامل" : "Quality guaranteed or full refund"}</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO CAROUSEL ────────────────────────────────── */}
      <section
        className="relative h-[55vw] min-h-[320px] max-h-[680px] overflow-hidden"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
          >
            {/* Decorative Pattern */}
            {slide.pattern === "grid" && (
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
            )}
            {slide.pattern === "dots" && (
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            )}
            {slide.pattern === "radial" && (
              <div className="absolute inset-0 opacity-10"
                style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
            )}

            {/* Hero Image */}
            <div className={`absolute inset-0 flex ${isRtl ? "justify-start" : "justify-end"}`}>
              <motion.img
                src={slide.img}
                alt=""
                initial={{ scale: 1.08, opacity: 0.3 }}
                animate={{ scale: 1, opacity: 0.45 }}
                transition={{ duration: 1.2 }}
                className="h-full w-auto object-cover object-center"
              />
              <div className={`absolute inset-0 ${isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/80 via-black/40 to-transparent`} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className={`container ${isRtl ? "px-16 md:px-20 text-right" : "px-16 md:px-20 text-left"}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span
                    className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-4 rounded-sm"
                    style={{ background: slide.accent, color: "#000" }}
                  >
                    {isRtl ? slide.tag_ar : slide.tag_en}
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-6 whitespace-pre-line">
                    {isRtl ? slide.title_ar : slide.title_en}
                  </h1>
                  <p className="text-white/60 text-sm md:text-base lg:text-lg mb-8 max-w-md font-light">
                    {isRtl ? slide.sub_ar : slide.sub_en}
                  </p>
                  <Link href="/products">
                    <Button
                      size="lg"
                      className="h-12 md:h-14 px-8 md:px-12 text-xs md:text-sm font-black uppercase tracking-widest rounded-none transition-all duration-300 border-2"
                      style={{ background: slide.accent, color: "#000", borderColor: slide.accent }}
                    >
                      {isRtl ? slide.cta_ar : slide.cta_en}
                      {isRtl ? <ArrowLeft className="mr-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next */}
        <button
          onClick={isRtl ? nextSlide : prevSlide}
          className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3 md:right-6" : "left-3 md:left-6"} z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all`}
        >
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={isRtl ? prevSlide : nextSlide}
          className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3 md:left-6" : "right-3 md:right-6"} z-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all`}
        >
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`transition-all rounded-full ${i === heroIdx ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>

        {/* Slide Number */}
        <div className="absolute bottom-4 right-4 z-20 text-white/30 text-xs font-black tracking-widest" dir="ltr">
          {heroIdx + 1} / {heroSlides.length}
        </div>
      </section>

      {/* ── CATEGORY TILES (Noon style) ──────────────────── */}
      <section className="bg-background py-8 md:py-12 border-b border-border overflow-hidden">
        <div className="container px-4">
          <div className={`flex items-center justify-between mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-foreground">
              {isRtl ? "تسوق حسب الفئة" : "Shop by Category"}
            </h2>
            <Link href="/products">
              <span className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1">
                {isRtl ? "الكل" : "All"} {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </Link>
          </div>
        </div>
        {/* Scrollable row — no container constraint so it bleeds edge-to-edge */}
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
          {[
            ...(dbCategories || []).map((cat: any) => ({
              id: cat.id,
              slug: cat.slug,
              nameAr: cat.nameAr || cat.name,
              nameEn: cat.name,
              image: cat.image,
            })),
            {
              id: "sale",
              slug: "sale",
              nameAr: "العروض",
              nameEn: "Sale",
              image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=300&fit=crop&auto=format",
            },
            {
              id: "best-sellers",
              slug: "best-sellers",
              nameAr: "الأكثر مبيعاً",
              nameEn: "Best Sellers",
              image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=300&fit=crop&auto=format",
            },
            {
              id: "new-arrivals",
              slug: "new-arrivals",
              nameAr: "وصل حديثاً",
              nameEn: "New Arrivals",
              image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&auto=format",
            },
          ].map((cat: any, i: number) => (
            <motion.div
              key={cat.id || i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="shrink-0 w-[120px] md:w-[160px]"
            >
              <Link href={`/products?category=${cat.slug}`}>
                <div className="rounded-2xl overflow-hidden cursor-pointer group aspect-square relative shadow-md hover:shadow-xl transition-shadow duration-300">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={isRtl ? (cat.nameAr || cat.nameEn) : cat.nameEn}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <Tag className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center">
                    <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-wide leading-tight drop-shadow-lg">
                      {isRtl ? (cat.nameAr || cat.nameEn) : cat.nameEn}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────── */}
      <section className="bg-black text-white py-6 md:py-8 overflow-hidden">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10 rtl:divide-x-reverse">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 px-4 md:px-6 py-4 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-white">
                      {isRtl ? badge.label_ar : badge.label_en}
                    </p>
                    <p className="text-[10px] text-white/40 font-light leading-tight mt-0.5">
                      {isRtl ? badge.sub_ar : badge.sub_en}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FLASH DEALS ──────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black py-10 md:py-14 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container px-4 relative z-10">
          <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 ${isRtl ? "md:flex-row-reverse text-right" : "text-left"}`}>
            <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="bg-red-500 text-white p-2.5 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {isRtl ? "وقت محدود" : "LIMITED TIME"}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">
                  {isRtl ? "عروض اليوم" : "Today's Deals"}
                </h2>
              </div>
            </div>
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                {isRtl ? "تنتهي خلال" : "Ends in"}
              </span>
              <FlashCountdown endTime={flashEndTime} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : flashDealProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {flashDealProducts.slice(0, 4).map((product: any, i: number) => (
                <motion.div
                  key={product.id || product._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative"
                >
                  {product.discountBadge && (
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      -{product.discountBadge}
                    </div>
                  )}
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 ${isRtl ? "text-right" : "text-left"}`}>
              <p className="text-white/30 text-sm">{isRtl ? "لا توجد منتجات حالياً" : "No products available"}</p>
            </div>
          )}

          <div className={`mt-8 flex ${isRtl ? "justify-start" : "justify-end"}`}>
            <Link href="/products">
              <Button variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-black uppercase text-xs tracking-widest transition-all h-11 px-8">
                {isRtl ? "عرض الكل" : "View All"}
                {isRtl ? <ChevronLeft className="mr-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROMOTIONAL SPLIT BANNERS ─────────────────────── */}
      <section className="py-6 bg-background">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl h-44 md:h-56 bg-gradient-to-br from-black to-gray-800 group cursor-pointer"
            >
              <img src="/hero-banner-4.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" />
              <div className={`absolute inset-0 p-6 flex flex-col justify-end ${isRtl ? "text-right items-end" : "text-left items-start"}`}>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">
                  {isRtl ? "وصل حديثاً" : "NEW IN"}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter">
                  {isRtl ? "أحدث\nالتشكيلات" : "LATEST\nCOLLECTION"}
                </h3>
                <Link href="/products">
                  <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors flex items-center gap-1">
                    {isRtl ? "تسوق الآن" : "Shop Now"} {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* Banner 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl h-44 md:h-56 bg-gradient-to-br from-red-950 to-red-900 group cursor-pointer"
            >
              <img src="/hero-banner-5.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700" />
              <div className={`absolute inset-0 p-6 flex flex-col justify-end ${isRtl ? "text-right items-end" : "text-left items-start"}`}>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.3em] text-red-300/70 mb-1">
                  <Zap className="w-3 h-3" /> {isRtl ? "خصم محدود" : "LIMITED SALE"}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter">
                  {isRtl ? "تخفيضات\nحتى ٥٠٪" : "SALE UP\nTO 50%"}
                </h3>
                <Link href="/products">
                  <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors flex items-center gap-1">
                    {isRtl ? "استكشف" : "Explore"} {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ─────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container px-4">
          <div className={`flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10 ${isRtl ? "md:flex-row-reverse text-right" : "text-left"}`}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground block mb-2">
                {isRtl ? "الأكثر مبيعاً" : "BEST SELLERS"}
              </span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                {isRtl ? "اختيارات\nالعملاء" : "CUSTOMER\nFAVORITES"}
              </h2>
            </div>
            <Link href="/products">
              <Button className="rounded-none bg-foreground text-background font-black uppercase text-xs tracking-widest h-12 px-8 hover:bg-foreground/80 transition-all">
                {isRtl ? "عرض الكل" : "View All"}
                {isRtl ? <ChevronLeft className="mr-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {(bestSellers.length > 0 ? bestSellers : featuredProducts).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-24 ${isRtl ? "text-right" : "text-left"}`}>
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <p className="text-muted-foreground text-sm font-light">
                {isRtl ? "لا توجد منتجات حالياً — ترقب وصولها قريباً!" : "No products yet — stay tuned!"}
              </p>
              <Link href="/products">
                <Button className="mt-6 bg-foreground text-background rounded-none">
                  {isRtl ? "استكشف المتجر" : "Explore Store"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-10">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "+١٠٠٠", num_en: "1,000+", label_ar: "عميل سعيد", label_en: "Happy Customers" },
              { num: "+٢٠٠", num_en: "200+", label_ar: "منتج متاح", label_en: "Products Available" },
              { num: "٩٩٪", num_en: "99%", label_ar: "رضا العملاء", label_en: "Customer Satisfaction" },
              { num: "٢-٤", num_en: "2-4", label_ar: "أيام توصيل", label_en: "Days Delivery" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                  {isRtl ? stat.num : stat.num_en}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">
                  {isRtl ? stat.label_ar : stat.label_en}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TABBY & TAMARA PAYMENT INTEGRATION BANNER ───────── */}
      <section className="relative overflow-hidden bg-[#060a12] py-14 md:py-20">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#3bff9d]/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#9b6dff]/5 blur-[100px] pointer-events-none" />

        <div className="container px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">
              {isRtl ? "طرق الدفع المرنة" : "Flexible Payment"}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-3">
              {isRtl ? (
                <>اشتري الآن<br /><span className="text-white/30">وادفع لاحقاً</span></>
              ) : (
                <>Buy Now<br /><span className="text-white/30">Pay Later</span></>
              )}
            </h2>
            <p className="text-white/30 text-sm max-w-md mx-auto font-light">
              {isRtl
                ? "قسّم مشترياتك على أقساط مريحة بدون فوائد مع تابي وتمارا"
                : "Split your purchases into easy installments with no interest via Tabby & Tamara"}
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">

            {/* ── TABBY CARD ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="group relative rounded-2xl overflow-hidden border border-[#3bff9d]/20 hover:border-[#3bff9d]/50 transition-all duration-500 bg-gradient-to-br from-[#0d1f17] via-[#0a1a12] to-[#060e0a]">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3bff9d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Top accent line */}
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#3bff9d] to-transparent" />

                  <div className="p-7 md:p-8 relative">
                    {/* Logo + Badge */}
                    <div className={`flex items-center justify-between mb-7 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <div className="bg-[#182430] rounded-xl px-5 py-3 border border-[#3bff9d]/20 group-hover:border-[#3bff9d]/40 transition-all">
                        <img src="/uploads/tabby-logo.png" alt="Tabby" className="h-7 w-auto object-contain" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3bff9d]/10 border border-[#3bff9d]/20 text-[#3bff9d] text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3bff9d] animate-pulse" />
                        {isRtl ? "متاح الآن" : "Available Now"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl md:text-2xl font-black text-white mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                      {isRtl ? "٤ أقساط بدون فوائد" : "4 Payments, Zero Interest"}
                    </h3>
                    <p className={`text-white/40 text-sm mb-6 ${isRtl ? "text-right" : "text-left"}`}>
                      {isRtl
                        ? "قسّم مبلغ فاتورتك على ٤ دفعات شهرية متساوية"
                        : "Split your bill into 4 equal monthly payments"}
                    </p>

                    {/* Installment Visual */}
                    <div className="flex gap-2 mb-6" dir="ltr">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-full h-1.5 rounded-full ${n === 1 ? "bg-[#3bff9d]" : "bg-[#3bff9d]/20"}`} />
                          <span className={`text-[9px] font-black ${n === 1 ? "text-[#3bff9d]" : "text-white/20"}`}>
                            {n === 1 ? (isRtl ? "الآن" : "Today") : `+${(n - 1) * 30}d`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Feature pills */}
                    <div className={`flex flex-wrap gap-2 mb-7 ${isRtl ? "flex-row-reverse" : ""}`}>
                      {[
                        isRtl ? "بدون فوائد" : "0% Interest",
                        isRtl ? "موافقة فورية" : "Instant Approval",
                        isRtl ? "آمن ومضمون" : "Secure",
                      ].map((feat) => (
                        <span key={feat} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold">
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="text-[#3bff9d] text-sm font-black flex items-center gap-1.5">
                        {isRtl ? "اعرف أكثر" : "Learn More"}
                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>
                </div>
            </motion.div>

            {/* ── TAMARA CARD ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="group relative rounded-2xl overflow-hidden border border-[#9b6dff]/20 hover:border-[#9b6dff]/50 transition-all duration-500 bg-gradient-to-br from-[#140d24] via-[#10091e] to-[#0a0612]">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9b6dff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Top accent line */}
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#9b6dff] to-transparent" />

                  <div className="p-7 md:p-8 relative">
                    {/* Logo + Badge */}
                    <div className={`flex items-center justify-between mb-7 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <div className="bg-[#F3EEFB] rounded-xl px-5 py-3 border border-[#9b6dff]/20 group-hover:border-[#9b6dff]/40 transition-all">
                        <img src="/uploads/tamara-logo.png" alt="Tamara" className="h-7 w-auto object-contain" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#9b6dff]/10 border border-[#9b6dff]/20 text-[#b48cff] text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9b6dff] animate-pulse" />
                        {isRtl ? "متاح الآن" : "Available Now"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl md:text-2xl font-black text-white mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                      {isRtl ? "٣ أقساط بدون فوائد" : "3 Payments, Zero Interest"}
                    </h3>
                    <p className={`text-white/40 text-sm mb-6 ${isRtl ? "text-right" : "text-left"}`}>
                      {isRtl
                        ? "قسّم طلبك على ٣ دفعات شهرية مريحة وبدون رسوم"
                        : "Split your order into 3 comfortable monthly payments with no fees"}
                    </p>

                    {/* Installment Visual */}
                    <div className="flex gap-2 mb-6" dir="ltr">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-full h-1.5 rounded-full ${n === 1 ? "bg-[#9b6dff]" : "bg-[#9b6dff]/20"}`} />
                          <span className={`text-[9px] font-black ${n === 1 ? "text-[#b48cff]" : "text-white/20"}`}>
                            {n === 1 ? (isRtl ? "الآن" : "Today") : `+${(n - 1) * 30}d`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Feature pills */}
                    <div className={`flex flex-wrap gap-2 mb-7 ${isRtl ? "flex-row-reverse" : ""}`}>
                      {[
                        isRtl ? "بدون فوائد" : "0% Interest",
                        isRtl ? "موافقة سريعة" : "Quick Approval",
                        isRtl ? "مرخص ومنظم" : "Regulated",
                      ].map((feat) => (
                        <span key={feat} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold">
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="text-[#b48cff] text-sm font-black flex items-center gap-1.5">
                        {isRtl ? "اعرف أكثر" : "Learn More"}
                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>
                </div>
            </motion.div>
          </div>

          {/* Bottom trust row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10"
          >
            {[
              { icon: "🛡️", ar: "دفع آمن ومشفر", en: "Encrypted & Secure" },
              { icon: "⚡", ar: "موافقة خلال ثوانٍ", en: "Approved in Seconds" },
              { icon: "🔁", ar: "بدون أي رسوم خفية", en: "No Hidden Fees" },
              { icon: "📱", ar: "يعمل على جميع الأجهزة", en: "Works on All Devices" },
            ].map((item) => (
              <div key={item.ar} className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-white/30 text-xs font-bold">{isRtl ? item.ar : item.en}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BRAND MANIFESTO CTA ───────────────────────────── */}
      <section className="relative py-32 md:py-48 overflow-hidden bg-black">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src="/hero-banner-2.png" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />

        <div className="container px-4 relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-10">
              <img src={logoImg} alt="Qirox" className="h-16 md:h-20 w-auto opacity-90 rounded-sm" />
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
              {isRtl ? (
                <>بناء الأنظمة<br /><span className="text-white/40">بلمسة إنسانية</span></>
              ) : (
                <>Build Systems<br /><span className="text-white/40">Stay Human</span></>
              )}
            </h2>
            <p className="text-white/40 text-lg md:text-xl font-light italic mb-12 max-w-2xl mx-auto leading-relaxed">
              {isRtl
                ? "نؤمن أن الجودة الحقيقية تلمس القلب قبل أن تلمس العين. كل قطعة تحكي قصة."
                : "We believe true quality touches the heart before the eye. Every piece tells a story."}
            </p>
            <Link href="/products">
              <Button
                size="lg"
                className="h-16 md:h-20 px-12 md:px-20 text-xs md:text-sm font-black uppercase tracking-[0.4em] rounded-none bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all duration-500"
              >
                <ShoppingBag className={`${isRtl ? "ml-3" : "mr-3"} h-5 w-5`} />
                {isRtl ? "ابدأ التسوق الآن" : "Start Shopping Now"}
              </Button>
            </Link>

            {/* Payment Methods */}
            <div className="mt-16 pt-10 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">
                {isRtl ? "نقبل جميع وسائل الدفع" : "We Accept All Payment Methods"}
              </p>
              <div className="flex justify-center flex-wrap gap-4">
                {[
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/apps/296480bb-8f91-40d7-884d-496b563c1629.jpg",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/apple_pay.svg",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/mada-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/visa-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/mastercard-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/stc_pay.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/tabby2.svg",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/tamara2.svg",
                ].map((src, i) => (
                  <div key={i} className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/15 transition-all">
                    <img src={src} alt="" className="h-7 w-7 object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
