import type { AgentCard } from "@a2a-js/sdk";

const rentailAgentCard: AgentCard = {
  additionalInterfaces: [
    { url: "https://rentail.space/a2a/jsonrpc", transport: "JSONRPC" },
    { url: "https://rentail.space/a2a/rest", transport: "HTTP+JSON" },
  ],
  capabilities: { pushNotifications: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  description:
    "The comprehensive marketplace for specialty leasing and short-term retail spaces in US shopping centers and malls. Find kiosks, pop-up shops, carts, RMU, and temporary retail locations nationwide. Whether you need to find a space to rent in a shopping center or a mall, we will help you find the perfect space for your business.",
  name: "Rentail.space Agent",
  protocolVersion: "0.3.0",
  provider: {
    organization: "Rentail.space",
    url: "https://rentail.space",
  },
  skills: [
    {
      description: "Chat with the Rentail.space agent",
      id: "chat",
      name: "Chat",
      tags: ["chat"],
    },
  ],
  url: "https://rentail.space/a2a/jsonrpc",
  version: "1.0.0",
};

export default rentailAgentCard;
