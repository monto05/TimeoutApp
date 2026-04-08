import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const pdfPath = process.argv[2] ?? "C:/Users/smont/Downloads/metodologia METODO TIMEOUT.pdf";
const outPath = path.resolve(process.argv[3] ?? "metodologia_timeout_extraida.txt");

if (!fs.existsSync(pdfPath)) {
	console.error("PDF not found:", pdfPath);
	process.exit(2);
}

const dataBuffer = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: dataBuffer });
const result = await parser.getText();
await parser.destroy();

fs.writeFileSync(outPath, result.text, "utf8");
console.log(outPath);
console.log("chars:", result.text.length);
