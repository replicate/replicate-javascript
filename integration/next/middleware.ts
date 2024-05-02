// NOTE: This file currently doesn't do anything other than
// validate that `next build` works as expected. We can
// extend it in future to support actual middleware tests.
import { NextRequest } from "next/server";
import Replicate from "replicate";

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:function*",
};

const replicate = new Replicate();

export function middleware(request: NextRequest) {
  const output = replicate.run("foo/bar");
  return Response.json({ output }, 200);
}
