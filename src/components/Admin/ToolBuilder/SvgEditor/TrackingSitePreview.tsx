import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, User, Plane, MapPin, Calendar, Clock } from "lucide-react";

interface TrackingSitePreviewProps {
  site: 'parcelfinda' | 'myflightlookup';
}

export default function TrackingSitePreview({ site }: TrackingSitePreviewProps) {
  if (site === 'parcelfinda') {
    return (
      <div className="mt-4 p-4 border border-white/10 rounded-lg bg-white/5">
        <h4 className="text-sm font-medium mb-3 text-white/80">ParcelFinda Preview:</h4>
        <div className="bg-card rounded-2xl shadow-sm border overflow-hidden max-w-md">
          {/* Header Section - Green Gradient */}
          <div className="bg-gradient-to-r from-green-900 to-green-700 text-primary-foreground p-6">
            <div className="flex gap-4 items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">Shipment Tracking</h1>
                <p className="text-primary-foreground/80 text-sm">
                  Real-time package monitoring
                </p>
              </div>
              <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 shrink overflow-hidden">
                <p className="text-xs text-primary-foreground/80">
                  Tracking ID
                </p>
                <p className="font-mono font-semibold text-sm">
                  #ORD123456789
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-primary-foreground/80 text-xs uppercase tracking-wide mb-1">
                  Package
                </p>
                <p className="font-semibold text-sm">Electronics Package</p>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs uppercase tracking-wide mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-100 rounded-full"></div>
                  <p className="font-semibold text-sm">IN TRANSIT</p>
                </div>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs uppercase tracking-wide mb-1">
                  Shipped
                </p>
                <p className="font-semibold text-sm">Dec 15, 2024</p>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs uppercase tracking-wide mb-1">
                  Est. Delivery
                </p>
                <p className="font-semibold text-sm">
                  Dec 18, 2024
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Test Shipment Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-500 font-bold text-sm">
                    Test Environment
                  </p>
                  <p className="text-red-600 font-semibold text-sm">
                    This is a test shipment for demonstration purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Shipment Progress
              </h3>

              <div className="flex items-center justify-between mb-6">
                {["processing", "in_transit", "delivered"].map((status, index) => (
                  <React.Fragment key={status}>
                    <div className="flex flex-col items-center self-start">
                      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index === 1 
                          ? "bg-primary/20 text-primary border-2 border-primary" 
                          : index < 1 
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {status === "processing" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {status === "in_transit" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                        )}
                        {status === "delivered" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {index === 1 && (
                          <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-2 text-center max-w-16">
                        {status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        index < 1 ? "bg-primary" : "bg-muted"
                      }`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Name:</span>
                    <span className="font-semibold text-sm">John Doe</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Email:</span>
                    <span className="font-semibold text-sm">john@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Weight:</span>
                    <span className="font-semibold text-sm">2.5 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Destination:</span>
                    <span className="font-semibold text-sm">New York, NY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (site === 'myflightlookup') {
    return (
      <div className="mt-4 p-4 border border-white/10 rounded-lg bg-white/5">
        <h4 className="text-sm font-medium mb-3 text-white/80">MyFlightLookup Preview:</h4>
        <Card className="overflow-hidden shadow-lg max-w-md">
          <CardHeader className="bg-primary text-white py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Lookup Complete
                  </h1>
                  <p className="text-sm text-white/80">
                    Flight details found
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Flight Details */}
            <div className="space-y-3">
              {[
                { label: "Flight Details", departure: "Los Angeles", arrival: "New York" }
              ].map((flight, index) => (
                <div key={index} className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    {flight.label}:
                  </p>
                  <div className="font-semibold uppercase">
                    <span className="text-muted-foreground text-sm">From </span>
                    <span className="text-primary">{flight.departure}</span>
                    <span className="text-muted-foreground text-sm"> to </span>
                    <span className="text-primary">{flight.arrival}</span>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="bg-primary/10" />

            {/* Booking Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" />
                Booking Details
              </h3>
              <div className="space-y-2">
                <div className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Passenger:
                  </p>
                  <p className="font-semibold uppercase">John Jojo</p>
                </div>
                <div className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Flight Number:
                  </p>
                  <p className="font-semibold uppercase">FL123</p>
                </div>
                <div className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Booking Reference:
                  </p>
                  <p className="font-semibold uppercase">#FL987654321</p>
                </div>
                <div className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Booking Status:
                  </p>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 bg-green-50 text-xs w-fit"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    OK
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 p-2 px-5 border rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Booking Date:
                  </p>
                  <p className="font-semibold uppercase">27 Aug 2025</p>
                </div>
              </div>
            </div>
            <Separator className="bg-primary/10" />

            {/* Test Booking Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-amber-800 font-bold text-sm">
                    Test Booking:
                  </p>
                  <p className="text-amber-800 text-sm">
                    This is a test flight booking.
                    <span className="underline decoration-dotted ml-1">
                      Remove watermark to remove warning.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
