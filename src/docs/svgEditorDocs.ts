import type { DocSection } from "@/types";

export const svgEditorDocs: DocSection[] = [
  {
    id: "intro",
    title: "Introduction",
    content: "The SVG Editor allows you to create interactive templates by adding special extensions to SVG element IDs. These extensions define how elements behave in the form interface.",
  },
  {
    id: "text-fields",
    title: ".text Extension",
    content: "Creates a text input field from an SVG element.",
    codeExamples: [
      { 
        title: "Text Field", 
        code: "Company_Name.text",
        description: "Creates a text input field with the label 'Company Name'"
      }
    ]
  },
  {
    id: "textarea-fields",
    title: ".textarea Extension",
    content: "Creates a multi-line text area from an SVG element.",
    codeExamples: [
      { 
        title: "Textarea Field", 
        code: "Description.textarea",
        description: "Creates a multi-line text area with the label 'Description'"
      }
    ]
  },
  {
    id: "number-fields",
    title: ".number Extension",
    content: "Creates a number input field from an SVG element.",
    codeExamples: [
      { 
        title: "Number Field", 
        code: "Quantity.number",
        description: "Creates a number input field"
      }
    ]
  },
  {
    id: "email-fields",
    title: ".email Extension",
    content: "Creates an email input field with validation from an SVG element.",
    codeExamples: [
      { 
        title: "Email Field", 
        code: "Contact_Email.email",
        description: "Creates an email input field with validation"
      }
    ]
  },
  {
    id: "select-fields",
    title: ".select_ Extension",
    content: "Create dropdown fields by using the .select_ pattern for multiple related elements. The text content of each element becomes the option text.",
    codeExamples: [
      { 
        title: "Dropdown Options", 
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered",
        description: "Creates a dropdown with three options"
      }
    ]
  },
  {
    id: "hide-fields",
    title: ".hide Extension",
    content: "Create toggleable visibility for elements with the .hide extension. When checked, the element is visible; when unchecked, it's hidden.",
    codeExamples: [
      { 
        title: "Basic Hide", 
        code: "Watermark.hide",
        description: "Creates a checkbox that toggles visibility (hidden by default)"
      },
      { 
        title: "Hidden by Default", 
        code: "Premium_Feature.hide_unchecked",
        description: "Creates a checkbox that toggles visibility (hidden by default)"
      },
      { 
        title: "Visible by Default", 
        code: "Basic_Feature.hide_checked",
        description: "Creates a checkbox that toggles visibility (visible by default)"
      }
    ]
  },
      {
        id: "tracking-id",
        title: ".tracking_id Extension",
        content: "Mark a field as the tracking ID for the template. This field will be used for lookup in tracking sites. Often combined with .link_ to provide direct links to tracking websites.",
        codeExamples: [
          {
            title: "Basic Tracking ID",
            code: "Order_Number.gen.max_10.tracking_id",
            description: "Designates this field as the tracking ID for lookup"
          },
          {
            title: "Tracking ID with Link",
            code: "Order_Number.gen.max_10.tracking_id.link_https://parcelfinda.com/track",
            description: "Tracking ID with a direct link to the tracking website"
          }
        ]
      },
      {
        id: "track-extensions",
        title: ".track_ Extensions",
        content: "Assign specific roles to fields for tracking website display. These extensions must be the LAST extension in the ID chain, after all other extensions like .gen, .max_, .tracking_id, .link_, etc.",
        codeExamples: [
          {
            title: "Customer Name",
            code: "Customer_Name.gen.max_20.track_name",
            description: "Maps this field to display as customer name in tracking sites"
          },
          {
            title: "Tracking ID with Role",
            code: "Order_Number.gen.max_10.tracking_id.track_id",
            description: "Tracking ID field with explicit tracking role (track_ must be last)"
          },
          {
            title: "Package with Link and Role",
            code: "Package_Info.text.link_https://example.com.track_package",
            description: "Package field with link and tracking role (track_ must be last)"
          }
        ]
      },
  {
    id: "max-values",
    title: ".max_ Extension",
    content: "Set maximum length for text fields or maximum value for number fields.",
    codeExamples: [
      { 
        title: "Max Text Length", 
        code: "Description.text.max_100",
        description: "Text field with maximum length of 100 characters"
      },
      { 
        title: "Max Number Value", 
        code: "Quantity.number.max_999",
        description: "Number field with maximum value of 999"
      }
    ]
  },
  {
    id: "dependencies",
    title: ".depends_ Extension",
    content: "Make one field depend on another field's value.",
    codeExamples: [
      { 
        title: "Dependent Field", 
        code: "City.depends_Country",
        description: "The City field's value depends on the Country field"
      }
    ]
  }, 
  {
    id: "generated-values",
    title: ".gen Extension",
    content: "Generate random values for fields.",
    codeExamples: [
      { 
        title: "Random Code", 
        code: "Reference.gen.max_8",
        description: "Generates a random code with maximum length of 8 characters"
      }
    ]
  },
  {
    id: "links",
    title: ".link_ Extension",
    content: "Add external links to fields. Most commonly used with .tracking_id to provide links to tracking websites where users can check their order or flight status.",
    codeExamples: [
      { 
        title: "Tracking ID with Link", 
        code: "Order_Number.gen.max_10.tracking_id.link_https://parcelfinda.com/track",
        description: "Creates a tracking ID field with a link to the ParcelFinda tracking website"
      },
      { 
        title: "Flight Tracking with Link", 
        code: "Booking_Ref.gen.max_8.tracking_id.link_https://myflightlookup.com/track",
        description: "Creates a flight booking reference with a link to the MyFlightLookup tracking website"
      },
      { 
        title: "Simple Link Field", 
        code: "Website_Link.link_https://company.com",
        description: "Creates a field that displays as a clickable link (less common use case)"
      }
    ]
  },
  {
    id: "tracking-websites",
    title: "Tracking Websites",
    content: "Configure SVG templates for use with our tracking websites.",
    subsections: [
      {
        id: "parcelfinda",
        title: "ParcelFinda",
        content: "ParcelFinda is our package tracking website. Use these extensions to map SVG fields to the tracking display. ⚠️ IMPORTANT: .track_ extensions must be the LAST extension in the ID chain.",
        codeExamples: [
          { title: "Tracking ID with Link", code: "Order_Number.gen.max_10.tracking_id.link_https://parcelfinda.com/track", description: "Main tracking ID with link to ParcelFinda (no .track_ extension needed)" },
          { title: "Customer Name", code: "Customer_Name.text.track_name", description: "Customer name display (.track_name must be last)" },
          { title: "Email Address", code: "Email.email.track_email", description: "Contact email (.track_email must be last)" },
          { title: "Package Description", code: "Item.text.track_package", description: "Package description/contents (.track_package must be last)" },
          { title: "Package Weight", code: "Weight.number.track_weight", description: "Weight of the package (.track_weight must be last)" },
          { title: "Destination", code: "Address.textarea.track_destination", description: "Delivery address (.track_destination must be last)" },
          { title: "Shipment Date", code: "Date.date.track_shipment_date", description: "Date the package was shipped (.track_shipment_date must be last)" },
          { title: "Arrival Time", code: "ETA.date.track_arrival", description: "Expected arrival time (.track_arrival must be last)" },
          { title: "Estimated Delivery", code: "Delivery.date.track_estimated_delivery", description: "Estimated delivery date (.track_estimated_delivery must be last)" }
        ]
      },
      {
        id: "myflightlookup",
        title: "MyFlightLookup",
        content: "MyFlightLookup is our flight tracking website. It supports one-way, two-way, and three-way flight itineraries. Use these extensions to map SVG fields to the flight tracking display. ⚠️ IMPORTANT: .track_ extensions must be the LAST extension in the ID chain.",
        codeExamples: [
          { title: "Booking Reference with Link", code: "Booking_Ref.gen.max_8.tracking_id.link_https://myflightlookup.com/track", description: "Main booking reference with link to MyFlightLookup (no .track_ extension needed)" },
          { title: "Passenger Name", code: "Passenger_Name.text.track_name", description: "Passenger name (.track_name must be last)" },
          { title: "Flight Number", code: "FlightNumber.text.track_flight", description: "Flight number/identifier (.track_flight must be last)" },
          { title: "Status", code: "Status.text.track_status", description: "Booking status (.track_status must be last)" },
          { title: "Booking Date", code: "BookingDate.date.track_date", description: "Date of booking (.track_date must be last)" },
          { title: "First Flight - Origin", code: "Departure1.text.track_origin1", description: "First flight departure location (.track_origin1 must be last)" },
          { title: "First Flight - Destination", code: "Arrival1.text.track_destination1", description: "First flight arrival location (.track_destination1 must be last)" },
          { title: "Second Flight - Origin", code: "Departure2.text.track_origin2", description: "Second flight departure location for multi-leg journeys (.track_origin2 must be last)" },
          { title: "Second Flight - Destination", code: "Arrival2.text.track_destination2", description: "Second flight arrival location for multi-leg journeys (.track_destination2 must be last)" },
          { title: "Third Flight - Origin", code: "Departure3.text.track_origin3", description: "Third flight departure location for multi-leg journeys (.track_origin3 must be last)" },
          { title: "Third Flight - Destination", code: "Arrival3.text.track_destination3", description: "Third flight arrival location for multi-leg journeys (.track_destination3 must be last)" }
        ]
      }
    ]
  }
];
