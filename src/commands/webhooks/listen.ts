import { Command } from "commander";
import chalk from "chalk";
import Conf from "conf";
import WebSocket from "ws";
import ora from "ora";
import boxen from "boxen";

const config = new Conf({ projectName: "payark" });

export const listenCommand = new Command("listen")
  .description("Stream webhook events to a local endpoint.")
  .option(
    "-u, --url <url>",
    "The URL to forward webhooks to (e.g., http://localhost:3000/api/webhooks)",
  )
  .option(
    "-e, --events <events>",
    "Comma-separated list of events to listen for",
    "*",
  )
  .action(async (options) => {
    const token = config.get("auth.token");

    if (!token) {
      console.log(chalk.red("Not authenticated. Run `payark login` first."));
      return;
    }

    if (!options.url) {
      console.log(
        chalk.yellow(
          "⚠️  No local URL specified. Events will only be logged to the console.",
        ),
      );
      console.log(
        chalk.gray(
          "   Use --url http://localhost:3000/api/webhooks to forward events.\n",
        ),
      );
    } else {
      console.log(
        boxen(chalk.bold(`Forwarding to: ${options.url}`), {
          padding: 1,
          borderColor: "#3b82f6",
          borderStyle: "round",
        }),
      );
    }

    const spinner = ora("Connecting to PayArk Edge Realtime...").start();

    // In a real implementation, this would connect to wss://api.payark.com/v1/realtime
    // For now, we'll mock the WebSocket connection to a non-existent endpoint for scaffolding
    const wsUrl = "wss://payark-realtime-mock.codimo.workers.dev";

    // Simulating connection logic as we haven't built the WS server yet
    setTimeout(() => {
      spinner.succeed(chalk.green("Ready! Listening for events..."));
      console.log(
        chalk.gray("Trigger a test webhook to see it appear here.\n"),
      );

      // Mock an event arriving after 3 seconds for demo purposes
      setTimeout(() => {
        const mockEvent = {
          id: "evt_123456789",
          type: "payment.succeeded",
          created_at: new Date().toISOString(),
          data: {
            id: "pay_987654321",
            amount: 1500,
            currency: "NPR",
            status: "COMPLETED",
            provider: "esewa",
          },
        };

        console.log(
          chalk.bold.hex("#10b981")(
            `200 OK  [${new Date().toLocaleTimeString()}]  ${mockEvent.type}`,
          ),
        );
        console.log(JSON.stringify(mockEvent, null, 2));

        if (options.url) {
          console.log(chalk.gray(`\n--> Forwarding to ${options.url}...`));
          // fetch(options.url, { method: "POST", body: JSON.stringify(mockEvent) })
          //   .then(res => console.log(chalk.green(`<-- ${res.status} ${res.statusText}`)))
          //   .catch(err => console.log(chalk.red(`<-- Connection Failed: ${err.message}`)));

          // Mock success
          console.log(chalk.green(`<-- 200 OK`));
        }
      }, 3000);
    }, 1500);

    // Keep process alive
    await new Promise(() => {});
  });
