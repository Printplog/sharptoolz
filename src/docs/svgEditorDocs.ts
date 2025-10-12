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
    content: "Create dropdown fields by using the .select_ pattern for multiple related elements. The text content of each element becomes the option text. To make a select field trackable, add .track_[role] to ONE of the select options.",
    codeExamples: [
      { 
        title: "Basic Dropdown Options", 
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered",
        description: "Creates a dropdown with three options"
      },
      { 
        title: "Trackable Select Field", 
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered.track_status",
        description: "Creates a dropdown that can be tracked with role 'status'. Only ONE option needs the .track_ extension (track_ must be last)."
      },
      { 
        title: "Airline Selection with Tracking", 
        code: "Airline.select_American\nAirline.select_United\nAirline.select_Delta.track_airline",
        description: "Airline selection dropdown that can be tracked with role 'airline' (track_ must be last)"
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
    id: "editable-extension",
    title: ".editable Extension",
    content: "Marks fields as editable even after document purchase. By default, all fields become non-editable after purchase, but the .editable extension allows specific fields to remain editable. This is useful for fields that users might need to update after purchase, such as status fields, dynamic content, or user-specific information.",
    codeExamples: [
      { 
        title: "Editable Text Field", 
        code: "Status.text.editable",
        description: "Creates a text field that remains editable even after document purchase"
      },
      { 
        title: "Editable Email Field", 
        code: "Contact_Email.email.editable",
        description: "Creates an email field that remains editable after purchase"
      },
      { 
        title: "Editable Number Field", 
        code: "Quantity.number.editable",
        description: "Creates a number field that remains editable after purchase"
      },
      { 
        title: "Editable Textarea", 
        code: "Notes.textarea.editable",
        description: "Creates a textarea field that remains editable after purchase"
      },
      { 
        title: "Editable Select Field", 
        code: "Priority.select_High\nPriority.select_Medium\nPriority.select_Low.editable",
        description: "Creates a select field with options that remains editable after purchase"
      },
      { 
        title: "Editable Date Field", 
        code: "Due_Date.date.editable",
        description: "Creates a date field that remains editable after purchase"
      },
      { 
        title: "Editable Checkbox", 
        code: "Terms_Accepted.checkbox.editable",
        description: "Creates a checkbox that remains editable after purchase"
      },
      { 
        title: "Editable Generated Field", 
        code: "Reference_Number.gen.max_12.editable",
        description: "Creates a generated field that remains editable after purchase (users can regenerate)"
      },
      { 
        title: "Editable File Upload", 
        code: "Updated_Logo.upload.editable",
        description: "Creates a file upload field that remains editable after purchase"
      },
      { 
        title: "Editable Signature Field", 
        code: "Manager_Signature.sign.editable",
        description: "Creates a signature field that remains editable after purchase"
      },
      { 
        title: "Editable with Tracking", 
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered.editable.track_status",
        description: "Creates a select field with tracking role that remains editable after purchase (.editable before .track_status, track_ must be last)"
      },
      { 
        title: "Editable with Multiple Extensions", 
        code: "Tracking_Number.gen.max_15.tracking_id.editable",
        description: "Creates a generated tracking ID field that remains editable after purchase"
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
          { title: "Tracking ID with Link", code: "Tracking_ID.gen.max_12.link_https://parcelfinda.com/track", description: "Main tracking ID with link to ParcelFinda (no .track_ extension needed)" },
          { title: "Recipient Name", code: "Recipient_Name.text.track_name", description: "Recipient name display (.track_name must be last)" },
          { title: "Recipient Email", code: "Recipient_Email.email.track_email", description: "Recipient email address (.track_email must be last)" },
          { title: "Recipient Address", code: "Recipient_Address.text.track_destination", description: "Delivery address (.track_destination must be last)" },
          { title: "Package Content", code: "Package_Content.text.track_package", description: "Package description/contents (.track_package must be last)" },
          { title: "Package Weight", code: "Package_Weight.text.track_weight", description: "Weight of the package (.track_weight must be last)" },
          { title: "Shipment Date", code: "Shipment_Date.text.track_shipment_date", description: "Date the package was shipped (.track_shipment_date must be last)" },
          { title: "Arrival Date", code: "Arrival_Date.text.track_arrival", description: "Expected arrival date (.track_arrival must be last)" },
          { title: "Status Selection", code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered.track_status\nStatus.select_Error", description: "Package status dropdown (.track_status must be on ONE option only, and must be last)" },
          { title: "Editable Status Selection", code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered.editable.track_status\nStatus.select_Error", description: "Editable package status dropdown that remains editable after purchase (.editable before .track_status)" },
          { title: "Error Message", code: "Error_Message.textarea.track_error_message", description: "Error message field (shows when status is 'Error') (.track_error_message must be last)" },
          { title: "Editable Error Message", code: "Error_Message.textarea.editable.track_error_message", description: "Editable error message field that remains editable after purchase (.editable before .track_error_message)" }
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
          { title: "Third Flight - Destination", code: "Arrival3.text.track_destination3", description: "Third flight arrival location for multi-leg journeys (.track_destination3 must be last)" },
          { title: "Airline Selection", code: "Airline.select_American\nAirline.select_United\nAirline.select_Delta.track_airline", description: "Airline selection dropdown (.track_airline must be on ONE option only)" }
        ]
      }
    ]
  }
];
