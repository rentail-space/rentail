import { describe } from "vitest";
import runThroughScript from "../helpers/runThroughScript";

const script = `
Assistant:
[ ] Welcomes the user
[ ] Introduces Rentail
[ ] States they're a virtual assistant
[ ] Offers to help the user
[ ] Finishes with a question

User: Tell me all the shopping centers you know about

Assistant:
[ ] Lists shopping centers in Southern California
[ ] Lists more 10 or more shopping centers

User: looking for a pop up shop in Oakville

Assistant:
[ ] Tells user we don't have centers in Oakville
[ ] Offers user help exploring spaces in Southern California
  `;

describe("User is not in Los Angeles area", () =>
  runThroughScript({
    headers: {
      "x-vercel-ip-latitude": "47.608013",
      "x-vercel-ip-longitude": "-122.335167",
      "x-vercel-ip-city": "Seattle",
      "x-vercel-ip-state": "Washington",
      "x-vercel-ip-country": "United States",
    },
    script,
  }));
