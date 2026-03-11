import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { promises as fs } from "fs";
import path from "path";

export const initCommand = new Command("init");

initCommand
  .description(
    "Scaffold a working PayArk checkout and webhook integration in 90 seconds.",
  )
  .action(async () => {
    console.log(
      chalk.bold.green(
        "\n🚢 Welcome to the Ark. Let's get you paid in 90 seconds.\n",
      ),
    );

    const { framework } = await inquirer.prompt([
      {
        type: "list",
        name: "framework",
        message: "What framework are you using?",
        choices: [
          { name: "Next.js (App Router)", value: "next" },
          { name: "Express", value: "express" },
          { name: "Hono", value: "hono" },
        ],
      },
    ]);

    const { language } = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "TypeScript or JavaScript?",
        choices: [
          { name: "TypeScript", value: "ts" },
          { name: "JavaScript", value: "js" },
        ],
      },
    ]);

    const spinner = ora("Generating your payment integration...").start();

    // Determine paths
    const cwd = process.cwd();
    let checkoutPath = "";
    let webhookPath = "";
    let checkoutCode = "";
    let webhookCode = "";

    const ext = language === "ts" ? "ts" : "js";
    const reactExt = language === "ts" ? "tsx" : "jsx";

    // Framework specific scaffolding
    if (framework === "next") {
      const isSrcDir = await fs
        .stat(path.join(cwd, "src"))
        .then(() => true)
        .catch(() => false);
      const baseDir = isSrcDir ? "src/app" : "app";

      checkoutPath = `${baseDir}/api/checkout/route.${ext}`;
      webhookPath = `${baseDir}/api/webhooks/payark/route.${ext}`;

      checkoutCode = `
import { NextResponse } from "next/server";
import { PayArk } from "@payark/sdk";

const payark = new PayArk({
  apiKey: process.env.PAYARK_SECRET_KEY,
  // baseUrl is automatically handled by the SDK
});

export async function POST(req: Request) {
  try {
    const session = await payark.payments.create({
      amount: 1000, // 1,000 Rupees
      currency: "NPR",
      provider: "esewa", // or "khalti", "connectips"
      return_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/success\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/cancel\`,
      metadata: {
        order_id: "order_123",
      },
    });

    // Provide the checkout URL so the client can redirect
    return NextResponse.json({ url: session.checkout_url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, suggestion: error.suggested_action },
      { status: error.status || 500 }
    );
  }
}
`.trim();

      webhookCode = `
import { NextResponse } from "next/server";
import { PayArk } from "@payark/sdk";

const payark = new PayArk({
  apiKey: process.env.PAYARK_SECRET_KEY,
});

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-payark-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    // 1. Verify the signature to ensure the payload is genuinely from PayArk
    const event = await payark.webhooks.verifySignature(
      payload,
      signature,
      process.env.PAYARK_WEBHOOK_SECRET!
    );

    // 2. Handle the event
    if (event.type === "payment.checkout.completed") {
      const payment = event.data;
      console.log("✅ Payment successful!", payment.id);
      // Fulfill the order, update your database, etc.
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
`.trim();
    } else if (framework === "express") {
      checkoutPath = `routes/checkout.${ext}`;
      webhookPath = `routes/webhooks.${ext}`;

      checkoutCode = `
import express from "express";
import { PayArk } from "@payark/sdk";

const router = express.Router();
const payark = new PayArk({ apiKey: process.env.PAYARK_SECRET_KEY });

router.post("/checkout", async (req, res) => {
  try {
    const session = await payark.payments.create({
      amount: 1000, // 1000 Rupees
      currency: "NPR",
      provider: "esewa",
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.checkout_url });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
`.trim();

      webhookCode = `
import express from "express";
import { PayArk } from "@payark/sdk";

const router = express.Router();
const payark = new PayArk({ apiKey: process.env.PAYARK_SECRET_KEY });

// Express requires raw body for signature verification
router.post(
  "/webhooks/payark",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-payark-signature"] as string;

    try {
      const event = await payark.webhooks.verifySignature(
        req.body, // This is a Buffer because of express.raw
        signature,
        process.env.PAYARK_WEBHOOK_SECRET!
      );

      if (event.type === "payment.checkout.completed") {
        console.log("✅ Payment successful!", event.data.id);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook verification failed" });
    }
  }
);

export default router;
`.trim();
    } else if (framework === "hono") {
      checkoutPath = `src/routes/checkout.${ext}`;
      webhookPath = `src/routes/webhooks.${ext}`;

      checkoutCode = `
import { Hono } from "hono";
import { PayArk } from "@payark/sdk";

const app = new Hono();
const payark = new PayArk({ apiKey: process.env.PAYARK_SECRET_KEY });

app.post("/checkout", async (c) => {
  try {
    const session = await payark.payments.create({
      amount: 1000,
      currency: "NPR",
      provider: "esewa",
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    return c.json({ url: session.checkout_url });
  } catch (error: any) {
    return c.json({ error: error.message }, error.status || 500);
  }
});

export default app;
`.trim();

      webhookCode = `
import { Hono } from "hono";
import { PayArk } from "@payark/sdk";

const app = new Hono();
const payark = new PayArk({ apiKey: process.env.PAYARK_SECRET_KEY });

app.post("/webhooks/payark", async (c) => {
  const signature = c.req.header("x-payark-signature");
  if (!signature) return c.json({ error: "Missing signature" }, 400);

  const payload = await c.req.text();

  try {
    const event = await payark.webhooks.verifySignature(
      payload,
      signature,
      process.env.PAYARK_WEBHOOK_SECRET!
    );

    if (event.type === "payment.checkout.completed") {
      console.log("✅ Payment successful!", event.data.id);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return c.json({ error: "Webhook verification failed" }, 400);
  }
});

export default app;
`.trim();
    }

    // Write Files
    await fs.mkdir(path.dirname(path.join(cwd, checkoutPath)), {
      recursive: true,
    });
    await fs.mkdir(path.dirname(path.join(cwd, webhookPath)), {
      recursive: true,
    });

    await fs.writeFile(path.join(cwd, checkoutPath), checkoutCode);
    await fs.writeFile(path.join(cwd, webhookPath), webhookCode);

    // .env handling
    const envPath = path.join(cwd, ".env");
    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch {
      // .env doesn't exist
    }

    if (!envContent.includes("PAYARK_SECRET_KEY")) {
      envContent += `\nPAYARK_SECRET_KEY=sk_test_placeholder\nPAYARK_WEBHOOK_SECRET=pk_test_placeholder\n`;
      await fs.writeFile(envPath, envContent.trim() + "\n");
    }

    // Attempt to install SDK if not present
    let pkgJson: any = {};
    try {
      const pkgContent = await fs.readFile(
        path.join(cwd, "package.json"),
        "utf-8",
      );
      pkgJson = JSON.parse(pkgContent);
    } catch {
      // Ignore
    }

    const hasSdk =
      pkgJson.dependencies?.["@payark/sdk"] ||
      pkgJson.devDependencies?.["@payark/sdk"];

    setTimeout(() => {
      spinner.succeed(
        chalk.green("Payment integration generated successfully."),
      );

      console.log(chalk.cyan("\nCreated files:"));
      console.log(
        chalk.gray(`  - ${checkoutPath} (Creates a payment session)`),
      );
      console.log(
        chalk.gray(`  - ${webhookPath} (Handles payment completion securely)`),
      );
      console.log(chalk.gray(`  - .env (Added placeholders for API keys)`));

      if (!hasSdk) {
        console.log(chalk.yellow("\nDon't forget to install the SDK:"));
        console.log(chalk.bold.white("  npm install @payark/sdk"));
      }

      console.log(chalk.bold.green("\nYou are ready to accept payments! 🎉\n"));

      console.log(
        chalk.gray(
          "If you don't have API keys yet, grab your free test keys at:",
        ),
      );
      console.log(chalk.cyan.underline("https://payark.dev/dashboard"));
      console.log("");
    }, 1500);
  });
