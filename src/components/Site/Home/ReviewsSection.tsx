import { motion, useMotionValue, animate } from "framer-motion";
import { Star } from "lucide-react";
import SectionPadding from "@/layouts/SectionPadding";
import { useState, useEffect, useRef } from "react";

interface Review {
  id: string;
  rating: number;
  testimonial: string;
  userName: string;
  itemName: string;
  date: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    rating: 5,
    testimonial: "This tool saved me hours of work! The invoice generator is incredibly easy to use and produces professional-looking documents instantly.",
    userName: "Sarah Johnson",
    itemName: "Invoice",
    date: "2 days ago"
  },
  {
    id: "2",
    rating: 5,
    testimonial: "I've been using this for all my contract needs. The templates are well-designed and the customization options are fantastic.",
    userName: "Michael Chen",
    itemName: "Contract",
    date: "1 week ago"
  },
  {
    id: "3",
    rating: 5,
    testimonial: "As a freelancer, this has become an essential part of my workflow. Quick, reliable, and professional results every time.",
    userName: "Emily Rodriguez",
    itemName: "Invoice",
    date: "3 days ago"
  },
  {
    id: "4",
    rating: 5,
    testimonial: "The report generator is amazing! I can create detailed reports in minutes instead of hours. Highly recommend!",
    userName: "David Thompson",
    itemName: "Report",
    date: "5 days ago"
  },
  {
    id: "5",
    rating: 5,
    testimonial: "Perfect for my small business. The document quality is excellent and the pricing is very reasonable.",
    userName: "Lisa Anderson",
    itemName: "Invoice",
    date: "1 week ago"
  },
  {
    id: "6",
    rating: 5,
    testimonial: "I love how intuitive the interface is. Even my team members who aren't tech-savvy can use it without any training.",
    userName: "James Wilson",
    itemName: "Contract",
    date: "2 weeks ago"
  },
  {
    id: "7",
    rating: 5,
    testimonial: "The best document generation tool I've used. Fast, reliable, and the output always looks professional.",
    userName: "Maria Garcia",
    itemName: "Report",
    date: "4 days ago"
  },
  {
    id: "8",
    rating: 5,
    testimonial: "This has streamlined our entire document creation process. We've saved so much time and money!",
    userName: "Robert Brown",
    itemName: "Invoice",
    date: "1 week ago"
  },
  {
    id: "9",
    rating: 5,
    testimonial: "The customization options are incredible. I can create exactly what I need for each client without any hassle.",
    userName: "Jennifer Lee",
    itemName: "Contract",
    date: "6 days ago"
  },
  {
    id: "10",
    rating: 5,
    testimonial: "As a consultant, I generate dozens of documents weekly. This tool has been a game-changer for my productivity.",
    userName: "Christopher Martinez",
    itemName: "Report",
    date: "3 days ago"
  },
  {
    id: "11",
    rating: 5,
    testimonial: "The quality of the generated documents is outstanding. My clients are always impressed with the professional appearance.",
    userName: "Amanda White",
    itemName: "Invoice",
    date: "1 week ago"
  },
  {
    id: "12",
    rating: 5,
    testimonial: "I've tried many document generators, but this one is by far the best. The templates are modern and the interface is clean.",
    userName: "Daniel Harris",
    itemName: "Contract",
    date: "2 weeks ago"
  },
  {
    id: "13",
    rating: 5,
    testimonial: "Fast, reliable, and easy to use. Everything I need in a document generation tool. Highly satisfied!",
    userName: "Jessica Taylor",
    itemName: "Report",
    date: "5 days ago"
  },
  {
    id: "14",
    rating: 5,
    testimonial: "The support team is excellent and the tool itself is fantastic. I couldn't be happier with my choice.",
    userName: "Matthew Clark",
    itemName: "Invoice",
    date: "1 week ago"
  },
  {
    id: "15",
    rating: 5,
    testimonial: "This tool has revolutionized how I create documents. The time savings alone make it worth every penny.",
    userName: "Ashley Lewis",
    itemName: "Contract",
    date: "3 days ago"
  }
];

