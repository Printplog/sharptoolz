import { validateSvgId } from './src/lib/utils/svgIdValidator';

const testCases = [
  "Status.select_USA",
  "Status.select_USA.editable",
  "Status.select_USA.editable.track_status",
  "Status.select", // Should fail, needs value
  "Order.text.max_10.tracking_id.link_https://xyz.com",
  "Order.link_https://xyz.com", // Should fail, missing tracking_id
  "First_Name.depends_Full_Name[w1]",
  "Age.number.min_18.max_100",
  "Age.max_", // Should fail, missing value
  "Signature.sign.editable.track_signature",
  "Delivery.date_MMM_DD.editable",
  "Delivery.date.track_date",
  "Photo.upload.grayscale",
  "Photo.upload.grayscale_80",
];

for (const id of testCases) {
  const result = validateSvgId(id);
  console.log(`[${result.valid ? 'PASS' : 'FAIL'}] ${id}`);
  if (!result.valid) console.log(`  -> ${result.error}`);
}
