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

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Read current package.json
function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return packageJson.version;
}

// Get git status
function getGitStatus() {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    return status.trim();
  } catch (error) {
    return "";
  }
}

// Check if we're on main/master branch
function getCurrentBranch() {
  try {
    const branch = execSync("git branch --show-current", { encoding: "utf8" });
    return branch.trim();
  } catch (error) {
    return "unknown";
  }
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
    log("🚀 Secure-2FA Publisher", "bright");
    log("=====================", "cyan");

    const currentVersion = getCurrentVersion();
    const currentBranch = getCurrentBranch();
    const gitStatus = getGitStatus();

    logInfo(`Current version: ${currentVersion}`);
    logInfo(`Current branch: ${currentBranch}`);

    // Check if we're on main/master branch
    if (!["main", "master"].includes(currentBranch)) {
      logWarning(
        `You're not on the main branch (${currentBranch}). Consider switching to main/master before publishing.`
      );
      const continueAnyway = await question("Continue anyway? (y/N): ");
      if (continueAnyway.toLowerCase() !== "y") {
        logInfo("Publishing cancelled.");
        process.exit(0);
      }
    }

    // Check for uncommitted changes
    if (gitStatus) {
      logWarning("You have uncommitted changes:");
      console.log(gitStatus);
      const continueAnyway = await question(
        "Continue with uncommitted changes? (y/N): "
      );
      if (continueAnyway.toLowerCase() !== "y") {
        logInfo("Publishing cancelled. Please commit your changes first.");
        process.exit(0);
      }
    }

    // Run tests first
    logInfo("Running tests...");
    try {
      execSync("npm test", { stdio: "inherit" });
      logSuccess("All tests passed!");
    } catch (error) {
      logError("Tests failed! Please fix the issues before publishing.");
      process.exit(1);
    }

    // Build the project
    logInfo("Building project...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      logSuccess("Build successful!");
    } catch (error) {
      logError("Build failed! Please fix the issues before publishing.");
      process.exit(1);
    }

    // Ask for version type
    log("\n📦 Select version type:", "bright");
    log("1. Patch (1.0.0 → 1.0.1) - Bug fixes, minor changes", "white");
    log(
      "2. Minor (1.0.0 → 1.1.0) - New features, backward compatible",
      "white"
    );
    log("3. Major (1.0.0 → 2.0.0) - Breaking changes", "white");
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
        logInfo("Publishing cancelled.");
        process.exit(0);
        break;
      default:
        logError("Invalid choice. Please select 1-5.");
        process.exit(1);
    }

    // Show what will happen
    log("\n📋 Publishing Summary:", "bright");
    if (customVersion) {
      logInfo(`Version: ${currentVersion} → ${customVersion}`);
    } else {
      logInfo(
        `Version: ${currentVersion} → (will be updated to ${versionType})`
      );
    }
    logInfo("Package: secure-2fa");
    logInfo("Access: public");

    const confirm = await question("\nProceed with publishing? (y/N): ");
    if (confirm.toLowerCase() !== "y") {
      logInfo("Publishing cancelled.");
      process.exit(0);
    }

    // Update version
    logInfo("Updating version...");
    if (customVersion) {
      execSync(`npm version ${customVersion}`, { stdio: "inherit" });
    } else {
      execSync(`npm version ${versionType}`, { stdio: "inherit" });
    }

    // Get new version
    const newVersion = getCurrentVersion();
    logSuccess(`Version updated to ${newVersion}!`);

    // Publish to npm
    logInfo("Publishing to npm...");
    execSync("npm publish --access public", { stdio: "inherit" });
    logSuccess("Package published successfully!");

    // Push to git
    logInfo("Pushing to git...");
    try {
      execSync("git push origin HEAD --tags", { stdio: "inherit" });
      logSuccess("Git tags pushed successfully!");
    } catch (error) {
      logWarning("Failed to push git tags. Please push manually:");
      log("git push origin HEAD --tags", "yellow");
    }

    // Final success message
    log("\n🎉 Publishing Complete!", "bright");
    log(`Package: secure-2fa@${newVersion}`, "green");
    log("npm: https://www.npmjs.com/package/secure-2fa", "cyan");
    log("GitHub: https://github.com/MetaDevZone/secure-2fa", "cyan");
  } catch (error) {
    logError("An error occurred during publishing:");
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on("SIGINT", () => {
  logInfo("\nPublishing cancelled by user.");
  rl.close();
  process.exit(0);
});

// Run the script
main();
