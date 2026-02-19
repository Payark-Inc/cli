# PayArk CLI

The official command-line interface for PayArk, designed to help developers build, test, and manage their PayArk integrations directly from the terminal.

## Features

- **Webhook Management**: Listen to real-time events and forward them to your local server.
- **Event Triggering**: Simulate events to test your integration.
- **Project Setup**: Quickly initialize new PayArk projects.
- **Authentication**: Securely log in to your PayArk account.

## Installation

Install the CLI globally via npm or bun:

```bash
npm install -g @payark/cli
# or
bun add -g @payark/cli
```

## Usage

Run `payark` to see available commands:

```bash
payark help
```

### Commands

#### `payark login`

Authenticate with your PayArk account.

#### `payark listen`

Listen for webhook events and forward them to a local URL.

```bash
payark listen --forward-to http://localhost:3000/api/webhooks
```

#### `payark trigger <event>`

Trigger a specific event for testing.

```bash
payark trigger payment.succeeded
```

#### `payark init`

Initialize a new PayArk project configuration.
