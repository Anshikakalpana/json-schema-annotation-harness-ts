import fs from "fs";
import path from "path";

export function loadTestFile(filePath: string): any {
  const fullPath = path.resolve(filePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(content);
}