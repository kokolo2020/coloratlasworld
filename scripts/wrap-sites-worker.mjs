import { access, rename, writeFile } from "node:fs/promises";

const serverDirectory = new URL("../dist/server/", import.meta.url);
const entryFile = new URL("index.js", serverDirectory);
const handlerFile = new URL("vinext-handler.js", serverDirectory);

await access(entryFile);
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
