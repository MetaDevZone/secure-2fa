#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function logDemo(message) {
  log(`🎭 ${message}`, "magenta");
}

// Read current package.json
function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return packageJson.version;
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    log("🎭 Secure-2FA Publisher Demo", "bright");
    log("==========================", "cyan");

    const currentVersion = getCurrentVersion();

    logInfo(`Current version: ${currentVersion}`);
    logDemo("This is a demo of the interactive publisher");

    // Simulate version selection
    log("\n📦 Select version type:", "bright");
    log("1. Patch (1.1.0 → 1.1.1) - Bug fixes, minor changes", "white");
    log(
      "2. Minor (1.1.0 → 1.2.0) - New features, backward compatible",
      "white"
    );
    log("3. Major (1.1.0 → 2.0.0) - Breaking changes", "white");
    log("4. Custom version", "white");
    log("5. Cancel", "white");

    const choice = await question("\nEnter your choice (1-5): ");

    let versionType;
    let customVersion;

    switch (choice) {
      case "1":
        versionType = "patch";
        break;
      case "2":
        versionType = "minor";
        break;
      case "3":
        versionType = "major";
        break;
      case "4":
        customVersion = await question("Enter custom version (e.g., 1.2.3): ");
        break;
      case "5":
        logInfo("Demo cancelled.");
        process.exit(0);
        break;
      default:
        log("Invalid choice. Please select 1-5.", "red");
        process.exit(1);
    }

    // Show what would happen
    log("\n📋 Publishing Summary (DEMO):", "bright");
    if (customVersion) {
      logInfo(`Version: ${currentVersion} → ${customVersion}`);
    } else {
      logInfo(
        `Version: ${currentVersion} → (would be updated to ${versionType})`
      );
    }
    logInfo("Package: secure-2fa");
    logInfo("Access: public");

    logDemo("\nIn real publishing, this would:");
    logDemo("1. Run all tests");
    logDemo("2. Build the project");
    logDemo("3. Update package.json version");
    logDemo("4. Publish to npm");
    logDemo("5. Push git tags");

    logSuccess("\nDemo completed! To actually publish, run: npm run publish");
  } catch (error) {
    console.error("Demo error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on("SIGINT", () => {
  logInfo("\nDemo cancelled by user.");
  rl.close();
  process.exit(0);
});

// Run the demo
main();
