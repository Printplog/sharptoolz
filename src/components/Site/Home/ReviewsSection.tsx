import { motion, useMotionValue, animate } from "framer-motion";
import { Star, User, Quote } from "lucide-react";
import SectionPadding from "@/layouts/SectionPadding";
import { useState, useEffect, useRef } from "react";

interface Review {
  id: string;
  rating: number;
  testimonial: string;
  userName: string;
  itemName: string;
}

const mockReviews: Review[] = [
  {
    id: "REV-1",
    rating: 5,
    testimonial: "This tool saved me hours of work! The invoice generator is incredibly easy to use and produces professional-looking documents instantly.",
    userName: "Sarah Johnson",
    itemName: "Utility Bill Tool"
  },
  {
    id: "REV-2",
    rating: 5,
    testimonial: "I've been using this for all my contract needs. The templates are well-designed and the customization options are fantastic.",
    userName: "Michael Chen",
    itemName: "Contract Tool"
  },
  {
    id: "REV-3",
    rating: 5,
    testimonial: "As a freelancer, this has become an essential part of my workflow. Quick, reliable, and professional results every time.",
    userName: "Emily Rodriguez",
    itemName: "Shipping Label Tool"
  },
  {
    id: "REV-4",
    rating: 5,
    testimonial: "The report generator is amazing! I can create detailed reports in minutes instead of hours. Highly recommend!",
    userName: "David Thompson",
    itemName: "Bank Statement Tool"
  },
  {
    id: "REV-5",
    rating: 5,
    testimonial: "Perfect for my small business. The document quality is excellent and the pricing is very reasonable.",
    userName: "Lisa Anderson",
    itemName: "Tax Return Tool"
  },
  {
    id: "REV-6",
    rating: 5,
    testimonial: "I love how intuitive the interface is. Even my team members who aren't tech-savvy can use it without any training.",
    userName: "James Wilson",
    itemName: "Identity Verification Tool"
  },
  {
    id: "REV-7",
    rating: 5,
    testimonial: "The best document generation tool I've used. Fast, reliable, and the output always looks professional.",
    userName: "Maria Garcia",
    itemName: "Invoice Pro Tool"
  },
  {
    id: "REV-8",
    rating: 5,
    testimonial: "This has streamlined our entire document creation process. We've saved so much time and money!",
    userName: "Robert Brown",
    itemName: "Shipping Label Tool"
  },
  {
    id: "REV-9",
    rating: 5,
    testimonial: "The customization options are incredible. I can create exactly what I need for each client without any hassle.",
    userName: "Jennifer Lee",
    itemName: "Utility Bill Tool"
  }
];

const getColumnReviews = (columnIndex: number): Review[] => {
  return mockReviews.filter((_, index) => index % 3 === columnIndex);
};

