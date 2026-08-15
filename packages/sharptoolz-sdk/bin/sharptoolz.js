#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const command = process.argv[2];
if (command !== "init") {
  console.log("Usage: npx @sharp-toolz/sdk init");
  process.exit(command ? 1 : 0);
}

const files = {
  ".env.example": "SHARPTOOLZ_API_KEY=stz_live_your_key\n",
  "sharptoolz.example.mjs": `import { SharpToolz } from "@sharp-toolz/sdk";

const sharp = new SharpToolz({ apiKey: process.env.SHARPTOOLZ_API_KEY });

const templates = await sharp.templates.list();
console.log(templates);
`,
};

let created = 0;
for (const [name, contents] of Object.entries(files)) {
  const destination = resolve(process.cwd(), name);
  if (existsSync(destination)) {
    console.log(`Skipped ${name} because it already exists.`);
    continue;
  }
  writeFileSync(destination, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log(`Created ${name}`);
  created += 1;
}
console.log(created ? "SharpToolz starter files are ready." : "No files were changed.");
