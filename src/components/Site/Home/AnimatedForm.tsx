import { useState, useEffect } from 'react';
import {  User, Building } from 'lucide-react';

export default function AnimatedFormSection() {
  const [animatedText, setAnimatedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const fullText = 'Tech Solutions Inc.';
  const typingSpeed = 120;
  const erasingSpeed = 60;
  const pauseDuration = 2000;

  useEffect(() => {
    let timeout;
    
    if (isTyping) {
      if (animatedText.length < fullText.length) {
        timeout = setTimeout(() => {
          setAnimatedText(fullText.slice(0, animatedText.length + 1));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, pauseDuration);
      }
    } else {
      if (animatedText.length > 0) {
        timeout = setTimeout(() => {
          setAnimatedText(animatedText.slice(0, -1));
        }, erasingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(true);
        }, 500);
      }
    }

    return () => clearTimeout(timeout);
  }, [animatedText, isTyping]);

  return (
    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            See It Work Live
          </h2>
          <p className="text-gray-300 text-lg">
            Fill the form and watch your card update instantly
          </p>
        </div>

        <div className="flex flex-col min-[600px]:flex-row gap-8 lg:gap-16 items-center ">
          {/* Form Section */}
          <div className="order-2 lg:order-1 shrink-0 w-full sm:w-[350px]">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <div className="space-y-6">
                {/* Cardholder Name - Pre-filled */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-base font-medium text-white">
                    <User className="w-5 h-5" />
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value="JOHN ANDERSON"
                    readOnly
                    className="w-full px-4 py-3 rounded-lg bg-primary/20 border border-primary/30 text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Company - Animated */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-base font-medium text-white">
                    <Building className="w-5 h-5" />
                    Company Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={animatedText}
                      readOnly
                      className="w-full px-4 py-3 rounded-lg bg-primary/30 border-2 border-primary text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your company name..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-0.5 h-5 bg-primary animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Card Preview */}
          <div className="order-1 lg:order-2 flex justify-center w-full">
            <div className="relative w-full sm:w-[500px] h-fit">
              {/* Card */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl px-8 py-4 lg:p-10 shadow-2xl border border-gray-700 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-6 right-6 w-20 h-20 rounded-full bg-white/20"></div>
                  <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white/10"></div>
                </div>

                {/* Mastercard Logo */}
                <div className="absolute top-6 right-6 flex items-center">
                  <div className="flex items-center gap-0">
                    <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 -ml-4 opacity-80"></div>
                  </div>
                </div>

                {/* Chip */}
                <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md mt-6 mb-8 shadow-sm"></div>

                {/* Card Number */}
                <div className="mb-8">
                  <div className="text-white text-xl lg:text-2xl font-mono tracking-wider">
                    5555 •••• •••• 1234
                  </div>
                </div>

                {/* Cardholder Name */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Cardholder Name</div>
                  <div className="text-white text-base lg:text-lg font-semibold tracking-wide">
                    JOHN ANDERSON
                  </div>
                </div>

                {/* Company Name - Animated */}
                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Company</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-base lg:text-lg font-semibold tracking-wide transition-all duration-300 ${animatedText ? 'text-primary' : 'text-gray-500'}`}>
                      {animatedText || 'COMPANY NAME'}
                    </div>
                    {animatedText && (
                      <div className="w-0.5 h-5 bg-primary animate-pulse"></div>
                    )}
                  </div>
                </div>

                {/* Exp Date */}
                <div className="absolute bottom-6 right-6">
                  <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">Exp</div>
                  <div className="text-white text-base font-mono">12/28</div>
                </div>
              </div>

              {/* Card Shadow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl -z-10 transform translate-y-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}