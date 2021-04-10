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
      tokens.forEach(function(token, index) {
        if (token.includes("==")) {
          tokens[index] = token.replace("==", "!=");
        } else if (token.includes("!=")) {
          tokens[index] = token.replace("!=", "==");
        } else if (token.includes("0")) {
          tokens[index] = token.replace("0", "1");
        } else if (token.includes("1")) {
          tokens[index] = token.replace("1", "0");
        // } else if (token.includes("<")) {
        //   tokens[index] = token.replace("<", ">");
        // } else if (token.includes(">")) {
        //   tokens[index] = token.replace(">", "<");
        // } else if (token.match(/\"*\"/)) {
        //   let randString = Math.random().toString(36).substr(2);
        //   tokens[index] = token.replace(/\"*\"/, `"${randString}"`)
        } else if (token.includes("HttpStatus.OK")) {
          tokens[index] = token.replace("HttpStatus.OK", "HttpStatus.NOT_FOUND")
        } else if (token.includes("HttpStatus.NOT_FOUND")) {
          tokens[index] = token.replace("HttpStatus.NOT_FOUND", "HttpStatus.BAD_REQUEST")
        } else if (token.includes("HttpStatus.BAD_REQUEST")) {
          tokens[index] = token.replace("HttpStatus.BAD_REQUEST", "HttpStatus.OK")
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

async function mtfuzz(iterations, seeds) {
  var failedTests = {};
  var mutationsCaught = 0;
  var passedTests = 0;

  // mutater.seed(0);

  console.log(
    chalk.green(
      `Fuzzing iTrust2-v8 with ${iterations} randomly generated-inputs.`,
    ),
  );

  await new Promise(async (resolve) => {
    for (var i = 1; i <= iterations; i++) {
      // Reset iTrust source code and database
      child.execSync(`cd /tmp/iTrust2-v8/ && git reset --hard HEAD`);
      await child.execSync(`cd /tmp/iTrust2-v8 && mysql -u root --password=${process.env.MYSQL_PASS} -e 'DROP DATABASE IF EXISTS iTrust2'`);
  
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
        await new Promise((resolve, reject) => {
          const spawn = child.exec(`cd /tmp/iTrust2-v8/iTrust2 && mvn clean test -l maven.log`);
          var logContents = fs.readFileSync('/tmp/iTrust2-v8/iTrust2/maven.log', 'utf-8');
          const logLines = logContents.split('\n');
          spawn.on('exit', (code) => {
            if (code && logContents.includes("Compilation Failure")) {
              mutationsCaught++;
              reject();
            } else {
              if (logLines[logLines.length - 12].includes("iTrust2: There are test failures.")) {
                console.log(chalk.greenBright(`Mutation ${i} caught by test suite...`));
                mutationsCaught++;
                const testFailures = logLines.filter(line => line.includes("<<< FAILURE! - in ")).map(line => line.substr(line.indexOf("<<< FAILURE! - in ") + 18));
                testFailures.forEach(testFailure => {
                  failedTests[testFailure] = {
                    mutations: [
                      ...(failedTests[testFailure] && failedTests[testFailure].mutations ? failedTests[testFailure].mutations : []),
                      `.mutations/${i}.txt`
                    ]
                  }
                })
                resolve();
              } else {
                console.log(chalk.redBright(`Mutation ${i} passed test suite...`));
                passedTests++;
                resolve();
              }
            }
          })
        });
      } catch (e) {
        console.log(chalk.redBright(`Fuzzing resulted in compilation error. Skipping...`));
      }
    }

    resolve();
  });

  // RESULTS OF FUZZING
  console.log(chalk.greenBright(`Overall mutation coverage: ${mutationsCaught}/${iterations} (${((mutationsCaught / iterations) * 100).toFixed(0)}%) mutations caught by the test suite.`));
  console.log(chalk.greenBright("Useful Tests"));
  console.log(chalk.blueBright("============"));

  Object.keys(failedTests)
  .map(failedTest => {
    return {
      name: failedTest,
      ...failedTests[failedTest]
    }
  }).sort((a, b) => b.mutations.length - a.mutations.length)
  .forEach(failedTest => {
    console.log(`${failedTest.mutations.length}/${iterations} ${failedTest.name}`);
    console.log(failedTest.mutations.map(mutation => `\t- ${mutation}`).join('\n'));
  })
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
