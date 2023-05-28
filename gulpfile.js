// Use strict mode to avoid common JavaScript pitfalls
'use strict';

// Include Gulp, the streaming build system
const gulp = require('gulp');

// Include Microsoft's SharePoint build tools for web projects
const build = require('@microsoft/sp-build-web');

// Include Node's built-in filesystem module to work with the file system
const fs = require('fs');

// Include Node's built-in child process module to run commands in a child process
const child_process = require('child_process');

// Define the path to the package-solution.json file, which contains the solution's version number
const packageSolutionJsonPath = './config/package-solution.json';

// Add a suppression to ignore a specific warning from the SASS compiler about CSS class naming conventions
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// This task increments the solution version in the package-solution.json file
gulp.task('increment-version', (done) => {
  // Read the package-solution.json file
  const packageSolutionJson = JSON.parse(fs.readFileSync(packageSolutionJsonPath, 'utf8'));

  // Get the current version from the file
  const currentVersion = packageSolutionJson.solution.version;
  const versionParts = currentVersion.split('.');

  // Increment the last part of the version number
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}.${parseInt(versionParts[3], 10) + 1}`;

  // Update the version in the packageSolutionJson object
  packageSolutionJson.solution.version = newVersion;

  // Write the updated packageSolutionJson back to the file
  fs.writeFileSync(packageSolutionJsonPath, JSON.stringify(packageSolutionJson, null, 2));

  console.log(`Version increment to ${newVersion}`);

  done();
});

// This task runs the 'increment-version', 'clean', 'bundle', and 'package-solution' tasks in order
gulp.task('dist', (done) => {
  // Run the 'increment-version' gulp task
  child_process.exec('gulp increment-version', (error, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);

    // If there was an error, print it and stop the task
    if (error) {
      console.error(`increment-version task failed with error: ${error}`);
      done(error);
      return;
    }

    // Run the 'clean' gulp task
    child_process.exec('gulp clean', (error, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);

      // If there was an error, print it and stop the task
      if (error) {
        console.error(`clean task failed with error: ${error}`);
        done(error);
        return;
      }

      // Run the 'bundle' gulp task
      child_process.exec('gulp bundle --ship', (error, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);

        // If there was an error, print it but don't stop the task
        // Bundle task errors usually don't create a blocking situation for package creation, so we continue processing.
        // Optionally, you can uncomment the related lines to halt the task upon encountering a bundle error.
        if (error) {
          console.error(`bundle task failed with error: ${error}`);
          // done(error);
          // return;
        }

        // Run the 'package-solution' gulp task
        child_process.exec('gulp package-solution --ship', (error, stdout, stderr) => {
          console.log(stdout);
          console.error(stderr);

          // If there was an error, print it and stop the task
          if (error) {
            console.error(`package-solution task failed with error: ${error}`);
            done(error);
            return;
          }

          // All tasks are done, so call the callback function
          done();
        });
      });
    });
  });
});

// Initialize gulp with the Microsoft SharePoint build tools
build.initialize(gulp);