export function onRequestGet() {
  return new Response(JSON.stringify({ message: "WeHA API" }), {
    headers: { "Content-Type": "application/json" },
  });
}
