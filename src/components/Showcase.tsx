"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageSquare,
  ShoppingCart,
  Sliders,
  User,
  X,
} from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import BasketballCanvas from "./BasketballCanvas";
import gsap from "gsap";
import FloatingTriangles from "./FloatingTriangles";
import LoadingScreen from "./LoadingScreen";

interface Product {
  id: string;
  name: string;
  subName: string;
  price: string;
  size: string;
  color: string;
  description: string;
}

interface CartItem {
  id: string;
  name: string;
  subName: string;
  price: string;
  color: string;
  cssColor: string;
  quantity: number;
}

interface CartFlight {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  cssColor: string;
}

const PRODUCTS: Product[] = [
  {
    id: "01",
    name: "MOROCCO",
    subName: "MARRAKECH EDITION",
    price: "$34.99",
    size: 'SIZE: 29.5" OFFICIAL',
    color: "#f54900", // Orange
    description:
      "Special Moroccan showcase edition, honoring the rich terracotta clay tones of Marrakech. Hand-stitched full-grain premium leather.",
  },
  {
    id: "02",
    name: "SAHARA",
    subName: "SAHARA GOLDEN DUST",
    price: "$39.99",
    size: 'SIZE: 29.5" OFFICIAL',
    color: "#fdc700", // Yellow
    description:
      "Inspired by the sun-drenched golden dunes of the Sahara, textured with a fine-sand grain grip structure for unmatched outdoor control.",
  },
  {
    id: "03",
    name: "ATLAS",
    subName: "ATLAS CEDAR FORESTS",
    price: "$36.99",
    size: 'SIZE: 29.5" OFFICIAL',
    color: "#016630", // Green
    description:
      "Deep pine and cedar tones celebrating the majestic mountain forests of Atlas. Features enhanced moisture-wicking technology.",
  },
  {
    id: "04",
    name: "BLUE CITY",
    subName: "CHEFCHAOUEN INDIGO",
    price: "$38.99",
    size: 'SIZE: 29.5" OFFICIAL',
    color: "#1447e6", // Blue
    description:
      "A striking tribute to the painted blue streets and rich heritage of Chefchaouen, built with premium composite grip channels.",
  },
  {
    id: "05",
    name: "FEZ ROYAL",
    subName: "FEZ ROYAL OUD SHADOW",
    price: "$45.99",
    size: 'SIZE: 29.5" OFFICIAL',
    color: "#9f0712", // Red
    description:
      "Matte ebony finish with deep-grooved lines, representing the historical tannery craft and modern high-end performance.",
  },
];

const COLOR_PRESETS = [
  {
    id: "orange",
    label: "Orange",
    color: "#f54900",
    cssColor: "oklch(64.6% 0.222 41.116)",
  },
  {
    id: "green",
    label: "Green",
    color: "#016630",
    cssColor: "oklch(44.8% 0.119 151.328)",
  },
  {
    id: "blue",
    label: "Blue",
    color: "#1447e6",
    cssColor: "oklch(48.8% 0.243 264.376)",
  },
  {
    id: "red",
    label: "Red",
    color: "#9f0712",
    cssColor: "oklch(44.4% 0.177 26.899)",
  },
  {
    id: "yellow",
    label: "Yellow",
    color: "#fdc700",
    cssColor: "oklch(85.2% 0.199 91.936)",
  },
];

const isLightColor = (hexColor: string) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150;
};

const parsePrice = (price: string) =>
  Number(price.replace(/[^0-9.]/g, "")) || 0;

