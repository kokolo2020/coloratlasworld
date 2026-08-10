type CloudflareEnv = {
  DB?: D1Database;
};

export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    const module = await import(/* @vite-ignore */ "cloudflare:workers") as { env?: CloudflareEnv };
    return module.env ?? null;
  } catch {
    return null;
  }
}
