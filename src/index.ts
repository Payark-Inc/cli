#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import ora from "ora";
import inquirer from "inquirer";
import Conf from "conf";
import { listenCommand } from "./commands/webhooks/listen.js";
import { triggerCommand } from "./commands/trigger/index.js";

const program = new Command();
const config = new Conf({ projectName: "payark" });

program
  .name("payark")
  .description("Official CLI for the PayArk payment platform.")
  .version("0.0.1");

program
  .command("login")
  .description(
    "Authenticate and securely save your Personal Access Token (PAT).",
  )
  .action(async () => {
    console.log(
      boxen(chalk.bold.hex("#10b981")("PayArk CLI"), {
        padding: 1,
        borderColor: "#10b981",
        borderStyle: "round",
      }),
    );
    console.log(
      chalk.gray(
        "Retrieve your token from: https://payark.com/dashboard/developers\n",
      ),
    );

    const { token } = await inquirer.prompt([
      {
        type: "password",
        name: "token",
        message: "Enter your Personal Access Token (PAT):",
        mask: "*",
        validate: (input) => {
          if (!input.startsWith("pat_")) {
            return "Invalid token format. Must start with 'pat_'.";
          }
          return true;
        },
      },
    ]);

    const spinner = ora("Verifying token...").start();

    // TODO: Verify token against API via /v1/me endpoint (once created)
    // For now, assume success if format is correct.

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

    config.set("auth.token", token);
    spinner.succeed(chalk.green("Logged in successfully!"));
    console.log(chalk.gray(`Config saved to: ${config.path}`));
  });

program
  .command("whoami")
  .description("Show the currently logged-in user.")
  .action(() => {
    const token = config.get("auth.token");
    if (!token) {
      console.log(chalk.yellow("Not logged in. Run `payark login` first."));
      return;
    }
    console.log(
      `Logged in with token: ${chalk.green(token.toString().slice(0, 10) + "...")}`,
    );
  });

program
  .command("logout")
  .description("Clear stored credentials.")
  .action(() => {
    config.clear();
    console.log(chalk.green("Logged out successfully."));
  });

program.addCommand(listenCommand);
program.addCommand(triggerCommand);

program.parse(process.argv);
