import { expect, test, describe } from "bun:test";
import { Command } from "commander";
import { listenCommand } from "./commands/webhooks/listen";
import { triggerCommand } from "./commands/trigger/index";

describe("PayArk CLI", () => {
  test("commands should be correctly initialized", () => {
    expect(listenCommand).toBeInstanceOf(Command);
    expect(triggerCommand).toBeInstanceOf(Command);
  });

  test("listen command should have correct name and description", () => {
    expect(listenCommand.name()).toBe("listen");
    expect(listenCommand.description()).toContain("webhook events");
  });

  test("trigger command should have correct name and argument", () => {
    expect(triggerCommand.name()).toBe("trigger");
    expect(triggerCommand.registeredArguments.length).toBeGreaterThan(0);
  });
});
