const esprima = require("esprima");
const options = { tokens: true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const jsreg = /.*\.js$/;

function getFiles(dir, files) {
  var fileList = fs.readdirSync(dir);
  if (files == null) {
    files = [];
  }

  fileList.forEach(function (file) {
    if (fs.statSync(dir + "/" + file).isDirectory()) {
      // Call recursively
      files = getFiles(dir + "/" + file, files);
    } else if (jsreg.test(file)) {
      files.push(path.join(dir + "/" + file));
    }
  });

  return files;
}

function main() {
  var args = process.argv.slice(2);

  if (args.length == 0) {
    // default value is current directory if no other args
    args = [window.location.pathname];
  }
  var filePath = args[0];

  var files = getFiles(filePath, files);

  for (var index in files) {
    console.log("Parsing ast and running static analysis on " + files[index]);
    var builders = {};
    complexity(files[index], builders);
    console.log("Complete.");

    // Report
    if (Object.keys(builders).length === 0) {
      console.log(chalk.red("No function declarations found.\n"));
    }
    for (var node in builders) {
      var builder = builders[node];
      builder.report();
    }
  }
}

function complexity(filePath, builders) {
  var buf = fs.readFileSync(filePath, "utf8");
  var ast = esprima.parse(buf, options);

  // Traverse program with a function visitor.
  traverseWithParents(ast, function (node) {
    if (node.type === "FunctionDeclaration") {
      var builder = new FunctionBuilder();

      builder.FunctionName = functionName(node);
      builder.StartLine = node.loc.start.line;
      // Calculate function level properties.
      // 3. Parameters
      builder.ParameterCount = node.params.length;
      // 4. Method Length
      builder.Length = node.loc.end.line - node.loc.start.line;

      // With new visitor(s)...
      // 5. CyclomaticComplexity
      traverseWithParents(node, function (child) {
        if (child.type == "IfStatement") {
          builder.SimpleCyclomaticComplexity++;
        }

        // Message chaining
        if (
          child.type === "ExpressionStatement" &&
          (child.expression === "CallExpression" ||
            child.expression === "MemberExpression")
        ) {
          let currentLen = 1;
          traverseWithParents(child, function (grandchild) {
            if (
              grandchild.type === "ExpressionStatement" &&
              (grandchild.expression === "CallExpression" ||
                grandchild.expression === "MemberExpression")
            ) {
              currentLen += 1;
            }
          });
          // Update max chain length
          builder.MaxMessageChain = Math.max(
            builder.MaxMessageChain,
            currentLen,
          );
        }
      });

      // 6. Halstead

      builders[builder.FunctionName] = builder;
    }
  });
}

// Represent a reusable "class" following the Builder pattern.
class FunctionBuilder {
  constructor() {
    this.StartLine = 0;
    this.FunctionName = "";
    // The number of parameters for functions
    this.ParameterCount = 0;
    // The number of lines.
    this.Length = 0;
    // Number of if statements/loops + 1
    this.SimpleCyclomaticComplexity = 1;
    // Number of unique symbols + operators
    this.Halstead = 0;
    // The max depth of scopes (nested ifs, loops, etc)
    this.MaxNestingDepth = 0;
    // The max number of conditions if one decision statement.
    this.MaxConditions = 0;
    // Length of longest message chain
    this.MaxMessageChain = 1;
  }

  threshold() {
    const thresholds = {
      SimpleCyclomaticComplexity: [
        { t: 10, color: "red" },
        { t: 4, color: "yellow" },
      ],
      Halstead: [
        { t: 10, color: "red" },
        { t: 3, color: "yellow" },
      ],
      ParameterCount: [
        { t: 10, color: "red" },
        { t: 3, color: "yellow" },
      ],
      Length: [
        { t: 100, color: "red" },
        { t: 10, color: "yellow" },
      ],
      MaxMessageChain: [
        { t: 10, color: "red" },
        { t: 5, color: "yellow" },
      ],
    };

    const showScore = (id, value) => {
      let scores = thresholds[id];
      const lowestThreshold = { t: 0, color: "green" };
      const score =
        scores
          .sort((a, b) => {
            a.t - b.t;
          })
          .find((score) => score.t <= value) || lowestThreshold;
      return score.color;
    };

    this.Halstead = chalk`{${showScore("Halstead", this.Halstead)} ${
      this.Halstead
    }}`;
    this.Length = chalk`{${showScore("Length", this.Length)} ${this.Length}}`;
    this.ParameterCount = chalk`{${showScore(
      "ParameterCount",
      this.ParameterCount,
    )} ${this.ParameterCount}}`;
    this.SimpleCyclomaticComplexity = chalk`{${showScore(
      "SimpleCyclomaticComplexity",
      this.SimpleCyclomaticComplexity,
    )} ${this.SimpleCyclomaticComplexity}}`;
    this.MaxMessageChain = chalk`{${showScore(
      "MaxMessageChain",
      this.MaxMessageChain,
    )} ${this.MaxMessageChain}}`;
  }

  report() {
    this.threshold();

    console.log(
      chalk`{blue.underline ${this.FunctionName}}(): at line #${this.StartLine}
Parameters: ${this.ParameterCount}\tLength: ${this.Length}
Cyclomatic: ${this.SimpleCyclomaticComplexity}\tHalstead: ${this.Halstead}
MaxDepth: ${this.MaxNestingDepth}\tMaxConditions: ${this.MaxConditions}
MaxMessageChain: ${this.MaxMessageChain}\n`,
    );
  }
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor) {
  var key, child;

  visitor.call(null, object);

  for (key in object) {
    if (object.hasOwnProperty(key)) {
      child = object[key];
      if (typeof child === "object" && child !== null && key != "parent") {
        child.parent = object;
        traverseWithParents(child, visitor);
      }
    }
  }
}

// Helper function for counting children of node.
function childrenLength(node) {
  var key, child;
  var count = 0;
  for (key in node) {
    if (node.hasOwnProperty(key)) {
      child = node[key];
      if (typeof child === "object" && child !== null && key != "parent") {
        count++;
      }
    }
  }
  return count;
}

// Helper function for checking if a node is a "decision type node"
function isDecision(node) {
  if (
    node.type == "IfStatement" ||
    node.type == "ForStatement" ||
    node.type == "WhileStatement" ||
    node.type == "ForInStatement" ||
    node.type == "DoWhileStatement"
  ) {
    return true;
  }
  return false;
}

// Helper function for printing out function name.
function functionName(node) {
  if (node.id) {
    return node.id.name;
  }
  return "anon function @" + node.loc.start.line;
}

main();
exports.main = main;
