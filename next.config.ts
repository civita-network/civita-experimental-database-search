import type { NextConfig } from "next";
import { resolve } from "node:path";

const config: NextConfig = {
  agentRules: false,
  outputFileTracingRoot: resolve("."),
  outputFileTracingIncludes: { "/api/datasets/*": ["./mock-data/*.json"], "/api/search": ["./mock-data/*.json"], "/": ["./mock-data/*.json"] },
};

export default config;
