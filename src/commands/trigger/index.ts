import { Command } from "commander";
import chalk from "chalk";
import Conf from "conf";
import inquirer from "inquirer";
import ora from "ora";

const config = new Conf({ projectName: "payark" });

export const triggerCommand = new Command("trigger")
  .description("Simulate a webhook event.")
  .argument("[event]", "Event type to trigger (e.g. payment.succeeded)")
  .action(async (event) => {
    const token = config.get("auth.token");

    if (!token) {
      console.log(chalk.red("Not authenticated. Run `payark login` first."));
      return;
    }

    if (!event) {
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "eventType",
          message: "Which event would you like to trigger?",
          choices: [
            "payment.succeeded",
            "payment.failed",
            "payment.refunded",
            "checkout.session.completed",
          ],
        },
      ]);
      event = answers.eventType;
    }

    const spinner = ora(`Triggering ${event}...`).start();

    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    spinner.succeed(chalk.green(`Triggered ${event} successfully!`));
    console.log(
      chalk.gray(`ID: evt_${Math.random().toString(36).substr(2, 9)}`),
    );
  });
