import { handle } from "@hono/node-server/vercel";
import app from "./boot.js";

export default handle(app);
