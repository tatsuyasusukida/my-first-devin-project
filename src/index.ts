import { Hono } from "hono";
import { simulateLifePlan } from "./services/simulationService";
import type { SimulationRequest } from "./types";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post("/v1/simulate", async (c) => {
	try {
		const body = await c.req.json<SimulationRequest>();
		const result = simulateLifePlan(body);
		return c.json(result);
	} catch (error) {
		console.error("Simulation error:", error);
		return c.json(
			{
				error: "Invalid request",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			400,
		);
	}
});

export default app;
