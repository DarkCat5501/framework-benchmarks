import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

import { processData, getPayload } from "../shared/payload.js";

// const app = 
new Elysia({
    adapter: node(),
    precompile: true,
  })
  .post("/process", ({ body }) => processData(body))
  .get("/payload", () => getPayload())
  .listen(process.env.PORT || 3002, () => {
    console.log(`Elysia server running on port ${process.env.PORT || 3002}`);
  });
