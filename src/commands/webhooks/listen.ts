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

    // Use the provided development worker URL
    const wsUrl = `wss://payark-api.codimo-dev.workers.dev/v1/realtime?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.on("open", () => {
      spinner.succeed(chalk.green("Ready! Listening for events..."));
      console.log(
        chalk.gray("Trigger a test webhook to see it appear here.\n"),
      );
    });

    ws.on("message", async (data: any) => {
      try {
        const message = JSON.parse(data.toString());

        // Ignore system messages
        if (message.type === "system") {
          return;
        }

        console.log(
          chalk.bold.hex("#10b981")(
            `200 OK  [${new Date().toLocaleTimeString()}]  ${message.type}`,
          ),
        );
        console.log(JSON.stringify(message, null, 2));

        if (options.url) {
          console.log(chalk.gray(`\n--> Forwarding to ${options.url}...`));
          try {
            const res = await fetch(options.url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(message),
            });

            if (res.ok) {
              console.log(chalk.green(`<-- ${res.status} ${res.statusText}`));
            } else {
              console.log(chalk.red(`<-- ${res.status} ${res.statusText}`));
            }
          } catch (err: any) {
            console.log(chalk.red(`<-- Connection Failed: ${err.message}`));
          }
        }
      } catch (_e) {
        console.log(chalk.red("Error parsing message:"), data.toString());
      }
    });

    ws.on("error", (err: any) => {
      spinner.fail(chalk.red(`WebSocket Error: ${err.message}`));
    });

    ws.on("close", () => {
      console.log(chalk.yellow("\nDisconnected from PayArk Edge."));
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  });
