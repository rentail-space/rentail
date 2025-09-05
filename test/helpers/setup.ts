// This file contains setup code that will run before all tests
import { afterAll, afterEach, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import server from "../mocks/msw.server";

// Start MSW server before all tests
beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });

  // Clean up database
  await prisma.user.deleteMany({});
  await prisma.user.create({
    data: {
      id: "wxxx3cwnw9o4g6zehqg0dswy",
      conversations: {
        create: {
          id: "mv3syosnkkawsqkwdpmeeuyk",
          messages: {
            create: {
              id: "01K469V6Y6CQPFTK3D2MK9NMYY",
              content:
                "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?",
              role: "ASSISTANT",
            },
          },
        },
      },
    },
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => server.close());