export default function Showcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customColor, setCustomColor] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cartFlight, setCartFlight] = useState<CartFlight | null>(null);
  const [cartImpact, setCartImpact] = useState(false);
  const [activeTab, setActiveTab] = useState("products"); // products, customize, contacts
  const [currentScreen, setCurrentScreen] = useState(0); // 0 = Showcase, 1 = Performance Metrics
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const isAnimatingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentProduct = PRODUCTS[currentIndex];

  // Determine actual color being rendered
  const activeColor = customColor || currentProduct.color;
  const activeCssColor =
    COLOR_PRESETS.find(
      (preset) => preset.color.toLowerCase() === activeColor.toLowerCase(),
    )?.cssColor ?? activeColor;
  const basketballRenderScale =
    currentScreen === 1 || currentScreen === 2
      ? 3.4
      : currentScreen === 3
        ? 1.7
        : currentScreen === 4
          ? 1.6
          : 1;
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + parsePrice(item.price) * item.quantity,
    0,
  );

  const leftBgText = "MOR";
  const rightBgText = "CCO";

  const playSound = useCallback(
    (type: "cart" | "color" | "nav" | "panel" | "product") => {
      if (typeof window === "undefined") return;

      const AudioContextConstructor =
        window.AudioContext ||
        (
          window as Window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextConstructor) return;

      const audioContext =
        audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const now = audioContext.currentTime;

      if (type === "cart") {
        const master = audioContext.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        master.gain.setValueAtTime(0.2, now + 0.48);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
        master.connect(audioContext.destination);

        const launch = audioContext.createOscillator();
        const launchGain = audioContext.createGain();
        launch.type = "triangle";
        launch.frequency.setValueAtTime(130, now);
        launch.frequency.exponentialRampToValueAtTime(620, now + 0.28);
        launchGain.gain.setValueAtTime(0.0001, now);
        launchGain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
        launchGain.gain.setValueAtTime(0.13, now + 0.16);
        launchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
        launch.connect(launchGain);
        launchGain.connect(master);
        launch.start(now);
        launch.stop(now + 0.4);

        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        sparkle.type = "sine";
        sparkle.frequency.setValueAtTime(980, now + 0.08);
        sparkle.frequency.exponentialRampToValueAtTime(1540, now + 0.52);
        sparkleGain.gain.setValueAtTime(0.0001, now + 0.08);
        sparkleGain.gain.exponentialRampToValueAtTime(0.055, now + 0.16);
        sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
        sparkle.connect(sparkleGain);
        sparkleGain.connect(master);
        sparkle.start(now + 0.08);
        sparkle.stop(now + 0.64);

        const noiseBuffer = audioContext.createBuffer(
          1,
          Math.floor(audioContext.sampleRate * 1.05),
          audioContext.sampleRate,
        );
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i += 1) {
          const progress = i / noiseData.length;
          const fadeIn = Math.min(1, progress * 8);
          const fadeOut = 1 - progress;
          noiseData[i] = (Math.random() * 2 - 1) * fadeIn * fadeOut;
        }

        const whoosh = audioContext.createBufferSource();
        const whooshFilter = audioContext.createBiquadFilter();
        const whooshGain = audioContext.createGain();
        whoosh.buffer = noiseBuffer;
        whooshFilter.type = "bandpass";
        whooshFilter.frequency.setValueAtTime(520, now + 0.06);
        whooshFilter.frequency.exponentialRampToValueAtTime(3400, now + 0.92);
        whooshFilter.frequency.exponentialRampToValueAtTime(1700, now + 1.16);
        whooshFilter.Q.setValueAtTime(0.65, now);
        whooshGain.gain.setValueAtTime(0.0001, now + 0.04);
        whooshGain.gain.exponentialRampToValueAtTime(0.115, now + 0.22);
        whooshGain.gain.setValueAtTime(0.075, now + 0.76);
        whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.18);
        whoosh.connect(whooshFilter);
        whooshFilter.connect(whooshGain);
        whooshGain.connect(master);
        whoosh.start(now + 0.04);
        whoosh.stop(now + 1.22);

        const bounce = audioContext.createOscillator();
        const bounceGain = audioContext.createGain();
        bounce.type = "square";
        bounce.frequency.setValueAtTime(420, now + 0.96);
        bounce.frequency.exponentialRampToValueAtTime(280, now + 1.04);
        bounceGain.gain.setValueAtTime(0.0001, now + 0.96);
        bounceGain.gain.exponentialRampToValueAtTime(0.055, now + 0.98);
        bounceGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        bounce.connect(bounceGain);
        bounceGain.connect(master);
        bounce.start(now + 0.96);
        bounce.stop(now + 1.12);

        const pop = audioContext.createOscillator();
        const popGain = audioContext.createGain();
        pop.type = "sine";
        pop.frequency.setValueAtTime(740, now + 1.12);
        pop.frequency.exponentialRampToValueAtTime(1480, now + 1.28);
        popGain.gain.setValueAtTime(0.0001, now + 1.12);
        popGain.gain.exponentialRampToValueAtTime(0.16, now + 1.16);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
        pop.connect(popGain);
        popGain.connect(master);
        pop.start(now + 1.12);
        pop.stop(now + 1.5);

        pop.addEventListener("ended", () => {
          master.disconnect();
        });
        return;
      }

      const output = audioContext.createGain();
      output.gain.setValueAtTime(0.0001, now);
      output.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      output.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      output.connect(audioContext.destination);

      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";

      const startFrequency =
        type === "color"
            ? 520
            : type === "product"
              ? 290
              : type === "panel"
                ? 440
                : 220;
      const endFrequency =
        type === "color"
            ? 760
            : type === "product"
              ? 380
              : type === "panel"
                ? 560
                : 300;

      oscillator.frequency.setValueAtTime(startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        endFrequency,
        now + 0.12,
      );
      oscillator.connect(output);
      oscillator.start(now);
      oscillator.stop(now + 0.16);

      oscillator.addEventListener("ended", () => {
        output.disconnect();
      });
    },
    [],
  );

  const handleNext = () => {
    playSound("product");
    setCustomColor(""); // Reset custom color when switching products
    setSelectedColorId("");
    setCurrentIndex((prev) => (prev + 1) % PRODUCTS.length);
  };

  const handlePrev = () => {
    playSound("product");
    setCustomColor(""); // Reset custom color when switching products
    setSelectedColorId("");
    setCurrentIndex((prev) => (prev - 1 + PRODUCTS.length) % PRODUCTS.length);
  };

  const addCurrentProductToCart = () => {
    const itemId = `${currentProduct.id}-${activeColor.toLowerCase()}`;
    setCartItems((items) => {
      const existingItem = items.find((item) => item.id === itemId);
      if (existingItem) {
        return items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...items,
        {
          id: itemId,
          name: currentProduct.name,
          subName: currentProduct.subName,
          price: currentProduct.price,
          color: activeColor,
          cssColor: activeCssColor,
          quantity: 1,
        },
      ];
    });
  };

  const handleAddToCart = () => {
    if (isAdding) return;
    playSound("cart");
    setIsAdding(true);

    const addRect = addButtonRef.current?.getBoundingClientRect();
    const cartRect = cartButtonRef.current?.getBoundingClientRect();

    if (!addRect || !cartRect) {
      addCurrentProductToCart();
      setIsAdding(false);
      return;
    }

    const startX = addRect.left + addRect.width / 2;
    const startY = addRect.top + addRect.height / 2;
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    setCartFlight({
      id: Date.now(),
      startX,
      startY,
      midX: startX + (endX - startX) * 0.64,
      midY: startY + (endY - startY) * 0.46,
      endX,
      endY,
      cssColor: activeCssColor,
    });

    setTimeout(() => {
      addCurrentProductToCart();
      setCartImpact(true);
      setIsAdding(false);
      setTimeout(() => setCartImpact(false), 520);
    }, 1180);
  };

  const removeCartItem = (itemId: string) => {
    playSound("panel");
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const transitionToScreen = useCallback(
    (targetScreen: number) => {
      if (
        isAnimatingRef.current ||
        targetScreen === currentScreen ||
        isCartOpen ||
        isCustomizing
      ) {
        return;
      }

      playSound("nav");
      isAnimatingRef.current = true;
      setCurrentScreen(Math.max(0, Math.min(5, targetScreen)));
    },
    [currentScreen, isCartOpen, isCustomizing, playSound],
  );

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 18) return;

      if (event.deltaY > 0) {
        transitionToScreen(currentScreen + 1);
      } else {
        transitionToScreen(currentScreen - 1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentScreen, transitionToScreen]);

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - touchEndY;

      if (Math.abs(deltaY) < 50) return;
      transitionToScreen(currentScreen + (deltaY > 0 ? 1 : -1));
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentScreen, transitionToScreen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        transitionToScreen(currentScreen + 1);
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        transitionToScreen(currentScreen - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentScreen, transitionToScreen]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const allScreens = [
      ".screen-2-container",
      ".screen-3-container",
      ".screen-4-container",
      ".screen-5-container",
      ".screen-6-container",
    ];
    const targetScreenSelector =
      currentScreen === 0
        ? null
        : `.screen-${currentScreen + 1}-container`;
    const targetContentSelector =
      currentScreen === 0
        ? null
        : `.screen-${currentScreen + 1}-content`;

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    timeline
      .to(allScreens, {
        opacity: 0,
        duration: 0.3,
        pointerEvents: "none",
      }, 0)
      .to(".showcase-header", {
        opacity: currentScreen === 0 ? 1 : 0,
        y: currentScreen === 0 ? 0 : -24,
        duration: 0.35,
        pointerEvents: currentScreen === 0 ? "auto" : "none",
      }, 0)
      .to(".showcase-footer", {
        opacity: currentScreen === 0 ? 1 : 0,
        y: currentScreen === 0 ? 0 : 24,
        duration: 0.35,
        pointerEvents: currentScreen === 0 ? "auto" : "none",
      }, 0)
      .to(".showcase-bg-text", {
        opacity: currentScreen === 0 ? 1 : 0,
        y: currentScreen === 0 ? 0 : -30,
        scale: currentScreen === 0 ? 1 : 0.96,
        duration: 0.45,
      }, 0)
      .to(".showcase-subtext", {
        opacity: currentScreen === 0 ? 1 : 0,
        y: currentScreen === 0 ? 0 : 24,
        duration: 0.35,
      }, 0);

    if (currentScreen === 0) {
      timeline.to(".basketball-container", {
        opacity: 1,
        x: "0%",
        y: "-12px",
        scale: 1,
        duration: 0.65,
        ease: "power2.inOut",
      }, 0);
    } else if (currentScreen === 1) {
      timeline.to(".basketball-container", {
        opacity: 1,
        x: isMobile ? "0%" : "160%",
        y: isMobile ? "-15%" : "-12px",
        scale: isMobile ? 1.4 : 3.4,
        duration: 0.7,
        ease: "power2.inOut",
      }, 0);
    } else if (currentScreen === 2) {
      timeline.to(".basketball-container", {
        opacity: 1,
        x: isMobile ? "0%" : "-160%",
        y: isMobile ? "-15%" : "-12px",
        scale: isMobile ? 1.4 : 3.4,
        duration: 0.7,
        ease: "power2.inOut",
      }, 0);
    } else if (currentScreen === 3) {
      timeline.to(".basketball-container", {
        opacity: 1,
        x: "0%",
        y: isMobile ? "-15%" : "-12px",
        scale: isMobile ? 1.4 : 1.7,
        duration: 0.7,
        ease: "power2.inOut",
      }, 0);
    } else if (currentScreen === 4) {
      timeline.to(".basketball-container", {
        opacity: 1,
        x: "0%",
        y: isMobile ? "-35%" : "-25px",
        scale: isMobile ? 1.3 : 1.6,
        duration: 0.7,
        ease: "power2.inOut",
      }, 0);
    } else {
      timeline.to(".basketball-container", {
        opacity: 0,
        y: "-100%",
        scale: 0,
        duration: 0.65,
        ease: "power2.inOut",
      }, 0);
    }

    if (targetScreenSelector) {
      timeline
        .to(targetScreenSelector, {
          opacity: 1,
          duration: 0.45,
          pointerEvents: "auto",
        }, 0.22)
        .fromTo(
          targetContentSelector,
          { opacity: 0, y: 24, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45 },
          0.25,
        );
    }

    return () => {
      timeline.kill();
    };
  }, [currentScreen]);

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: activeCssColor }}
    >
      <LoadingScreen isLoaded={isModelLoaded} />
      <div
        className={`w-full max-w-[1280px] aspect-[16/10] min-h-[640px] rounded-[28px] bg-[#070707] border border-neutral-900 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col justify-between p-6 md:p-10 relative overflow-hidden transition-all duration-500 ${isCartOpen ? "blur-[5px] scale-[0.985]" : ""
          }`}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none filter blur-[120px] opacity-25 transition-colors duration-1000 z-0"
          style={{
            background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)`,
          }}
        />

        <div className="absolute top-4 left-6 flex gap-1.5 z-30">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>

        <header className="showcase-header absolute top-8 md:top-10 left-6 md:left-10 right-6 md:right-10 flex items-center justify-between z-40 pt-1 border-b border-white/[0.03] pb-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-white animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              role="img"
              aria-label="Slam Dunk Logo"
            >
              <title>Slam Dunk Logo</title>
              <circle cx="12" cy="12" r="10" />
              <path d="M6 12a6 6 0 0 1 12 0" />
              <path d="M12 2a10 10 0 0 1 0 20" />
              <path d="M12 6a6 6 0 0 1 0 12" />
            </svg>
            <span className="font-mono tracking-[0.25em] font-extrabold text-sm text-white select-none">
              SKOUZA
            </span>
          </div>

          <nav className="flex items-center gap-6 md:gap-8">
            <button
              type="button"
              onClick={() => {
                playSound("panel");
                setActiveTab("products");
                setIsCustomizing(false);
                transitionToScreen(0);
              }}
              className={`text-[10px] md:text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${activeTab === "products" && !isCustomizing
                ? "text-[#ff5500]"
                : "text-neutral-400 hover:text-white"
                }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => {
                playSound("panel");
                setActiveTab("customize");
                setIsCustomizing(true);
              }}
              className={`text-[10px] md:text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${isCustomizing || activeTab === "customize"
                ? "text-[#ff5500]"
                : "text-neutral-400 hover:text-white"
                }`}
            >
              Customize
            </button>
            <button
              type="button"
              onClick={() => {
                playSound("panel");
                setActiveTab("contacts");
                setIsCustomizing(false);
              }}
              className={`text-[10px] md:text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${activeTab === "contacts"
                ? "text-[#ff5500]"
                : "text-neutral-400 hover:text-white"
                }`}
            >
              Contacts
            </button>
          </nav>

          <div className="flex items-center gap-4 md:gap-5 text-neutral-300">
            <button
              type="button"
              ref={cartButtonRef}
              onClick={() => {
                playSound("panel");
                setIsCartOpen(true);
              }}
              className={`hover:text-white transition-colors duration-300 relative outline-none p-1.5 hover:bg-white/5 rounded-full ${cartImpact ? "scale-125 text-white" : ""
                }`}
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={18} strokeWidth={2} />
              {cartImpact && (
                <span className="absolute inset-0 rounded-full border border-white/80 animate-ping" />
              )}
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff5500] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative w-full py-4 my-auto min-h-[300px]">
          <div className="showcase-bg-text w-full flex justify-center items-center pointer-events-none select-none z-0">
            <h1 className="flex items-center justify-center font-bebas text-center text-neutral-500 tracking-[0.02em] leading-none text-[26vw] sm:text-[24vw] lg:text-[22vw] xl:text-[300px] uppercase">
              <span className="-translate-x-[14%] whitespace-nowrap">
                {leftBgText}
              </span>
              <div className="w-[2.4em] sm:w-[2.1em] lg:w-[1.95em] xl:w-[200px]" />
              <span className="translate-x-[6%] whitespace-nowrap">
                {rightBgText}
              </span>
            </h1>
          </div>

          <div className="basketball-container absolute inset-0 m-auto w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] lg:w-[390px] lg:h-[390px] z-10 pointer-events-auto flex items-center justify-center -translate-y-3">
            <div className="absolute bottom-4 w-[60%] h-6 bg-black/80 rounded-full blur-xl pointer-events-none z-0" />
            <div className="w-full h-full relative z-10 translate-y-1">
              {!isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-mono text-[10px] tracking-[0.18em] uppercase">
                  Loading
                </div>
              )}
              <BasketballCanvas
                ballColor={activeColor}
                isFloating={currentScreen === 0}
                renderScale={basketballRenderScale}
                onLoaded={() => setIsModelLoaded(true)}
              />
            </div>
          </div>

          <div className="showcase-subtext absolute bottom-[-10px] md:bottom-2 left-1/2 -translate-x-1/2 text-center max-w-[280px] sm:max-w-[420px] z-20 pointer-events-none">
            <p className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
              {currentProduct.subName}
            </p>
            <p className="text-[9px] text-neutral-600 hidden sm:block mt-1 font-sans">
              {currentProduct.description}
            </p>
          </div>
        </div>

        <footer className="showcase-footer flex items-center justify-between w-full z-20 pt-4 border-t border-white/[0.03]">
          <div className="flex flex-col select-none">
            <span className="text-xl md:text-2xl font-extrabold text-white leading-none tracking-tight">
              {currentProduct.price}
            </span>
            <span className="text-[9px] md:text-[10px] font-mono tracking-[0.18em] text-neutral-400 mt-1 uppercase">
              {currentProduct.size}
            </span>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              ref={addButtonRef}
              onClick={handleAddToCart}
              className={`relative overflow-hidden font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase py-3 px-8 md:py-3.5 md:px-10 rounded-lg transition-all duration-500 outline-none select-none cursor-pointer ${isAdding
                ? "bg-[#ff5500] text-white scale-95 shadow-[0_0_46px_rgba(255,85,0,0.8)]"
                : "bg-[#ff5500] text-white hover:bg-[#ff6a18] active:scale-95 shadow-[0_0_30px_rgba(255,85,0,0.35)] hover:shadow-[0_0_40px_rgba(255,85,0,0.65)]"
                }`}
            >
              {isAdding && (
                <span className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                ADD TO CART
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3.5 font-mono text-[10px] md:text-xs">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 outline-none active:scale-90 hover:bg-white/5"
              aria-label="Previous Product"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-neutral-300 tracking-[0.1em] font-semibold">
              {currentProduct.id}
              <span className="text-neutral-600 px-1">/</span>
              {String(PRODUCTS.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 outline-none active:scale-90 hover:bg-white/5"
              aria-label="Next Product"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>

        {/* SCREEN 2: PERFORMANCE METRICS OVERLAY */}
        <div className="screen-2-container absolute inset-0 z-20 pointer-events-none opacity-0 select-none">
          {/* Background Grid Lines (3 columns, unequal rows for vertical content centering) */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-[63%_37%] pointer-events-none z-0">
            {/* Row 1 */}
            <div className="border-r border-b border-white/[0.04]" />
            <div className="border-r border-b border-white/[0.04]" />
            <div className="border-b border-white/[0.04]" />
            {/* Row 2 */}
            <div className="border-r border-white/[0.04]" />
            <div className="border-r border-white/[0.04]" />
            <div className="border-white/[0.04]" />
          </div>

          {/* Content overlay (with padding matching page margins) */}
          <div className="screen-2-content absolute inset-0 p-6 md:p-10 grid grid-cols-3 grid-rows-[63%_37%] z-10 pointer-events-none">
            {/* Row 1, Col 1: Title and Metric 1 */}
            <div className="col-start-1 row-start-1 flex flex-col justify-end pb-8 pr-4">
              {/* Category label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500]" />
                <span className="font-mono text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-[#ff5500] uppercase">
                  Performance Metrics
                </span>
              </div>

              {/* Title */}
              <h2 className="font-bebas text-white text-5xl md:text-6xl lg:text-[76px] leading-[0.85] tracking-[0.02em] uppercase mb-10">
                ELITE<br />CONTROL
              </h2>

              {/* Metric 1 */}
              <div>
                <div className="flex items-baseline text-white">
                  <span className="font-sans font-black text-3xl md:text-[40px] leading-none">100</span>
                  <span className="font-sans font-black text-xl md:text-2xl ml-0.5">%</span>
                </div>
                <span className="block font-mono text-[8px] md:text-[9px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-1">
                  Microfiber Composite
                </span>
                <p className="text-[10px] md:text-[11px] text-neutral-500 mt-2 font-sans leading-relaxed max-w-[280px]">
                  Exclusive coating material providing superior grip management in all weather conditions.
                </p>
              </div>
            </div>

            {/* Row 2, Col 1: Metric 2 and Tiny "Ru" */}
            <div className="col-start-1 row-start-2 flex flex-col justify-start pt-8 pr-4 relative">
              {/* Metric 2 */}
              <div>
                <div className="flex items-baseline text-white">
                  <span className="font-sans font-black text-3xl md:text-[40px] leading-none">0.5</span>
                  <span className="font-sans font-semibold text-base md:text-lg ml-0.5">mm</span>
                </div>
                <span className="block font-mono text-[8px] md:text-[9px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-1">
                  Pebble Depth
                </span>
                <p className="text-[10px] md:text-[11px] text-neutral-500 mt-2 font-sans leading-relaxed max-w-[280px]">
                  Optimized surface texture for precision handling and rotational feedback.
                </p>
              </div>

              {/* Tiny "Ru" bottom left */}
              <div className="font-mono text-[10px] text-neutral-600 font-semibold tracking-wider absolute bottom-0 left-0">
                Ru
              </div>
            </div>
          </div>
        </div>

        {/* SCREEN 3: AERODYNAMICS OVERLAY */}
        <div className="screen-3-container absolute inset-0 z-20 pointer-events-none opacity-0 select-none">
          {/* Background Grid Lines (Horizontal dotted lines) */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-12">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-full border-b border-dashed border-white/[0.07]" />
            ))}
          </div>

          {/* Content overlay (with padding matching page margins) */}
          <div className="screen-3-content absolute inset-0 p-6 md:p-10 flex flex-col items-end justify-center z-10 pointer-events-none">
            
            <div className="max-w-[380px] w-full flex flex-col items-end text-right mt-10">
              {/* Category label (Pill) */}
              <div className="mb-5 border border-white/20 rounded-[20px] px-4 py-1.5 flex items-center justify-center backdrop-blur-sm">
                <span className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-white uppercase">
                  Aerodynamics
                </span>
              </div>

              {/* Title */}
              <h2 className="font-bebas text-white text-5xl md:text-6xl lg:text-[76px] leading-[0.85] tracking-[0.02em] uppercase mb-12 text-right">
                PERFECT<br />FLIGHT
              </h2>

              {/* Metric 1 */}
              <div className="flex items-center gap-5 mb-8 w-full justify-end">
                <div className="flex flex-col items-end">
                  <span className="font-sans font-black text-2xl md:text-[32px] text-white leading-none mb-1">0.85</span>
                  <span className="font-mono text-[7px] md:text-[8px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-1">
                    Drag Coefficient
                  </span>
                </div>
                {/* Indicator dot */}
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center gap-5 mb-12 w-full justify-end">
                <div className="flex flex-col items-end">
                  <span className="font-sans font-black text-2xl md:text-[32px] text-white leading-none mb-1">28.5</span>
                  <span className="font-mono text-[7px] md:text-[8px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-1">
                    Rotational Stability
                  </span>
                </div>
                {/* Indicator dot */}
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] md:text-[11px] text-neutral-400 font-sans leading-relaxed text-right max-w-[320px]">
                Symmetrically balanced weight distribution ensures true flight path and consistent rotation speed, critical for long-range precision.
              </p>
            </div>

            {/* Tiny "Ru" bottom left */}
            <div className="font-mono text-[10px] text-neutral-600 font-semibold tracking-wider absolute bottom-6 md:bottom-10 left-6 md:left-10">
              Ru
            </div>
          </div>
        </div>

        {/* SCREEN 4: TECHNICAL HUD OVERLAY */}
        <div className="screen-4-container absolute inset-0 z-20 pointer-events-none opacity-0 select-none flex items-center justify-center">
          <div className="screen-4-content relative w-full h-full max-w-[1000px] flex items-center justify-center pointer-events-none">
            
            {/* HUD Rings & Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Crosshair Lines */}
              <div className="absolute w-full h-[1px] bg-white/[0.04]" />
              <div className="absolute h-full w-[1px] bg-white/[0.04]" />
              
              {/* Outer Ring */}
              <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[480px] md:h-[480px] lg:w-[540px] lg:h-[540px] rounded-full border border-dashed border-white/10 absolute">
                {/* Orange accent ticks */}
                <div className="absolute top-[14%] left-[14%] w-3 h-[1px] bg-[#ff5500] -rotate-45" />
                <div className="absolute bottom-[14%] right-[14%] w-3 h-[1px] bg-[#ff5500] -rotate-45" />
                <div className="absolute bottom-[14%] left-[14%] w-3 h-[1px] bg-[#ff5500] rotate-45" />
                <div className="absolute top-[14%] right-[14%] w-3 h-[1px] bg-[#ff5500] rotate-45" />
              </div>
              
              {/* Inner Ring */}
              <div className="w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] rounded-full border border-dashed border-white/[0.15] absolute">
                {/* HUD Ticks on Inner Ring */}
                <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-[1px] h-2 bg-neutral-400" />
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-[1px] h-2 bg-neutral-400" />
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-[1px] bg-neutral-400" />
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-[1px] bg-neutral-400" />
              </div>
            </div>

            {/* Annotations */}
            {/* Top Left: Pebble Height */}
            <div className="absolute top-[22%] left-[10%] md:left-[18%]">
              <div className="relative">
                {/* Micro-Texture label */}
                <div className="absolute -top-6 left-12 flex items-end gap-2">
                  <div className="w-[1px] h-3 bg-white/20" />
                  <span className="font-mono text-[6px] md:text-[7px] font-bold tracking-[0.2em] text-neutral-300 uppercase leading-none pb-0.5">
                    Micro-Texture
                  </span>
                </div>
                {/* 1.2mm Block */}
                <div className="flex items-center gap-3">
                  <div className="w-[2px] h-10 bg-white/80" />
                  <div className="flex flex-col">
                    <span className="font-sans font-black text-xl md:text-2xl text-white leading-none">1.2mm</span>
                    <span className="font-mono text-[7px] md:text-[8px] tracking-[0.1em] text-neutral-500 uppercase mt-1">
                      Pebble Height
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Center: Elevation */}
            <div className="absolute left-[5%] md:left-[10%] top-1/2 -translate-y-1/2">
              <span className="font-mono text-[6px] md:text-[7px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                Elevation: 12.5°
              </span>
            </div>

            {/* Right Center: Azimuth */}
            <div className="absolute right-[5%] md:right-[10%] top-1/2 -translate-y-1/2">
              <span className="font-mono text-[6px] md:text-[7px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                Azimuth: 45.2°
              </span>
            </div>

            {/* Bottom Right: Coating Spec */}
            <div className="absolute bottom-[25%] right-[10%] md:right-[18%]">
              <div className="relative">
                {/* High-Tack Block */}
                <div className="flex items-center gap-3 justify-end">
                  <div className="flex flex-col items-end">
                    <span className="font-sans font-black text-xl md:text-2xl text-white leading-none">High-Tack</span>
                    <span className="font-mono text-[7px] md:text-[8px] tracking-[0.1em] text-neutral-500 uppercase mt-1">
                      Coating Spec
                    </span>
                  </div>
                  <div className="w-[2px] h-10 bg-white/80" />
                </div>
                {/* Channel Depth label */}
                <div className="absolute -bottom-8 -left-12">
                  <span className="font-mono text-[6px] md:text-[7px] font-bold tracking-[0.2em] text-neutral-300 uppercase">
                    Channel Depth
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tiny "Ru" bottom left */}
          <div className="font-mono text-[10px] text-neutral-600 font-semibold tracking-wider absolute bottom-6 md:bottom-10 left-6 md:left-10">
            Ru
          </div>
        </div>

        {/* SCREEN 5: THE CHAMPION */}
        <div className="screen-5-container absolute inset-0 z-20 pointer-events-none opacity-0 select-none">
          
          <div className="screen-5-content absolute inset-0 z-10 pointer-events-none">
            {/* Top Center: Title */}
            <div className="absolute top-10 md:top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="font-mono text-[8px] md:text-[10px] font-bold tracking-[0.4em] text-neutral-400 uppercase mb-3">
                Limited Edition
              </span>
              <h2 className="font-bebas text-white text-6xl md:text-[90px] lg:text-[110px] leading-[0.85] tracking-[0.03em] uppercase drop-shadow-2xl">
                The Champion
              </h2>
            </div>
            
            {/* Bottom Left Annotation */}
            <div className="absolute bottom-16 md:bottom-20 left-6 md:left-12 flex flex-col items-start w-[180px] md:w-[220px]">
              <span className="font-mono text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-[#ff5500] uppercase mb-2">
                Rank 01
              </span>
              <span className="font-sans font-black text-xl md:text-2xl text-white leading-none mb-3">
                Elite Tier
              </span>
              <p className="text-[9px] md:text-[10px] text-neutral-500 font-sans leading-relaxed text-left">
                Constructed for the highest level of competition.
              </p>
            </div>

            {/* Bottom Right Annotation */}
            <div className="absolute bottom-16 md:bottom-20 right-6 md:right-12 flex flex-col items-end w-[180px] md:w-[220px]">
              <span className="font-mono text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-[#ff5500] uppercase mb-2">
                Certified
              </span>
              <span className="font-sans font-black text-xl md:text-2xl text-white leading-none mb-3">
                Gold Standard
              </span>
              <p className="text-[9px] md:text-[10px] text-neutral-500 font-sans leading-relaxed text-right">
                Meets all regulation weight and size requirements.
              </p>
            </div>
          </div>

          {/* Bottom Center: CSS 3D Pedestal */}
          <div className="champion-pedestal absolute bottom-[-40px] md:bottom-[-60px] left-1/2 -translate-x-1/2 flex flex-col items-center z-1">
            {/* Top Tier (Smallest) */}
            <div className="relative w-[240px] md:w-[340px] h-[80px] md:h-[110px] -mb-[50px] md:-mb-[68px] z-30">
              {/* Bottom Face */}
              <div className="absolute bottom-0 w-full h-[50px] md:h-[66px] rounded-[50%] bg-gradient-to-r from-[#080808] via-[#555] to-[#080808]" />
              {/* Body */}
              <div className="absolute top-[25px] md:top-[33px] bottom-[25px] md:bottom-[33px] w-full bg-gradient-to-r from-[#080808] via-[#555] to-[#080808]" />
              {/* Top Face with bright ring */}
              <div className="absolute top-0 w-full h-[50px] md:h-[66px] rounded-[50%] bg-[#1a1a1a] border-[3px] md:border-[4px] border-white/80 shadow-[inset_0_15px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.1)]" />
            </div>

            {/* Middle Tier */}
            <div className="relative w-[380px] md:w-[520px] h-[100px] md:h-[140px] -mb-[60px] md:-mb-[86px] z-20">
              {/* Bottom Face */}
              <div className="absolute bottom-0 w-full h-[66px] md:h-[90px] rounded-[50%] bg-gradient-to-r from-[#030303] via-[#333] to-[#030303]" />
              {/* Body */}
              <div className="absolute top-[33px] md:top-[45px] bottom-[33px] md:bottom-[45px] w-full bg-gradient-to-r from-[#030303] via-[#333] to-[#030303]" />
              {/* Top Face */}
              <div className="absolute top-0 w-full h-[66px] md:h-[90px] rounded-[50%] bg-[#111] border-t border-white/10 shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)]" />
            </div>

            {/* Bottom Tier (Largest) */}
            <div className="relative w-[550px] md:w-[780px] h-[140px] md:h-[200px] z-10">
              {/* Bottom Face */}
              <div className="absolute bottom-0 w-full h-[90px] md:h-[130px] rounded-[50%] bg-gradient-to-r from-[#000] via-[#222] to-[#000]" />
              {/* Body */}
              <div className="absolute top-[45px] md:top-[65px] bottom-[45px] md:bottom-[65px] w-full bg-gradient-to-r from-[#000] via-[#222] to-[#000]" />
              {/* Top Face */}
              <div className="absolute top-0 w-full h-[90px] md:h-[130px] rounded-[50%] bg-[#0a0a0a] border-t border-white/[0.06] shadow-[inset_0_30px_70px_rgba(0,0,0,1)]" />
            </div>
          </div>

          {/* Tiny "Ru" bottom left */}
          <div className="font-mono text-[10px] text-neutral-600 font-semibold tracking-wider absolute bottom-6 md:bottom-10 left-6 md:left-10 z-30">
            Ru
          </div>
        </div>

        {/* SCREEN 6: DEFY GRAVITY */}
        <div className="screen-6-container absolute inset-0 z-20 pointer-events-none opacity-0 select-none overflow-hidden bg-black/40">
          
          {/* Background Floating Triangles */}
          <div className="absolute inset-0 z-0">
            <FloatingTriangles />
          </div>

          <div className="screen-6-content absolute inset-0 z-10 flex flex-col items-center justify-center pt-10">
            {/* Tag / Pill */}
            <div className="border border-[#ff5500] rounded-full px-4 py-1.5 mb-6 bg-black/20 backdrop-blur-sm z-10">
              <span className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-[#ff5500] uppercase">
                Next Level Performance
              </span>
            </div>

            {/* Typography DEFY GRAVITY */}
            <div className="flex flex-col items-center relative z-10 -space-y-4 md:-space-y-8">
              <h1 className="font-bebas text-7xl md:text-[140px] lg:text-[180px] leading-none tracking-normal uppercase text-stroke-1 md:text-stroke-2">
                Defy
              </h1>
              <div className="flex items-end">
                <h1 className="font-bebas text-7xl md:text-[140px] lg:text-[180px] leading-none tracking-tight uppercase text-white drop-shadow-lg">
                  Gravity
                </h1>
                <div className="w-4 h-4 md:w-8 md:h-8 bg-[#ff5500] ml-2 md:ml-4 mb-2 md:mb-5 shadow-[0_0_20px_#ff5500]" />
              </div>
            </div>

            {/* Divider Line & Links */}
            <div className="w-[85%] md:w-[70%] max-w-[800px] border-t border-white/[0.08] mt-16 md:mt-24 pt-6 flex flex-col md:flex-row items-center justify-between z-10">
              <div className="flex items-center gap-6 md:gap-10 mb-6 md:mb-0">
                <div className="flex items-center gap-2 group cursor-pointer pointer-events-auto">
                  <div className="w-1 h-1 rounded-full bg-[#ff5500] group-hover:scale-150 transition-transform" />
                  <span className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors uppercase">
                    Official Store
                  </span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer pointer-events-auto">
                  <div className="w-1 h-1 rounded-full bg-[#ff5500] group-hover:scale-150 transition-transform" />
                  <span className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors uppercase">
                    Global Shipping
                  </span>
                </div>
              </div>

              {/* Social Icons (using placeholders or generic icons) */}
              <div className="flex items-center gap-6 mb-6 md:mb-0 pointer-events-auto">
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                </a>
              </div>

              <div className="flex items-center gap-2 group cursor-pointer pointer-events-auto">
                <span className="font-mono text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors uppercase">
                  Secure Checkout
                </span>
              </div>
            </div>

            {/* Shop Collection Button */}
            <div className="mt-10 md:mt-12 z-10 pointer-events-auto">
              <button className="bg-white text-black px-8 py-3 font-sans font-bold text-sm tracking-wider hover:bg-neutral-200 transition-colors">
                SHOP COLLECTION
              </button>
            </div>
          </div>

          {/* Tiny "Ru" bottom left */}
          <div className="font-mono text-[10px] text-neutral-600 font-semibold tracking-wider absolute bottom-6 md:bottom-10 left-6 md:left-10 z-30">
            Ru
          </div>
        </div>

        {/* CUSTOMIZE PANEL DRAWER (Slick overlay sliding in from the right) */}
        {isCustomizing && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-[320px] bg-[#0c0c0cd0] backdrop-blur-xl border-l border-neutral-800/80 p-6 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-300">
            <div>
              {/* Close Button */}
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-white">
                  <Sliders size={16} className="text-[#ff5500]" />
                  <span className="font-mono text-xs tracking-wider uppercase font-semibold">
                    LAB CUSTOMIZE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound("panel");
                    setIsCustomizing(false);
                    if (activeTab === "customize") setActiveTab("products");
                  }}
                  className="text-neutral-400 hover:text-white p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Color Presets */}
              <div className="pt-6">
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-3">
                  Moroccan Presets
                </span>
                <div className="grid grid-cols-5 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => {
                        playSound("color");
                        setCustomColor(preset.color);
                        setSelectedColorId(preset.id);
                      }}
                      className={`w-10 h-10 rounded-full relative transition-all duration-300 border flex items-center justify-center ${selectedColorId === preset.id ||
                        (!selectedColorId &&
                          activeColor.toLowerCase() ===
                            preset.color.toLowerCase())
                        ? "border-white scale-110 shadow-lg shadow-black/50"
                        : "border-transparent hover:scale-105"
                        }`}
                      style={{ backgroundColor: preset.cssColor }}
                      title={preset.label}
                    >
                      {(selectedColorId === preset.id ||
                        (!selectedColorId &&
                          activeColor.toLowerCase() ===
                            preset.color.toLowerCase())) && (
                        <Check
                          size={14}
                          className={
                            isLightColor(preset.color)
                              ? "text-black"
                              : "text-white"
                          }
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Custom Color Hex Input */}
              <div className="pt-6 mt-6 border-t border-white/[0.04]">
                <label
                  htmlFor="rgb-tint-input"
                  className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-3"
                >
                  Advanced RGB Tint
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="rgb-tint-input"
                      type="text"
                      value={activeColor}
                      onChange={(e) => {
                        playSound("color");
                        setCustomColor(e.target.value);
                        setSelectedColorId("");
                      }}
                      placeholder="#FF5500"
                      className="w-full bg-[#131313] border border-neutral-800 rounded-lg py-2 px-3 text-white text-xs font-mono focus:border-neutral-500 outline-none uppercase"
                    />
                  </div>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-800 flex-shrink-0">
                    <input
                      type="color"
                      aria-label="Color picker selector"
                      value={
                        activeColor.startsWith("#") && activeColor.length === 7
                          ? activeColor
                          : "#ff5500"
                      }
                      onChange={(e) => {
                        playSound("color");
                        setCustomColor(e.target.value);
                        setSelectedColorId("");
                      }}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 bg-transparent border-0"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-neutral-500 mt-2 leading-relaxed">
                  Tint the full-grain leather outer body. The metallic black
                  channels and brand details remain dark for contrast.
                </p>
              </div>
            </div>

            {/* Close / Apply button at bottom */}
            <div className="pt-6 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={() => {
                  playSound("panel");
                  setIsCustomizing(false);
                  if (activeTab === "customize") setActiveTab("products");
                }}
                className="w-full bg-white text-black font-mono text-[10px] font-bold tracking-widest py-3 rounded-lg hover:bg-neutral-200 transition-colors uppercase"
              >
                Apply & Close
              </button>
            </div>
          </div>
        )}

        {/* CONTACTS PANEL DRAWER (Slick overlay sliding in from the right) */}
        {activeTab === "contacts" && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-[320px] bg-[#0c0c0cd0] backdrop-blur-xl border-l border-neutral-800/80 p-6 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-300">
            <div>
              {/* Close Button */}
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare size={16} className="text-[#ff5500]" />
                  <span className="font-mono text-xs tracking-wider uppercase font-semibold">
                    GET IN TOUCH
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound("panel");
                    setActiveTab("products");
                  }}
                  className="text-neutral-400 hover:text-white p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Showroom Details */}
              <div className="pt-6 space-y-5">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-1">
                    Showroom Casablanca
                  </span>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    Angle Boulevard de la Corniche et Rue de la Mer,
                    <br />
                    Anfa, Casablanca 20050, Morocco
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-1">
                    Showroom Marrakech
                  </span>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    Rue Yves Saint Laurent, Gueliz,
                    <br />
                    Marrakech 40000, Morocco
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-1">
                    Customer Support
                  </span>
                  <p className="text-xs font-mono text-[#ff5500] hover:underline cursor-pointer">
                    support@slamdunk.ma
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 font-sans">
                    +212 (0) 522 987 654
                  </p>
                </div>
              </div>
            </div>

            {/* Socials & Footer */}
            <div className="pt-6 border-t border-white/[0.04]">
              <div className="flex items-center justify-around text-neutral-400 mb-4">
                <a
                  href="#instagram"
                  className="hover:text-[#ff5500] transition-colors"
                  aria-label="Instagram Profile"
                >
                  <svg
                    className="w-[18px] h-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label="Instagram Logo"
                  >
                    <title>Instagram</title>
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="#website"
                  className="hover:text-[#ff5500] transition-colors"
                >
                  <Globe size={18} />
                </a>
              </div>
              <p className="text-[9px] text-neutral-600 text-center font-mono uppercase tracking-wider">
                © 2026 SLAM DUNK MOROCCO.
              </p>
            </div>
          </div>
        )}
        {/* Dot Navigation Indicators on the right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
          <button
            type="button"
            onClick={() => transitionToScreen(0)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 0 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="Showcase Screen"
          />
          <button
            type="button"
            onClick={() => transitionToScreen(1)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 1 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="Performance Metrics Screen"
          />
          <button
            type="button"
            onClick={() => transitionToScreen(2)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 2 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="Aerodynamics Screen"
          />
          <button
            type="button"
            onClick={() => transitionToScreen(3)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 3 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="Technical HUD Screen"
          />
          <button
            type="button"
            onClick={() => transitionToScreen(4)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 4 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="The Champion Screen"
          />
          <button
            type="button"
            onClick={() => transitionToScreen(5)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentScreen === 5 ? "bg-[#ff5500] scale-125" : "bg-neutral-600 hover:bg-neutral-400"
              }`}
            aria-label="Defy Gravity Screen"
          />
        </div>
      </div>
      {cartFlight && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div
            className="cart-flight-ball"
            onAnimationEnd={(event) => {
              if (event.currentTarget === event.target) {
                setCartFlight(null);
              }
            }}
            style={
              {
                "--cart-flight-color": cartFlight.cssColor,
                "--cart-start-x": `${cartFlight.startX}px`,
                "--cart-start-y": `${cartFlight.startY}px`,
                "--cart-mid-x": `${cartFlight.midX}px`,
                "--cart-mid-y": `${cartFlight.midY}px`,
                "--cart-end-x": `${cartFlight.endX}px`,
                "--cart-end-y": `${cartFlight.endY}px`,
              } as CSSProperties
            }
          >
            <span className="cart-flight-tail" />
            <span className="cart-flight-seam cart-flight-seam-vertical" />
            <span className="cart-flight-seam cart-flight-seam-horizontal" />
            <span className="cart-flight-particle cart-flight-particle-one" />
            <span className="cart-flight-particle cart-flight-particle-two" />
            <span className="cart-flight-particle cart-flight-particle-three" />
          </div>
        </div>
      )}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-300">
          <button
            type="button"
            className="hidden md:block flex-1 cursor-default"
            aria-label="Close cart overlay"
            onClick={() => {
              playSound("panel");
              setIsCartOpen(false);
            }}
          />
          <aside className="w-full sm:w-[450px] h-full bg-[#050505] border-l border-white/10 shadow-[-30px_0_80px_rgba(0,0,0,0.85)] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-[104px] border-b border-white/10 flex items-center justify-between px-8">
              <h2 className="font-bebas text-4xl leading-none tracking-normal text-white uppercase">
                Your Cart ({cartCount})
              </h2>
              <button
                type="button"
                onClick={() => {
                  playSound("panel");
                  setIsCartOpen(false);
                }}
                className="w-9 h-9 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
                aria-label="Close cart"
              >
                <X size={22} strokeWidth={1.6} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-[#171717] border border-white/8 rounded-md p-4 flex items-center gap-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-white/20 hover:bg-[#1d1d1d]"
                  >
                    <div className="w-20 h-20 rounded-md bg-[#242424] flex items-center justify-center shrink-0">
                      <div
                        className="w-11 h-11 rounded-full border-2 shadow-[inset_-12px_-12px_18px_rgba(0,0,0,0.45),0_10px_25px_rgba(0,0,0,0.45)]"
                        style={{
                          backgroundColor: item.cssColor,
                          borderColor: item.cssColor,
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-white text-lg leading-none font-extrabold tracking-wide uppercase truncate">
                            {item.name}
                          </h3>
                          <p className="font-mono text-[11px] text-neutral-400 tracking-[0.18em] uppercase mt-2 truncate">
                            {item.subName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="text-neutral-500 hover:text-white transition-colors shrink-0"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <X size={15} strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between gap-4 mt-4">
                        <span
                          className="font-mono text-[11px] tracking-wider uppercase"
                          style={{ color: item.cssColor }}
                        >
                          {item.color}
                        </span>
                        <div className="flex items-center gap-3">
                          {item.quantity > 1 && (
                            <span className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
                              x{item.quantity}
                            </span>
                          )}
                          <span className="text-white font-mono text-sm font-bold">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center">
                  <ShoppingCart
                    size={34}
                    strokeWidth={1.4}
                    className="text-neutral-700 mb-5"
                  />
                  <p className="font-bebas text-3xl text-white uppercase">
                    Cart Is Empty
                  </p>
                  <p className="font-mono text-[10px] text-neutral-500 tracking-[0.18em] uppercase mt-2">
                    Add a ball to start checkout
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-8 py-8">
              <div className="flex items-end justify-between mb-7">
                <span className="font-mono text-sm text-sky-200 tracking-[0.18em] uppercase">
                  Subtotal
                </span>
                <span className="font-bebas text-4xl text-white leading-none tracking-normal">
                  ${cartSubtotal.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="w-full h-14 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 font-mono text-sm font-extrabold tracking-[0.28em] uppercase"
              >
                Checkout
              </button>
              <p className="font-mono text-[10px] text-neutral-600 tracking-[0.2em] uppercase text-center mt-5">
                Free shipping worldwide
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
