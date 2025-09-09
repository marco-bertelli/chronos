/**
 * @file Illustrate concurrency and locking
 */
import Chronos from 'chronos';

function time() {
  return new Date().toTimeString().split(' ')[0];
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const chronos = new Chronos({
  db: {
    address: 'mongodb://127.0.0.1/chronos',
    options: { useNewUrlParser: true },
    collection: `chronosJobs-${Math.random()}` // Start fresh every time
  }
});

let jobRunCount = 1;
chronos.define(
  'long-running job',
  {
    lockLifetime: 5 * 1000, // Max amount of time the job should take
    concurrency: 3 // Max number of job instances to run at the same time
  },
  async (job, done) => {
    const thisJob = jobRunCount++;
    console.log(`#${thisJob} started`);

    // 3 job instances will be running at the same time, as specified by `concurrency` above
    await sleep(30 * 1000);
    // Comment the job processing statement above, and uncomment one of the blocks below

    /*
  // Imagine a job that takes 8 seconds. That is longer than the lockLifetime, so
  // we'll break it into smaller chunks (or set its lockLifetime to a higher value).
  await sleep(4 * 1000);  // 4000 < lockLifetime of 5000, so the job still has time to finish
  await job.touch();      // tell Chronos the job is still running, which resets the lock timeout
  await sleep(4 * 1000);  // do another chunk of work that takes less than the lockLifetime
  */

    // Only one job will run at a time because 3000 < lockLifetime
    // await sleep(3 * 1000);

    console.log(`#${thisJob} finished`);
    done();
  }
);

(async function () {
  console.log(time(), 'Chronos started');
  chronos.processEvery('1 second');
  await chronos.start();
  await chronos.every('1 second', 'long-running job');

  // Log job start and completion/failure
  chronos.on('start', (job) => {
    console.log(time(), `Job <${job.attrs.name}> starting`);
  });
  chronos.on('success', (job) => {
    console.log(time(), `Job <${job.attrs.name}> succeeded`);
  });
  chronos.on('fail', (error, job) => {
    console.log(time(), `Job <${job.attrs.name}> failed:`, error);
  });
})();
