/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { Download, Edit3 } from "lucide-react";
import { shippingTemplate } from "@/assets/docs/shipping";

export default function SVGDocumentEditor() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Company details (non-editable)
  const companyDetails = {
    Website_name: "MyCargoRoute",
    Website_email: "ship@mycargoroute.com",
    Website_link: "www.mycargoroute.com",
    Invoice_date: new Date().toLocaleDateString(),
    Invoice_No: Math.floor(100000 + Math.random() * 900000).toString(),
    Tracking_ID: Array.from(crypto.getRandomValues(new Uint8Array(10))).join('-'),
  };

  // Editable form data
  const [formData, setFormData] = useState({
    Sender_name: "George",
    Sender_email: "george@gmail.com",
    Recipient_name: "Joe Johnson",
    Recipient_address: "123 Any street, London, UK",
    Recipient_email: "joejohnson@gmail.com",
    Package_content: "gold",
    Package_weight: "100kg",
    Shiping_fee: "$88,000.00",
    Tax_fee: "$12,000.00",
    Total_fee: "$100,000.00",
  });

  // Inject SVG once on mount
  useEffect(() => {
    const container = svgRef.current;

    if (container && !container.querySelector("svg")) {
      container.innerHTML = shippingTemplate;
      updateSVGContent();
    }
  }, []);

  // Update SVG content dynamically
  const updateSVGContent = () => {
    const container = svgRef.current;
    const svgElement = container?.querySelector("svg");

    if (!svgElement) return;

    // Set company details
    Object.entries(companyDetails).forEach(([key, value]) => {
      const el = svgElement.getElementById(key);
      if (el) el.textContent = value;
    });

    // Set editable form data
    Object.entries(formData).forEach(([key, value]) => {
      const el = svgElement.getElementById(key);
      if (el) el.textContent = value;
    });
  };

  // Trigger SVG update when formData changes
  useEffect(() => {
    updateSVGContent();
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const downloadSVG = () => {
    const svgElement = svgRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shipping-document.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-12 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Shipping Document Editor
          </h2>
          <p className="text-gray-300">
            Edit shipping details and see changes in real-time
          </p>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Edit Shipping Details
              </h3>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-white capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      placeholder={key.replace(/_/g, " ")}
                      type="text"
                      value={value}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg bg-white/10 border text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                        selectedField === key
                          ? "border-primary focus:ring-primary bg-primary/10"
                          : "border-white/20 focus:ring-primary/50"
                      }`}
                      onFocus={() => setSelectedField(key)}
                      onBlur={() => setSelectedField(null)}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={downloadSVG}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Document
              </button>
            </div>
          </div>

          {/* SVG Preview */}
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Document Preview
              </h3>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div
                className="w-full overflow-auto max-h-96"
                ref={svgRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}