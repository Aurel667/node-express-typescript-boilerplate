#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const sourceDirectory = path.resolve(__dirname, "..");
const projectName = process.argv[2];
const destination = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.resolve(sourceDirectory, "..", projectName || "");

if (!projectName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectName)) {
  console.error("Usage: npm run create -- <project-name> [destination]");
  console.error("Use a lowercase npm name, for example: my-api");
  process.exit(1);
}

const relativeDestination = path.relative(sourceDirectory, destination);
if (
  relativeDestination === "" ||
  (!relativeDestination.startsWith(`..${path.sep}`) &&
    relativeDestination !== ".." &&
    !path.isAbsolute(relativeDestination))
) {
  console.error("Choose a destination outside the AurelStack repository.");
  process.exit(1);
}

if (fs.existsSync(destination)) {
  console.error(`Destination already exists: ${destination}`);
  process.exit(1);
}

const excludedNames = new Set([
  ".boilerplate",
  ".env",
  ".git",
  "dist",
  "node_modules",
]);

fs.mkdirSync(destination, { recursive: true });

try {
  fs.cpSync(sourceDirectory, destination, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = path.relative(sourceDirectory, sourcePath);
      if (!relativePath) return true;

      const firstPathSegment = relativePath.split(path.sep)[0];
      return !excludedNames.has(firstPathSegment);
    },
  });

  const packagePath = path.join(destination, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.name = projectName;
  delete packageJson.repository;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const lockPath = path.join(destination, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const packageLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    packageLock.name = projectName;
    if (packageLock.packages?.[""]) {
      packageLock.packages[""].name = projectName;
    }
    fs.writeFileSync(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
  }

  const envExamplePath = path.join(destination, ".env.example");
  if (fs.existsSync(envExamplePath)) {
    const apiKey = crypto.randomBytes(32).toString("hex");
    const jwtSecret = crypto.randomBytes(48).toString("hex");
    const envContent = fs.readFileSync(envExamplePath, "utf8")
      .replace(/^API_KEY=.*$/m, `API_KEY=${apiKey}`)
      .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwtSecret}`);
    fs.writeFileSync(path.join(destination, ".env"), envContent);
  }

  const readmePath = path.join(destination, "README.md");
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, "utf8")
      .replace(/^# AurelStack.*$/m, `# ${projectName}`)
      .replace(
        /git clone https:\/\/github\.com\/Aurel667\/node-express-typescript-boilerplate\.git\r?\ncd node-express-typescript-boilerplate/,
        `cd ${projectName}`,
      )
      .replace(
        /<!-- AURELSTACK_GENERATOR_DOC_START -->[\s\S]*?<!-- AURELSTACK_GENERATOR_DOC_END -->\r?\n?/,
        "",
      );
    fs.writeFileSync(readmePath, readme);
  }

  console.log(`Created ${projectName} at ${destination}`);
  console.log("Next steps:");
  console.log(`  cd "${destination}"`);
  console.log("  npm install");
  console.log("  npm run prisma:generate");
  console.log("  npm run dev");
} catch (error) {
  fs.rmSync(destination, { recursive: true, force: true });
  console.error("Project creation failed:", error);
  process.exit(1);
}
