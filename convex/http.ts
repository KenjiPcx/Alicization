import { httpRouter } from "convex/server";
import {
    corsRouter,
    DEFAULT_EXPOSED_HEADERS,
} from "convex-helpers/server/cors";

const http = httpRouter();

const cors = corsRouter(http, {
    allowCredentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    allowedOrigins: [process.env.CLIENT_ORIGIN as string],
});

export default http;