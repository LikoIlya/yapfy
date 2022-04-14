import { Command } from "commander";
import { compile, compileExpression, compileFactoryLambda, compileLambdas } from "./utils";
import config from "../../../config";

export const addCompileCommand = (program: Command) => {
  program
    .command("compile")
    .description("Compile contract(s) using LIGO compiler.")
    .option(
      "-c, --contract <contract>",
      "Compile a single smart contract source file"
    )
    .option(
      "-l, --ligo-version <version>",
      `Choose a specific LIGO version in format exmpl: 0.31.0 or "next". Default is "next".`,
      "next"
    )
    .option(
      "-F, --format <format>",
      `Choose a specific LIGO format: tz or json. Default is "json".`,
      "json"
    )
    .option("-d, --docker", "Run compiler in Docker", config.dockerizedLigo)
    .option(
      "--no-docker",
      `Run compiler with local Ligo exec file (${config.ligoLocalPath})`,
      !config.dockerizedLigo
    )
    .action((options) => {
      compile(options);
    });
};

export const addCompileLambdaCommand = (program: Command) => {
  program
    .command("compile-lambda")
    .description("compile lambdas for the specified contract")
    .requiredOption("-T, --type <type>", "Type of contracts lambdas")
    .requiredOption(
      "-J, --json <json>",
      "input file relative path (with lambdas indexes and names)"
    )
    .requiredOption(
      "-C, --contract <contract>",
      "input file realtive path (with lambdas Ligo code)"
    )
    .option("-d, --docker", "Run compiler in Docker", config.dockerizedLigo)
    .option(
      "--no-docker",
      `Run compiler with local Ligo exec file (${config.ligoLocalPath})`,
      !config.dockerizedLigo
    )
    .showHelpAfterError(true)
    .action(async (argv) => {
      compileLambdas(argv.json, argv.contract, argv.docker, argv.type);
    });
};

export const addCompileFactoryLambda = (program: Command) => {
  program
    .command("compile-factory-lambda")
    .description("Compile initialize exchange function for factory.")
    .requiredOption("-F, --lambda <lambda>", "Lambda function name")
    .option("-d, --docker", "Run compiler in Docker", config.dockerizedLigo)
    .option(
      "--no-docker",
      `Run compiler with local Ligo exec file (${config.ligoLocalPath})`,
      !config.dockerizedLigo
    )
    .showHelpAfterError(true)
    .action(async (argv) => {
      compileFactoryLambda(argv.lambda, argv.docker);
    });
};

export const addCompileExpression = (program: Command) => {
  program
    .command("compile-expression")
    .description("Compile passed expression with ligo.")
    .requiredOption("--init-file <initFile>", "Init file to compile from")
    .requiredOption("--expression <expression>", "Expression")
    .option("--output <output>", "Output file")
    .option("--docker", "Run compiler in Docker", config.dockerizedLigo)
    .option(
      "--no-docker",
      `Run compiler with local Ligo exec file (${config.ligoLocalPath})`,
      !config.dockerizedLigo
    )
    .showHelpAfterError(true)
    .action(async (argv) => {
      console.log(argv)
      compileExpression(argv.initFile, argv.expression, argv.output, argv.docker);
    });
};
