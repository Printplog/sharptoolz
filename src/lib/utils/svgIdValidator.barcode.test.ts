import { describe, it, expect } from "vitest";
import { validateSvgId } from "./svgIdValidator";
import { parseBarcodeCarrier, buildBarcodeCarrier, writeBarcodeToId, readBarcodeFromId } from "./barcodeId";

describe("validateSvgId — barcode (single-carrier format)", () => {
  const valid = [
    "Flight_QR.barcode",                                       // bare → defaults to code128
    "Flight_QR.barcode_(pdf417)",                              // symbology only
    "Order.barcode_(code128)(rn[12])",                         // symbology + content rule
    "Flight_QR.barcode_(pdf417)(dep_Passenger_Name)(rn[6])",   // symbology + multi-token rule
    "Lbl.barcode_AUTO:(code128)(dep_OrderId)",                 // AUTO (auto-generate)
    "Boarding.barcode_(pdf417)Name:_(dep_PassengerName)\\nFlight:_(dep_FlightNo)", // multi-row (lines) like QR
    "Pkg.barcode_(ean13).editable",                            // editable after barcode
    "X.barcode_(datamatrix).showIf_Mode[ship]",               // conditional after barcode
  ];
  const invalid = [
    "Flight_QR.barcode_",                                      // trailing underscore, empty carrier
  ];

  it.each(valid)("accepts %s", (id) => {
    const r = validateSvgId(id);
    expect(r.error ?? "").toBe("");
    expect(r.valid).toBe(true);
  });

  it.each(invalid)("rejects %s", (id) => {
    expect(validateSvgId(id).valid).toBe(false);
  });
});

describe("barcodeId carrier round-trip", () => {
  it("parses (symbology)(rule)", () => {
    expect(parseBarcodeCarrier("(pdf417)(dep_OrderId)(rn[6])")).toEqual({
      symbology: "pdf417",
      rule: "(dep_OrderId)(rn[6])",
      isAuto: false,
    });
  });
  it("parses AUTO prefix", () => {
    expect(parseBarcodeCarrier("AUTO:(code128)(rn[12])")).toEqual({
      symbology: "code128",
      rule: "(rn[12])",
      isAuto: true,
    });
  });
  it("parses legacy bare symbology", () => {
    expect(parseBarcodeCarrier("ean13")).toEqual({ symbology: "ean13", rule: "", isAuto: false });
  });
  it("builds carrier", () => {
    expect(buildBarcodeCarrier("pdf417", "(dep_X)", false)).toBe("(pdf417)(dep_X)");
    expect(buildBarcodeCarrier("code128", "(rn[6])", true)).toBe("AUTO:(code128)(rn[6])");
  });
  it("rewrites symbology keeping rule + late modifiers", () => {
    expect(writeBarcodeToId("Flight.barcode_(pdf417)(dep_X).editable", { symbology: "ean13" }))
      .toBe("Flight.barcode_(ean13)(dep_X).editable");
  });
  it("rewrites rule keeping symbology", () => {
    expect(writeBarcodeToId("Flight.barcode_(pdf417)(dep_X)", { rule: "(rn[8])" }))
      .toBe("Flight.barcode_(pdf417)(rn[8])");
  });
  it("seeds a bare .barcode", () => {
    expect(readBarcodeFromId("Flight.barcode")).toEqual({ symbology: "", rule: "", isAuto: false });
    expect(writeBarcodeToId("Flight.barcode", { symbology: "qrcode" })).toBe("Flight.barcode_(qrcode)");
  });
});
