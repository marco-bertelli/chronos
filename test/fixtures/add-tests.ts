/* eslint-disable unicorn/no-process-exit */
export default {
	none: (): void => { },
	daily: chronos => {
		chronos.define('once a day test job', (job, done) => {
			process.send!('ran');
			done();
			process.exit(0);
		});

		chronos.every('one day', 'once a day test job');
	},
	'daily-array': chronos => {
		chronos.define('daily test 1', (job, done) => {
			process.send!('test1-ran');
			done();
		});

		chronos.define('daily test 2', (job, done) => {
			process.send!('test2-ran');
			done();
		});

		chronos.every('one day', ['daily test 1', 'daily test 2']);
	},
	'define-future-job': chronos => {
		const future = new Date();
		future.setDate(future.getDate() + 1);

		chronos.define('job in the future', (job, done) => {
			process.send!('ran');
			done();
			process.exit(0);
		});

		chronos.schedule(future, 'job in the future');
	},
	'define-past-due-job': chronos => {
		const past = new Date();
		past.setDate(past.getDate() - 1);

		chronos.define('job in the past', (job, done) => {
			process.send!('ran');
			done();
			process.exit(0);
		});

		chronos.schedule(past, 'job in the past');
	},
	'schedule-array': chronos => {
		const past = new Date();
		past.setDate(past.getDate() - 1);

		chronos.define('scheduled test 1', (job, done) => {
			process.send!('test1-ran');
			done();
		});

		chronos.define('scheduled test 2', (job, done) => {
			process.send!('test2-ran');
			done();
		});

		chronos.schedule(past, ['scheduled test 1', 'scheduled test 2']);
	},
	now(chronos) {
		chronos.define('now run this job', (job, done) => {
			process.send!('ran');
			done();
			process.exit(0);
		});

		chronos.now('now run this job');
	}
};
/* eslint-enable unicorn/no-process-exit */
