export function getWebsiteRoot() {
  const websiteRoot = process.env["ROOT_URL"];
  return websiteRoot || "http://localhost:3000";
}
