const child = require("child_process");
const fs = require("fs");
const path = require("path");
const Random = require("random-js");
const chalk = require("chalk");
const mutateStr = require("./mutate").mutateString;
const { array } = require("yargs");
const javareg = /.*\.java$/;

function getFiles(dir, files) {
  var fileList = fs.readdirSync(dir);
  if (files == null) {
    files = [];
  }

  fileList.forEach(function (file) {
    if (file === "node_modules") {
      return;
    }
    if (fs.statSync(dir + "/" + file).isDirectory()) {
      // Call recursively
      files = getFiles(dir + "/" + file, files);
    } else if (javareg.test(file)) {
      files.push(path.join(dir + "/" + file));
    }
  });

  return files;
}

// class mutater {
//   static random() {
//     return mutater._random || fuzzer.seed(0);
//   }

//   static seed(kernel) {
//     mutater._random = new Random.Random(
//       Random.MersenneTwister19937.seed(kernel),
//     );
//     return mutater._random;
//   }

//   static str(str) {
//     return mutateStr(this, str);
//   }
// }

function main() {
  var args = process.argv.slice(2);

  var iterations = args[0];
  var seeds = getFiles(
    "/tmp/iTrust2-v8/iTrust2/src/main/java/edu/ncsu/csc/iTrust2",
    seeds,
  );

  mtfuzz(iterations, seeds);
}

function mutateFile(file) {
  var fileContents = fs.readFileSync(file, 'utf-8');
  fs.writeFileSync(file, '', 'utf-8'); // Clear file
  var lines = fileContents.split("\n");

  for (var i = 0; i < lines.length; i++) {
    var currentLine = lines[i];

    if (Math.random() <= 0.1) {
      // Do the mutations
      var tokens = currentLine.split(" ");
      tokens.forEach(function(token) {
        if (token == "==") {
          token = "!=";
        } else if (token == "!=") {
          token = "==";
        } else if (token.match(/[0]/)) {
          token = 1;
        } else if (token.match(/[1]/)) {
          token = 0;
        } else if (token == "<") {
          token = ">";
        } else if (token == ">") {
          token = "<";
        } else if (typeof token === "string") {
          // Remove and replace random characters
          let randPos = parseInt(Math.random() * token.length);
          let randLen = parseInt(Math.random() * (token.length - randPos));
          let randString = Math.random().toString(36).substr(2);
          token.splice(randPos, randLen);
          token.splice(randPos, 0, ...randString);
        }
      })
      // Reassemble line
      lines[i] = tokens.join(" ");
    }
    // Write line to file
    fs.appendFileSync(file, lines[i] + "\n", 'utf-8');
  }
  return lines.join("\n");
}

function mtfuzz(iterations, seeds) {
  var failedTests = [];
  var passedTests = 0;

  mutater.seed(0);

  console.log(
    chalk.green(
      `Fuzzing iTrust2-v8 with ${iterations} randomly generated-inputs.`,
    ),
  );

  for (var i = 1; i <= iterations; i++) {
    // Reset iTrust source code and database
    child.execSync(`cd /tmp/iTrust2-v8/ && git reset --hard HEAD`);
    await child.execSync(`cd /tmp/iTrust2-v8 && mysql -u root -e 'DROP DATABASE IF EXISTS iTrust2'`);

    // Pick random source file to mutate
    let idx = parseInt(Math.random() * seeds.length);

    // Apply random mutation to selected file
    let file = seeds[idx];
    let mutatedFile = mutateFile(file);

    if (!fs.existsSync(".mutations")) {
      fs.mkdirSync(".mutations");
    }
    fs.writeFileSync(
      path.join(".mutations", `${i}.txt`),
      mutatedFile,
    );

    // run given function under test with input
    try {
      await child.execSync(`cd /tmp/iTrust2-v8/iTrust2 && mvn clean test`);
      passedTests++;
    } catch (e) {
      failedTests.push({ input: mutatedFile, stack: e.stack, id: i });
    }
  }

  reduced = {};
  // RESULTS OF FUZZING
  for (var i = 0; i < failedTests.length; i++) {
    var failed = failedTests[i];

    var trace = failed.stack.split("\n");
    var msg = trace[0];
    var at = trace[1];
    console.log(msg);
    // console.log( failed.stack );

    if (!reduced.hasOwnProperty(at)) {
      reduced[at] = `${chalk.red(msg)}\nFailed with input: .mutations/${
        failed.id
      }.txt\n${chalk.grey(failed.stack)}`;
    }
  }

  console.log("\n" + chalk.underline(`Finished ${iterations} runs.`));
  console.log(
    `passed: ${chalk.green(passedTests)}, exceptions: ${chalk.red(
      failedTests.length,
    )}, faults: ${chalk.blue(Object.keys(reduced).length)}`,
  );

  console.log("\n" + chalk.underline("Discovered faults."));
  console.log();
  for (var key in reduced) {
    console.log(reduced[key]);
  }
}

exports.mtfuzz = main;

if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != "undefined" ? args[number] : match;
    });
  };
}

main();
