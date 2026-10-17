let input = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  input += chunk;
});
process.stdin.on("end", () => {
  for (const line of input.trim().split("\n")) {
    if (!line) {
      continue;
    }

    const [, , remoteRef] = line.split(" ");

    if (remoteRef === "refs/heads/main") {
      console.error(
        "Direct pushes to main are blocked. Push a branch and open a pull request instead.",
      );
      process.exitCode = 1;
      return;
    }
  }
});
