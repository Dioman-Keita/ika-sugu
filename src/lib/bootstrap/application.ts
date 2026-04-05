import { ensureCoreCatalogData } from "@/lib/bootstrap/catalog";
import { getOrCreateSiteSettings } from "@/lib/currency/server";

let applicationBootstrapPromise: Promise<void> | null = null;

async function bootstrapApplicationData() {
  await Promise.all([ensureCoreCatalogData(), getOrCreateSiteSettings()]);
}

export async function ensureCoreApplicationData() {
  if (!applicationBootstrapPromise) {
    applicationBootstrapPromise = bootstrapApplicationData().finally(() => {
      applicationBootstrapPromise = null;
    });
  }

  await applicationBootstrapPromise;
}
