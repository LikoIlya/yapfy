#! /usr/bin/env ts-node
import config from "../../../config";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";

export const addCompileParsser = (program: Command) => {
  program
    .command("get-parser-bytes")
    .description("Get bytes valid for pushing to contract")
    .requiredOption("--parser <parser>", "Parser name to convert to bytes")
    .option("-d, --docker", "Run compiler in Docker", config.dockerizedLigo)
    .option(
      "--no-docker",
      `Run compiler with local Ligo exec file (${config.ligoLocalPath})`,
      !config.dockerizedLigo
    )
    .showHelpAfterError(true)
    .action(async (argv) => {
      getParserBytes(argv.parser, argv.docker);
    });
};

export const getParserBytes = (
  parser: string,
  isDockerizedLigo: boolean = config.dockerizedLigo
) => {
  console.log(`Compiling parser ${parser} to bytes...\n`);
  const ligo = isDockerizedLigo
    ? `docker run -v $PWD:$PWD --rm -i -w $PWD ligolang/ligo:${config.ligoVersion}`
    : config.ligoLocalPath;
  const version = !isDockerizedLigo
    ? execSync(`${ligo} version -version`).toString()
    : config.ligoVersion;
  const old_cli = version ? Number(version.split(".")[2]) > 25 : false;
  let ligo_command: string;
  if (old_cli) {
    ligo_command = "compile-expression";
  } else {
    ligo_command = "compile expression";
  }
  const parser_contract = fs.readFileSync(`${process.cwd()}/contracts/compiled/parser/${parser}.tz`).toString().trim();
  const init_file = `$PWD/contracts/partial/router/deploy.ligo`;
  const expression = `Bytes.pack([%Michelson(
    {|
      {
        UNPPAIIR;
        CREATE_CONTRACT
        ${parser_contract}
        ;
        PAIR;
      }
    |} : deploy_func_t
  )])`
  try {
    const params = `'${expression}' --michelson-format json --init-file ${init_file} --protocol hangzhou`;
    const command = `${ligo} ${ligo_command} ${config.preferredLigoFlavor} ${params}`;
    const michelson = execSync(command, { maxBuffer: 1024 * 1000 }).toString();
    if (!fs.existsSync(`${config.outputDirectory}/bytes`)) {
      fs.mkdirSync(`${config.outputDirectory}/bytes`, {
        recursive: true,
      });
    }
    const save_path = `${config.outputDirectory}/bytes/${parser}.hex`;
    fs.writeFileSync(save_path, JSON.parse(michelson).bytes);
    console.log(`Saved to ${save_path}`);
  } catch (e) {
    console.error(e);
  }
};