export default function ReviewsSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const column1Reviews = getColumnReviews(0);
  const column2Reviews = getColumnReviews(1);
  const column3Reviews = getColumnReviews(2);

  const duplicateReviews = (reviews: Review[]) => [...reviews, ...reviews, ...reviews];

  const column1 = duplicateReviews(column1Reviews);
  const column2 = duplicateReviews(column2Reviews);
  const column3 = duplicateReviews(column3Reviews);

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className={`
      group relative bg-[#0A0D11]/40 border border-white/10 hover:border-primary/30 rounded-3xl p-8 transition-all duration-500 overflow-hidden flex flex-col min-h-[260px]
      ${isMobile ? 'w-[320px] shrink-0 backdrop-blur-md shadow-lg mr-6 mb-0' : 'backdrop-blur-xl shadow-2xl mb-6'}
      will-change-transform whitespace-normal
    `}>
      <div className="absolute inset-0 bg-linear-to-b from-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex gap-1">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary shadow-[0_0_8px_rgba(206,232,140,0.5)]" />
          ))}
        </div>
      </div>

      <div className="relative mb-8 flex-1 z-10">
        <Quote className="absolute -top-4 -left-4 w-12 h-12 text-white/3 rotate-12 group-hover:text-primary/5 transition-colors" />
        <p className="text-white/60 text-[13px] leading-relaxed font-medium italic relative z-10">
          &ldquo;{review.testimonial}&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-4 border-t border-white/5 pt-6 mt-auto relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all">
          <User className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xs uppercase tracking-wider group-hover:text-primary/90 transition-colors">
            {review.userName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{review.itemName}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const ScrollingColumn = ({ 
    reviews, 
    speed,
    reverse = false
  }: { 
    reviews: Review[]; 
    speed: number;
    reverse?: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const [totalHeight, setTotalHeight] = useState(0);

    useEffect(() => {
      if (containerRef.current) {
        setTotalHeight(containerRef.current.scrollHeight / 3);
      }
    }, [reviews]);

    useEffect(() => {
      if (totalHeight === 0) return;

      const animateLoop = () => {
        if (isHovered) return;
        
        const currentY = y.get();

        if (reverse) {
          if (currentY >= 0) y.set(-totalHeight);
          return animate(y, 0, {
            duration: speed,
            ease: "linear",
            onComplete: () => {
              y.set(-totalHeight);
              animateLoop();
            }
          });
        } else {
          if (currentY <= -totalHeight) y.set(0);
          return animate(y, -totalHeight, {
            duration: speed,
            ease: "linear",
            onComplete: () => {
              y.set(0);
              animateLoop();
            }
          });
        }
      };

      const controls = animateLoop();
      return () => controls?.stop();
    }, [isHovered, totalHeight, speed, reverse, y]);

    return (
      <div
        className="relative h-[700px] overflow-hidden rounded-[40px] border border-white/3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-[#0A0D11] via-[#0A0D11]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#0A0D11] via-[#0A0D11]/80 to-transparent z-10 pointer-events-none" />

        <motion.div
          ref={containerRef}
          style={{ y }}
          className="flex flex-col px-2"
        >
          {reviews.map((review, index) => (
            <ReviewCard key={`${review.id}-${index}`} review={review} />
          ))}
        </motion.div>
      </div>
    );
  };

  const HorizontalScrollingRow = ({ 
    reviews, 
    speed,
    reverse = false 
  }: { 
    reviews: Review[]; 
    speed: number;
    reverse?: boolean;
  }) => {
    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [totalWidth, setTotalWidth] = useState(0);

    useEffect(() => {
      if (containerRef.current) {
        setTotalWidth(containerRef.current.scrollWidth / 3);
      }
    }, [reviews]);

    useEffect(() => {
      if (totalWidth === 0) return;

      const animateLoop = () => {
        const currentX = x.get();
        if (reverse) {
          if (currentX >= 0) x.set(-totalWidth);
          return animate(x, 0, {
            duration: speed,
            ease: "linear",
            onComplete: () => {
              x.set(-totalWidth);
              animateLoop();
            }
          });
        } else {
          if (currentX <= -totalWidth) x.set(0);
          return animate(x, -totalWidth, {
            duration: speed,
            ease: "linear",
            onComplete: () => {
              x.set(0);
              animateLoop();
            }
          });
        }
      };

      const controls = animateLoop();
      return () => controls?.stop();
    }, [totalWidth, speed, reverse, x]);

    return (
      <div className="relative overflow-hidden py-4">
        <motion.div
          ref={containerRef}
          style={{ x }}
          className="flex whitespace-nowrap"
        >
          {reviews.map((review, index) => (
            <ReviewCard key={`${review.id}-h-${index}`} review={review} />
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <SectionPadding className="py-24 relative overflow-hidden" id="feedback">
       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(206,232,140,0.02)_0%,transparent_70%)] pointer-events-none" />

      <div className="z-1 relative">
        <div className="text-center mb-12 md:mb-24 px-4">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-fancy font-black text-white tracking-tighter uppercase italic mb-6 leading-[0.9]">
            User <span className="text-primary">Reviews</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            Join thousands of people generating professional-grade documents 
            through the Form Studio platform. Real feedback from our community.
          </p>
        </div>

        {isMobile ? (
          <div className="space-y-2">
            <HorizontalScrollingRow 
              reviews={duplicateReviews(mockReviews.slice(0, 5))} 
              speed={50} 
            />
            <HorizontalScrollingRow 
              reviews={duplicateReviews(mockReviews.slice(5))} 
              speed={60} 
              reverse={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollingColumn reviews={column1} speed={25} />
            <ScrollingColumn reviews={column2} speed={35} reverse={true} />
            <ScrollingColumn reviews={column3} speed={30} />
          </div>
        )}
      </div>
    </SectionPadding>
  );
}
