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
    id: "tel-fields",
    title: ".tel Extension",
    content: "Creates a telephone number input field from an SVG element.",
    codeExamples: [
      {
        title: "Phone Field",
        code: "Phone_Number.tel",
        description: "Creates a telephone number input field"
      },
      {
        title: "With Max Length",
        code: "Mobile_Number.tel.max_15",
        description: "Telephone field with maximum length of 15 characters"
      }
    ]
  },
  {
    id: "password-fields",
    title: ".password Extension",
    content: "Creates a password input field with hidden text from an SVG element.",
    codeExamples: [
      {
        title: "Password Field",
        code: "User_Password.password",
        description: "Creates a password input field (text is hidden when typing)"
      }
    ]
  },
  {
    id: "checkbox-fields",
    title: ".checkbox Extension",
    content: "Creates a checkbox input field from an SVG element. Checkboxes return true when checked, false when unchecked.",
    codeExamples: [
      {
        title: "Checkbox Field",
        code: "Terms_Accepted.checkbox",
        description: "Creates a checkbox field"
      },
      {
        title: "With Editable",
        code: "Notifications_Enabled.checkbox.editable",
        description: "Creates a checkbox that remains editable after purchase"
      }
    ]
  },
  {
    id: "range-fields",
    title: ".range Extension",
    content: "Creates a range slider input field from an SVG element.",
    codeExamples: [
      {
        title: "Range Slider",
        code: "Volume.range",
        description: "Creates a range slider input field"
      },
      {
        title: "With Max Value",
        code: "Score.range.max_100",
        description: "Range slider with maximum value of 100"
      }
    ]
  },
  {
    id: "color-fields",
    title: ".color Extension",
    content: "Creates a color picker input field from an SVG element.",
    codeExamples: [
      {
        title: "Color Picker",
        code: "Theme_Color.color",
        description: "Creates a color picker input field"
      }
    ]
  },
  {
    id: "file-fields",
    title: ".file Extension",
    content: "Creates a file upload input field from an SVG element. Alternative to .upload extension.",
    codeExamples: [
      {
        title: "File Upload",
        code: "Document.file",
        description: "Creates a file upload input field"
      },
      {
        title: "Alternative to Upload",
        code: "Attachment.file",
        description: "Same functionality as .upload extension"
      }
    ]
  },
  {
    id: "upload-fields",
    title: ".upload Extension",
    content: "Creates a file upload input field from an SVG element. Alternative to .file extension.",
    codeExamples: [
      {
        title: "File Upload",
        code: "Company_Logo.upload",
        description: "Creates a file upload input field"
      },
      {
        title: "Alternative to File",
        code: "Document.upload",
        description: "Same functionality as .file extension"
      }
    ]
  },
  {
    id: "grayscale-extension",
    title: ".grayscale Extension",
    content: "Applies grayscale conversion to uploaded images. Works with .upload, .file, and .depends_ fields. Each field must carry .grayscale explicitly in its own ID.",
    codeExamples: [
      {
        title: "Full Grayscale",
        code: "Passport_Photo.upload.grayscale",
        description: "Forces the uploaded image to render in black and white (100% intensity)"
      },
      {
        title: "Partial Grayscale",
        code: "Receipt_Image.file.grayscale_65",
        description: "Applies 65% grayscale so some color detail remains"
      },
      {
        title: "Grayscale on Depends Field",
        code: "Photo.upload\nPhoto_Copy.depends_Photo.grayscale",
        description: "Photo_Copy renders in grayscale because it explicitly has .grayscale in its own ID"
      }
    ]
  },
  {
    id: "sign-fields",
    title: ".sign Extension",
    content: "Creates a signature field from an SVG element. Allows users to draw or upload their signature.",
    codeExamples: [
      {
        title: "Signature Field",
        code: "Author_Signature.sign",
        description: "Creates a signature input field"
      },
      {
        title: "With Editable",
        code: "Witness_Signature.sign.editable",
        description: "Creates a signature field that remains editable after purchase"
      }
    ]
  },
  {
    id: "status-fields",
    title: ".status Extension",
    content: "Creates a status input field from an SVG element.",
    codeExamples: [
      {
        title: "Status Field",
        code: "Order_Status.status",
        description: "Creates a status input field"
      }
    ]
  },
  {
    id: "date-fields",
    title: ".date Extension",
    content: "Creates a date picker field. Use .date for basic picker or .date_FORMAT for custom formatting. Provides dropdown selectors for all components (year, month, day, hour, minute, second, AM/PM). Important: Use underscores (_) to represent spaces in your format string.",
    codeExamples: [
      {
        title: "Basic Date Field",
        code: "Birth_Date.date",
        description: "Creates a date picker (stores as YYYY-MM-DD)"
      },
      {
        title: "US Format (MM/DD/YYYY)",
        code: "Event_Date.date_MM/DD/YYYY",
        description: "Displays as: 01/10/2025"
      },
      {
        title: "European Format (DD/MM/YYYY)",
        code: "Start_Date.date_DD/MM/YYYY",
        description: "Displays as: 10/01/2025"
      },
      {
        title: "Short Year (MM/DD/YY)",
        code: "Expiry.date_MM/DD/YY",
        description: "Displays as: 01/10/25"
      },
      {
        title: "Short Month (MMM DD)",
        code: "Due_Date.date_MMM_DD",
        description: "Displays as: Jan 10"
      },
      {
        title: "Full Month (MMMM D, YYYY)",
        code: "Created.date_MMMM_D,_YYYY",
        description: "Displays as: January 10, 2025"
      },
      {
        title: "Month Without Zero (M/D/YYYY)",
        code: "Custom_Date.date_M/D/YYYY",
        description: "Displays as: 1/10/2025"
      },
      {
        title: "With Weekday (ddd, MMM DD)",
        code: "Appointment.date_ddd,_MMM_DD",
        description: "Displays as: Mon, Jan 10"
      },
      {
        title: "Full Weekday (dddd, MMMM D)",
        code: "Event.date_dddd,_MMMM_D",
        description: "Displays as: Monday, January 10"
      },
      {
        title: "24-Hour Time (HH:mm:ss)",
        code: "Timestamp.date_MM/DD/YYYY_HH:mm:ss",
        description: "Displays as: 01/10/2025 14:30:45"
      },
      {
        title: "24-Hour No Zero (H:m)",
        code: "Time.date_H:m",
        description: "Displays as: 14:30"
      },
      {
        title: "12-Hour with AM/PM (hh:mm A)",
        code: "Schedule.date_MM/DD/YYYY_hh:mm_A",
        description: "Displays as: 01/10/2025 02:30 PM"
      },
      {
        title: "12-Hour Lowercase (h:mm a)",
        code: "Alarm.date_h:mm_a",
        description: "Displays as: 2:30 pm"
      },
      {
        title: "Editable + Tracking",
        code: "Delivery_Date.date_MM/DD/YYYY.editable.track_delivery",
        description: "Works with .editable and .track_ extensions"
      },
      {
        title: "With Depends (Field Sync)",
        code: "Start.date_MM/DD/YYYY\nEnd.depends_Start",
        description: "End date syncs with Start date automatically. .depends_ comes FIRST and replaces the field type."
      }
    ],
    subsections: [
      {
        id: "date-format-codes",
        title: "Date Format Codes Reference",
        content: "All available format codes for the .date_FORMAT extension:",
        codeExamples: [
          {
            title: "Year Codes",
            code: "YYYY\nYY",
            description: "YYYY = Full year (2025) | YY = Last two digits (25)"
          },
          {
            title: "Month Codes",
            code: "MMMM\nMMM\nMM\nM",
            description: "MMMM = January | MMM = Jan | MM = 01, 12 | M = 1, 12"
          },
          {
            title: "Day Codes",
            code: "DD\nD\ndddd\nddd",
            description: "DD = 01, 28 | D = 1, 28 | dddd = Monday | ddd = Mon"
          },
          {
            title: "Hour Codes",
            code: "HH\nH\nhh\nh",
            description: "HH = 01, 23 (24h) | H = 1, 23 (24h) | hh = 01, 12 (12h) | h = 1, 12 (12h)"
          },
          {
            title: "Minute & Second Codes",
            code: "mm\nm\nss\ns",
            description: "mm = 01, 59 | m = 1, 59 | ss = 01, 59 | s = 1, 59"
          },
          {
            title: "AM/PM Codes",
            code: "A\na",
            description: "A = AM or PM | a = am or pm"
          }
        ]
      }
    ]
  },
  {
    id: "select-fields",
    title: ".select_ Extension",
    content: "Create dropdown fields by using the .select_ pattern for multiple related elements. The internal 'value' is automatically extracted from the ID (e.g., .select_USA extracts 'USA'). The text content of each element becomes the human-readable option label. To make a select field trackable, add .track_[role] to ONE of the select options.",
    codeExamples: [
      {
        title: "Basic Dropdown Options",
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered",
        description: "Creates a dropdown with three options. Values will be 'Processing', 'In_Transit', 'Delivered'."
      },
      {
        title: "Trackable Select Field",
        code: "Status.select_Processing\nStatus.select_In_Transit\nStatus.select_Delivered.track_status",
        description: "Creates a dropdown that can be tracked with role 'status'. Only ONE option needs the .track_ extension (track_ must be last)."
      },
      {
        title: "Editable Select Field",
        code: "Priority.select_High\nPriority.select_Medium\nPriority.select_Low.editable",
        description: "Creates a dropdown that remains editable after purchase. Only one option needs the .editable extension to make the whole field editable."
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
    id: "show-if",
    title: ".showIf_ Extension",
    content: "Conditionally show a form field only when another field's value matches a specific value. The field is hidden until the condition is met. Comparison is case-insensitive and matches both the raw value and the option label (for select fields). Format: .showIf_FieldId[Value]",
    codeExamples: [
      {
        title: "Basic Example",
        code: "Error_Message.textarea.editable.showIf_Status[Error]",
        description: "Shows the Error_Message textarea only when the Status field equals 'Error'"
      },
      {
        title: "With Select Field",
        code: "Status.editable.select_Active\nStatus.editable.select_Error\nError_Message.textarea.editable.showIf_Status[Error]",
        description: "Status is a select dropdown; Error_Message appears only when 'Error' is selected"
      },
      {
        title: "Any Field Type",
        code: "Premium_Note.text.editable.showIf_Plan[Premium]",
        description: "Shows a text field only when the Plan field value is 'Premium'"
      },
      {
        title: "Multiple Conditions (separate fields)",
        code: "Refund_Reason.textarea.editable.showIf_Status[Refunded]\nDenial_Reason.textarea.editable.showIf_Status[Denied]",
        description: "Different fields shown for different Status values — each has its own showIf_"
      }
    ]
  },
  {
    id: "helper-text",
    title: "Helper Text (data-helper attribute)",
    content: "Add contextual help text to any field by using the data-helper attribute on the SVG element. This helper text will appear below the field to provide additional guidance to users.",
    codeExamples: [
      {
        title: "With Helper Text",
        code: '<text id="Email.email" data-helper="Enter your email address">user@example.com</text>',
        description: "Email field with helper text that appears below the input"
      },
      {
        title: "Helper Text on Textarea",
        code: '<text id="Description.textarea" data-helper="Provide a detailed description of your product">Product description</text>',
        description: "Textarea field with helper text for guidance"
      },
      {
        title: "Helper Text on Select",
        code: '<text id="Country.select_usa" data-helper="Select your country of residence">United States</text>',
        description: "Select option with helper text (applies to the select field)"
      },
      {
        title: "Helper Text with Extensions",
        code: '<text id="Order_Number.gen.max_12.tracking_id" data-helper="Your unique tracking number">TRK123456</text>',
        description: "Helper text works with any field type and extension combination"
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
        code: "Order_Number.gen.max_10.tracking_id.link_https://parcelfinda.com",
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
    title: ".depends Extension",
    content: "Create field dependencies with extraction support. Fields can copy values from other fields or extract specific parts like words or characters. IMPORTANT: .depends_ is an extension (not a field type) but MUST come FIRST after the base ID (position 1). It REPLACES the need for a field type — do not add .text, .upload etc. alongside it. After .depends_, .grayscale (or .grayscale_N) and .track_ROLE are allowed.",
    codeExamples: [
      {
        title: "Simple Copy (Text)",
        code: "Email.text\nConfirm_Email.depends_Email",
        description: "Copies entire value from Email field. No field type needed for text dependencies."
      },
      {
        title: "Extract First Word",
        code: "Full_Name.text\nFirst_Name.depends_Full_Name[w1]",
        description: "Extracts first word → 'Johnson Jojo' becomes 'Johnson'"
      },
      {
        title: "Extract Second Word",
        code: "Full_Name.text\nLast_Name.depends_Full_Name[w2]",
        description: "Extracts second word → 'Johnson Jojo' becomes 'Jojo'"
      },
      {
        title: "Extract First Character",
        code: "Name.text\nInitial.depends_Name[ch1]",
        description: "Extracts first character → 'Johnson' becomes 'J'"
      },
      {
        title: "Extract Specific Characters",
        code: "Name.text\nCode.depends_Name[ch1,2,5]",
        description: "Extracts 1st, 2nd, 5th characters → 'Johnson' becomes 'Jos'"
      },
      {
        title: "Extract Character Range",
        code: "Name.text\nShort.depends_Name[ch1-4]",
        description: "Extracts characters 1 to 4 → 'Johnson' becomes 'John'"
      },
      {
        title: "With Tracking",
        code: "Customer.text\nDisplay_Name.depends_Customer.track_name",
        description: "Copies value and tracks with role 'name'"
      },
      {
        title: "Image Dependency",
        code: "Photo.upload\nPhoto_Copy.depends_Photo",
        description: "Photo_Copy automatically copies the image from Photo. The dependent field is hidden from the form. Add .grayscale to Photo_Copy explicitly if you want it in grayscale."
      },
      {
        title: "Signature Dependency",
        code: "Signature.sign\nSignature_Copy.depends_Signature",
        description: "Signature_Copy automatically copies the signature. For signature dependencies, .depends must come FIRST."
      },
      {
        title: "Date Reformatting",
        code: "Start_Date.date\nFormat_Date.depends_Start_Date[date:MMM do, yyyy]",
        description: "Reformats a date value. Use [date:FORMAT] syntax where FORMAT is a valid date-fns format string. Supports natural language inputs like '9th January, 2026' or '23rd Feb'."
      },
      {
        title: "Advanced Date Parsing",
        code: "Input.text\nOutput.depends_Input[date:yyyy-MM-dd]",
        description: "Converts '9th January, 2026' -> '2026-01-09'. Automatically removes ordinals (st, nd, rd, th) before parsing."
      }
    ]
  },
  {
    id: "generated-values",
    title: ".gen Extension",
    content: "Generate values using advanced patterns: random numbers, random letters (with case options), prefixes, field dependencies, character repetition, and fill patterns. Use the interactive builder in the admin editor to construct complex generation rules.",
    codeExamples: [
      {
        title: "Simple Random (Old Style)",
        code: "Reference.gen.max_8",
        description: "Generates random alphanumeric code (8 characters)"
      },
      {
        title: "Random Numbers",
        code: "ID_Number.gen_(rn[12])",
        description: "Generates 12 random numbers → 245167839145"
      },
      {
        title: "Random Letters - Mixed Case",
        code: "ID_Letter.gen_(rc[12])",
        description: "Generates 12 random letters (mixed uppercase/lowercase) → aGeYuIoSDhEt"
      },
      {
        title: "Random Letters - Uppercase Only",
        code: "ID_Letter.gen_(ru[12])",
        description: "Generates 12 random uppercase letters → AGEYUIOSDHET"
      },
      {
        title: "Random Letters - Lowercase Only",
        code: "ID_Letter.gen_(rl[12])",
        description: "Generates 12 random lowercase letters → ageyuiosdhet"
      },
      {
        title: "With Prefix",
        code: "ID_Number.gen_FL(rn[12])",
        description: "FL + 12 random numbers → FL245167839145"
      },
      {
        title: "Mixed Numbers + Letters",
        code: "Tracking_ID.gen_(rn[6])(rc[6])",
        description: "6 numbers + 6 letters (mixed case) → 123574qGyIoP"
      },
      {
        title: "Character Duplication",
        code: "ID_Number.gen_(A[12])",
        description: "Duplicates 'A' 12 times → AAAAAAAAAAAA"
      },
      {
        title: "With Field Dependency",
        code: "Tracking_ID.gen_P<USA(dep_First_Name)(<[fill]).max_44",
        description: "Static 'P<USA' + First Name field value + fill to 44 chars with '<'"
      },
      {
        title: "With Dependency Extraction",
        code: "Code.gen_(dep_FieldName[w1])(rn[6])",
        description: "First word from FieldName + 6 random numbers"
      },
      {
        title: "Fill Pattern",
        code: "ID.gen_(rn[3])(<[fill]).max_10",
        description: "3 random numbers + fill remaining to 10 chars with '<' → 274<<<<<<<"
      }
    ],
    subsections: [
      {
        id: "gen-random-types",
        title: "Random Generation Types",
        content: "The .gen extension supports different random generation types:",
        codeExamples: [
          {
            title: "Numbers (rn)",
            code: "(rn[12])",
            description: "Generates random digits 0-9"
          },
          {
            title: "Letters Mixed (rc)",
            code: "(rc[12])",
            description: "Generates random letters in mixed case (uppercase + lowercase)"
          },
          {
            title: "Letters Uppercase (ru)",
            code: "(ru[12])",
            description: "Generates random uppercase letters only (A-Z)"
          },
          {
            title: "Letters Lowercase (rl)",
            code: "(rl[12])",
            description: "Generates random lowercase letters only (a-z)"
          }
        ]
      },
      {
        id: "gen-dependencies",
        title: "Field Dependencies",
        content: "You can reference other fields in your generation pattern using (dep_FieldName). You can also extract parts of field values:",
        codeExamples: [
          {
            title: "Simple Dependency",
            code: "(dep_First_Name)",
            description: "Uses the value from the First_Name field"
          },
          {
            title: "Word Extraction",
            code: "(dep_FieldName[w1])",
            description: "Extracts the first word from FieldName"
          },
          {
            title: "Character Extraction",
            code: "(dep_FieldName[ch1-4])",
            description: "Extracts characters 1-4 from FieldName"
          }
        ]
      },
      {
        id: "gen-fill-pattern",
        title: "Fill Pattern",
        content: "The fill pattern automatically pads the generated value to reach the maximum length specified by .max_ extension. Use (<[fill]) or any character followed by [fill].",
        codeExamples: [
          {
            title: "Fill with Default Character",
            code: "(<[fill])",
            description: "Fills remaining space with '<' character"
          },
          {
            title: "Fill with Custom Character",
            code: "(0[fill])",
            description: "Fills remaining space with '0' character"
          },
          {
            title: "Complete Example",
            code: "ID.gen_(rn[3])(<[fill]).max_10",
            description: "3 random numbers + fill to 10 chars → 274<<<<<<<"
          }
        ]
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
        code: "Order_Number.gen.max_10.tracking_id.link_https://parcelfinda.com",
        description: "Creates a tracking ID field with a link to the ParcelFinda tracking website"
      },
      {
        title: "Flight Tracking with Link",
        code: "Booking_Ref.gen.max_8.tracking_id.link_https://myflightlookup.com",
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
          { title: "Tracking ID with Link", code: "Tracking_ID.gen.max_12.link_https://parcelfinda.com", description: "Main tracking ID with link to ParcelFinda (no .track_ extension needed)" },
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
        content: "MyFlightLookup is our flight tracking website. It supports one-way, two-way, and three-way flight itineraries with a leg-based structure. Use these extensions to map SVG fields to the flight tracking display. ⚠️ IMPORTANT: .track_ extensions must be the LAST extension in the ID chain.",
        codeExamples: [
          { title: "Booking Reference with Link", code: "Booking_Ref.gen.max_8.tracking_id.link_https://myflightlookup.com", description: "Main booking reference with link to MyFlightLookup (no .track_ extension needed)" },
          { title: "Passenger Name", code: "Passenger_Name.text.track_name", description: "Passenger name (.track_name must be last)" },
          { title: "Passenger Email", code: "Passenger_Email.email.track_email", description: "Passenger email address (.track_email must be last)" },
          { title: "Flight Number (General)", code: "Flight_No.text.track_flight", description: "General flight number (fallback if no per-leg flight numbers)" },
          { title: "Status", code: "Status.text.track_status", description: "Booking status (.track_status must be last)" },
          { title: "Booking Date", code: "Booking_Date.text.track_date", description: "Date of booking (.track_date must be last)" },
          { title: "Gate Number", code: "Gate.text.track_gate", description: "Departure gate number (.track_gate must be last)" },
          { title: "Flight Class", code: "Class.select_Economy.track_class", description: "Cabin class selection (e.g., Economy, Business) (.track_class must be on ONE option)" },
          { title: "Seat Number", code: "Seat.text.track_seat", description: "Passenger seat number (.track_seat must be last)" },
          { title: "Explicit Flight Type", code: "FlightType.text.track_flight_type", description: "Explicitly set title like 'PRIVATE CHARTER' (Overrides auto-detection)" },
          { title: "Airline Selection", code: "Airline.select_American\nAirline.select_United\nAirline.select_Delta.track_airline", description: "Airline selection dropdown (.track_airline must be on ONE option only)" },
          { title: "Error Message", code: "Error.text.track_error_message", description: "Internal error/status message (.track_error_message must be last)" },
          { title: "Leg 1 - Origin", code: "Departure_Location.text.track_leg1_origin", description: "First leg departure city/airport (e.g., 'London Heathrow (LHR)')" },
          { title: "Leg 1 - Departure DateTime", code: "Departure_Date_and_Time.text.track_leg1_origin_datetime", description: "First leg departure date+time (e.g., '4 Jun 2025, 08:25')" },
          { title: "Leg 1 - Stopover 1", code: "First_StopOver_Location.text.track_leg1_stopover1", description: "First stopover/layover within leg 1 (e.g., 'Logan Airport (BOS)')" },
          { title: "Leg 1 - Stopover 1 DateTime", code: "First_StopOver_Date_and_Time.text.track_leg1_stopover1_datetime", description: "Stopover datetime (e.g., '4 Jun 2025, 10:56pm')" },
          { title: "Leg 1 - Flight Number", code: "Flight_No.text.track_leg1_flight_no", description: "Flight number specific to leg 1 (e.g., 'B61621')" },
          { title: "Leg 2 - Stopover 1", code: "Second_StopOver_Location.text.track_leg2_stopover1", description: "First stopover within leg 2 (e.g., 'Logan Airport (BOS)')" },
          { title: "Leg 2 - Stopover 1 DateTime", code: "Second_StopOver_Date_and_Time.text.track_leg2_stopover1_datetime", description: "Leg 2 stopover1 datetime (e.g., '4 Jun 2025, 16:19')" },
          { title: "Leg 2 - Stopover 2", code: "Third_StopOver_Location.text.track_leg2_stopover2", description: "Second stopover within leg 2 (e.g., 'Buffalo Niagara Intl Airport (BUF)')" },
          { title: "Leg 2 - Stopover 2 DateTime", code: "Third_StopOver_Date_and_Time.text.track_leg2_stopover2_datetime", description: "Leg 2 stopover2 datetime (e.g., '4 Jun 2025, 17:55')" },
          { title: "Leg 2 - Flight Number", code: "Leg2_Flight_No.text.track_leg2_flight_no", description: "Flight number specific to leg 2 (e.g., 'B61115')" },
          { title: "Leg 3 - Stopover 1", code: "Fourt_StopOver_Location.text.track_leg3_stopover1", description: "Stopover within leg 3 (e.g., 'Logan Airport (BOS)')" },
          { title: "Leg 3 - Stopover 1 DateTime", code: "Fourt_StopOver_Date_and_Time.text.track_leg3_stopover1_datetime", description: "Leg 3 stopover datetime (e.g., '25 Jun 2025, 16:10')" },
          { title: "Leg 3 - Flight Number", code: "Leg3_Flight_No.text.track_leg3_flight_no", description: "Flight number specific to leg 3 (e.g., 'B61620')" },
          { title: "Leg 3 - Destination", code: "Arrival_Location.text.track_leg3_destination", description: "Third leg final arrival city (e.g., 'London Heathrow (LHR)')" },
          { title: "Leg 3 - Arrival DateTime", code: "Arrival_Date_and_Time.text.track_leg3_destination_datetime", description: "Third leg final arrival date+time (e.g., '26 Jun 2025, 06:30')" },
        ],
        subsections: [
          {
            id: "leg-based-structure",
            title: "Leg-Based Field Structure",
            content: "For multi-leg flights (stopovers, return flights, 3-way tickets), use the leg-based field naming convention. Each leg has optional stopovers and a final destination.",
            codeExamples: [
              {
                title: "Leg 1 - With Stopover (Real Example)",
                code: "Departure_Location.text.track_leg1_origin\nDeparture_Date_and_Time.text.track_leg1_origin_datetime\nFirst_StopOver_Location.text.track_leg1_stopover1\nFirst_StopOver_Date_and_Time.text.track_leg1_stopover1_datetime\nFlight_No.text.track_leg1_flight_no",
                description: "Leg 1: London (LHR) → Stopover at Boston (BOS)"
              },
              {
                title: "Leg 2 - With 2 Stopovers (Real Example)",
                code: "Second_StopOver_Location.text.track_leg2_stopover1\nSecond_StopOver_Date_and_Time.text.track_leg2_stopover1_datetime\nThird_StopOver_Location.text.track_leg2_stopover2\nThird_StopOver_Date_and_Time.text.track_leg2_stopover2_datetime\nLeg2_Flight_No.text.track_leg2_flight_no",
                description: "Leg 2: Boston (BOS) stopover1 → Buffalo (BUF) stopover2"
              },
              {
                title: "Leg 3 - Stopover to Destination (Real Example)",
                code: "Fourt_StopOver_Location.text.track_leg3_stopover1\nFourt_StopOver_Date_and_Time.text.track_leg3_stopover1_datetime\nArrival_Location.text.track_leg3_destination\nArrival_Date_and_Time.text.track_leg3_destination_datetime\nLeg3_Flight_No.text.track_leg3_flight_no",
                description: "Leg 3: Boston (BOS) stopover → Final destination London (LHR)"
              }
            ]
          },
          {
            id: "stopovers",
            title: "Stopovers Within Legs",
            content: "Stopovers (layovers) are intermediate stops WITHIN a leg. Use .track_leg{N}_stopover{N} and .track_leg{N}_stopover{N}_datetime fields. ⚠️ IMPORTANT: Element IDs with 'StopOver' MUST use .track_leg{N}_stopover{N} keywords, NEVER .origin or .destination.",
            codeExamples: [
              {
                title: "Leg 1 with Stopover 1 (Real Example)",
                code: "First_StopOver_Location.text.track_leg1_stopover1\nFirst_StopOver_Date_and_Time.text.track_leg1_stopover1_datetime",
                description: "First stopover at Boston (BOS) within leg 1"
              },
              {
                title: "Leg 2 with Stopover 1 & 2 (Real Example)",
                code: "Second_StopOver_Location.text.track_leg2_stopover1\nSecond_StopOver_Date_and_Time.text.track_leg2_stopover1_datetime\nThird_StopOver_Location.text.track_leg2_stopover2\nThird_StopOver_Date_and_Time.text.track_leg2_stopover2_datetime",
                description: "Leg 2 has TWO stopovers: Boston (BOS) then Buffalo (BUF)"
              },
              {
                title: "Leg 3 with Stopover 1 (Real Example)",
                code: "Fourt_StopOver_Location.text.track_leg3_stopover1\nFourt_StopOver_Date_and_Time.text.track_leg3_stopover1_datetime",
                description: "Fourth stopover at Boston (BOS) within leg 3 before final destination"
              }
            ]
          },
          {
            id: "route-summary",
            title: "Route Summary Display",
            content: "The flight tracker automatically generates a route summary showing the journey from first origin to last destination. Stopovers are displayed within their respective legs.",
            codeExamples: [
              {
                title: "3-Way Ticket Route (Real Example)",
                code: "Auto-generated: London Heathrow (LHR) → Boston (BOS) → Buffalo (BUF) → London Heathrow (LHR)",
                description: "Complete journey: Leg 1 (LHR→BOS), Leg 2 (BOS→BUF), Leg 3 (BOS→LHR)"
              }
            ]
          }
        ]
      }
    ]
  }
];
