import { processData, getPayload } from "../shared/payload.js";
import { JSON5 } from "bun";
import { fork } from "node:child_process"
import { $ } from 'bun';

async function setPcoreAffinity() {
  const pid = process.pid;
  const result = await $`taskset -cp 0-4 ${pid}`.text();
}

setPcoreAffinity();

if (process.argv[2] === 'child') {
  const server = Bun.serve({
    reusePort: true,
    routes: {
      "/process":async (request,server) => {
        if(!request.method == "POST") return new Response(null, {status:400})
        const body = await request.body.json();
        const data = processData(body);
        return new Response(JSON.stringify(data));
      },
      "/payload":async (request, server) => {
        if(!request.method == "POST") return new Response(null, {status:400})
        const data = getPayload();
        return new Response(JSON.stringify(data));
      }
    },
    fetch: async (request, server) => {
      // return new Response(null, {status:400})
      // const url = new URL(request.url);
      //
      // if (request.method != "POST")
      //   return new Response(JSON.stringify({ message: "bad request" }), {
      //     status: 400,
      //   });
      //
      // switch (url.pathname) {
      //   case "/":
      //     return new Response(JSON.stringify({ ok: true }));
      //   case "/process": {
      //
      //     const body = await request.body.json();
      //     const data = processData(body);
      //     return new Response(JSON.stringify(data));
      //   }
      //   case "/payload": {
      //     const data = getPayload();
      //     return new Response(data, { status: 200 });
      //   }
      // }
    },
    port: process.env.PORT || 3000,
  });

  console.log(`running on port ${server.port}`)
} else {
  const controller = new AbortController();
  const { signal } = controller;

  for(let i=0;i<2;i++) {
    const child = fork(__filename, ['child'], { signal, serialization:"advanced", detached:false });
    child.on('error', (err) => {
      console.error(err)
    });
  }

  process.on("SIGTERM", () => {
    try { controller.abort(); } finally {}
  })
}
