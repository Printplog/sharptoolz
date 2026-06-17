import { writeBarcodeToId, readBarcodeFromId } from "./src/lib/utils/barcodeId";
const id1 = "Barcode1.barcode";
console.log("1:", writeBarcodeToId(id1, { symbology: "qrcode" }));

const id2 = "Barcode1.barcode_(code128)";
console.log("2:", writeBarcodeToId(id2, { symbology: "qrcode" }));

const id3 = "Barcode1.barcode_(code128)(dep_X)";
console.log("3:", writeBarcodeToId(id3, { symbology: "qrcode" }));