// Distribute reviews across three columns
const getColumnReviews = (columnIndex: number): Review[] => {
  return mockReviews.filter((_, index) => index % 3 === columnIndex);
};

// Generate initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Generate consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "bg-red-500/20 text-red-400 border-red-500/30",
    "bg-teal-500/20 text-teal-400 border-teal-500/30",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ReviewsSection() {
  const column1Reviews = getColumnReviews(0);
  const column2Reviews = getColumnReviews(1);
  const column3Reviews = getColumnReviews(2);

  // Duplicate reviews for seamless infinite scroll
  const duplicateReviews = (reviews: Review[]) => [...reviews, ...reviews];

  const column1 = duplicateReviews(column1Reviews);
  const column2 = duplicateReviews(column2Reviews);
  const column3 = duplicateReviews(column3Reviews);

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/30 rounded-2xl p-6 mb-6 transition-colors duration-300 shadow-lg">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Testimonial */}
      <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
        &ldquo;{review.testimonial}&rdquo;
      </p>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getAvatarColor(review.userName)} shrink-0`}>
          <span className="text-sm font-semibold">
            {getInitials(review.userName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {review.userName}
          </p>
          <p className="text-gray-400 text-xs truncate">
            {review.itemName}
          </p>
        </div>
        <p className="text-gray-400 text-xs whitespace-nowrap">
          {review.date}
        </p>
      </div>
    </div>
  );

  const ScrollingColumn = ({ 
    reviews, 
    speed 
  }: { 
    reviews: Review[]; 
    speed: number;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Calculate the midpoint (half of duplicated reviews)
    const midpoint = reviews.length / 2;
    // Estimate card height (card + margin-bottom) - approximately 200px per card
    const cardHeight = 200;
    const totalHeight = midpoint * cardHeight;

    const y = useMotionValue(0);
    const animationRef = useRef<ReturnType<typeof animate> | null>(null);
    const isHoveredRef = useRef(false);

    useEffect(() => {
      isHoveredRef.current = isHovered;
    }, [isHovered]);

    useEffect(() => {
      const animateLoop = () => {
        if (isHoveredRef.current) return;
        
        const currentY = y.get();
        // Calculate target: move one full cycle down
        const targetY = currentY - totalHeight;
        
        const animation = animate(y, targetY, {
          duration: speed,
          ease: "linear",
        });
        
        animation.then(() => {
          // When animation completes, reset to 0 (seamless because content is duplicated)
          // Only reset if we're not paused
          if (!isHoveredRef.current) {
            y.set(0);
            animateLoop();
          }
        });
        
        animationRef.current = animation;
      };

      if (isHovered) {
        // Pause: stop animation but keep current position (don't reset anything)
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } else {
        // Resume: continue from exact current position without any reset
        animateLoop();
        
        return () => {
          if (animationRef.current) {
            animationRef.current.stop();
            animationRef.current = null;
          }
        };
      }
    }, [isHovered, y, totalHeight, speed]);

    return (
      <div
        className="relative h-[600px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Gradient Mask */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        
        {/* Bottom Gradient Mask */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          style={{ y }}
          className="flex flex-col"
        >
          {reviews.map((review, index) => (
            <ReviewCard key={`${review.id}-${index}`} review={review} />
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <SectionPadding className="py-20 relative overflow-hidden">
      <div className="z-[1] relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Success Stories
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-4 rounded-full" />
          <h3 className="text-xl lg:text-2xl text-primary font-semibold mb-4">
            Real Reunions, Real Joy
          </h3>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            See what our users are saying about their experience creating professional documents with Sharptoolz.
          </p>
        </div>

        {/* Three Column Scrolling Reviews */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <ScrollingColumn reviews={column1} speed={15} />
          <ScrollingColumn reviews={column2} speed={25} />
          <ScrollingColumn reviews={column3} speed={30} />
        </div>
      </div>
    </SectionPadding>
  );
}

