/** Public origin of the app (NEXT_PUBLIC_APP_URL), without a trailing slash. */
export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
