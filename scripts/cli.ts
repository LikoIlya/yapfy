#!/usr/bin/env node
/* eslint-disable jest/require-hook */
import chalk from "chalk";
import { Command } from "commander";
import {
  addCompileCommand,
  addCompileExpression,
  addCompileFactoryLambda,
  addCompileLambdaCommand,
} from "./commands/compile";
import { addCompileParsser } from "./commands/compile/parserToBytes";
import { addMigrateCommand } from "./commands/migrate";
import { addSandboxCommand } from "./commands/sandbox";

const program = new Command();

program
  .version("0.0.1")
  .option(
    "-f, --folder <cwd>",
    "change the working directory to the specified folder"
  )
  .hook("preAction", (cmd: Command) => {
    const options = cmd.opts();

    if (options.folder) {
      console.debug(`Change working directory to ${options.folder}`);
    }
  });

addCompileCommand(program);
addCompileLambdaCommand(program);
addSandboxCommand(program);
addMigrateCommand(program);
addCompileFactoryLambda(program);
addCompileExpression(program);
addCompileParsser(program);

program.parse(process.argv);
