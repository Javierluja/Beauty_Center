import { handle } from "hono/vercel";
import app from "./boot.js";

export default handle(app);
