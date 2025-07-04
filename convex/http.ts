import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { sendMessageHttpStream } from "./chat";
import {
    corsRouter,
    DEFAULT_EXPOSED_HEADERS,
} from "convex-helpers/server/cors";

const http = httpRouter();

auth.addHttpRoutes(http);

const cors = corsRouter(http, {
    allowCredentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    allowedOrigins: [process.env.CLIENT_ORIGIN as string],
});

cors.route({
    path: "/chat",
    method: "POST",
    handler: sendMessageHttpStream,
    exposedHeaders: [...DEFAULT_EXPOSED_HEADERS, "Message-Id"],
});

export default http;