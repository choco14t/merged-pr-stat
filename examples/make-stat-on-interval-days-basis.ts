import { program } from "commander";
import { parseISO, add, addDays, format } from "date-fns";
import { execFileSync } from "child_process";
import { stringify } from "csv-stringify/sync";

async function main(): Promise<void> {
  program
    .requiredOption("--start <date>")
    .requiredOption("--end <date>")
    .requiredOption("--interval-days <days>")
    .requiredOption("--query <query>");

  program.parse(process.argv);

  const options = program.opts();
  const startDate = parseISO(options.start);
  const endDate = parseISO(options.end);
  const query = options.query as string;
  const intervalDays = parseInt(options.intervalDays);

  const allStats = [];
  for (let start = startDate; start < endDate; start = addDays(start, intervalDays)) {
    const end = add(start, { days: intervalDays, seconds: -1 });
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
