import { program } from "commander";
import { parse, add, addMonths, format } from "date-fns";
import { execFileSync } from "child_process";
import { stringify } from "csv-stringify/sync";

async function main(): Promise<void> {
  program.requiredOption("--start <yyyy/MM>").requiredOption("--end <yyyy/MM>").requiredOption("--query <query>");

  program.parse(process.argv);

  const options = program.opts();
  const startDate = parse(options.start, "yyyy/MM", new Date());
  const endDate = parse(options.end, "yyyy/MM", new Date());
  const query = options.query as string;

  const allStats = [];
  for (let start = startDate; start <= endDate; start = addMonths(start, 1)) {
    const end = add(start, { months: 1, seconds: -1 });
    console.error(format(start, "yyyy-MM-dd HH:mm:ss"));
    console.error(format(end, "yyyy-MM-dd HH:mm:ss"));

    const stdout = execFileSync(
      "merged-pr-stat",
      ["--start", start.toISOString(), "--end", end.toISOString(), "--query", query],
      { encoding: "utf8" }
    );
    const result = {
      startDate: format(start, "yyyy-MM-dd HH:mm:ss"),
      endDate: format(end, "yyyy-MM-dd HH:mm:ss"),
      ...JSON.parse(stdout),
    };
    allStats.push(result);
  }
  process.stdout.write(stringify(allStats, { header: true }));
}

main().catch((error) => console.error(error));
