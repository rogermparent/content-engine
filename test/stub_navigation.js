export function redirect() {
  return null;
}

/*
 * `notFound()` throws in Next so that everything after it is unreachable; a
 * stub that returned would let a route body run on past the guard and fail
 * somewhere less obvious. The error carries Next's own digest so a test can
 * assert "this route 404s" without depending on the message.
 */
export function notFound() {
  const error = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  error.digest = "NEXT_HTTP_ERROR_FALLBACK;404";
  throw error;
}
