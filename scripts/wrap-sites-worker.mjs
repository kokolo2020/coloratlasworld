import { access, readFile, rename, writeFile } from "node:fs/promises";

const serverDirectory = new URL("../dist/server/", import.meta.url);
const entryFile = new URL("index.js", serverDirectory);
const handlerFile = new URL("vinext-handler.js", serverDirectory);

await access(entryFile);
const generatedWorker = await readFile(entryFile, "utf8");

if (!generatedWorker.includes("generateStaticParamsMap")) {
  throw new Error(
    "The generated vinext worker is missing the application route table. Refusing to publish an incomplete build.",
  );
}

await rename(entryFile, handlerFile);

const workerEntry = `import handler from "./vinext-handler.js";
export { generateStaticParamsMap } from "./vinext-handler.js";

export default {
  fetch(request, _environment, context) {
    return handler(request, context);
  },
};
`;

await writeFile(entryFile, workerEntry, "utf8");
console.log("Added the Cloudflare module-worker fetch handler.");
