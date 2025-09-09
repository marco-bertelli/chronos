import { Chronos } from '../../src';

process.on('message', message => {
	if (message === 'cancel') {
		process.exit(2);
	} else {
		console.log('got message', message);
	}
});

(async () => {
	/** do other required initializations */

	// get process arguments (name, jobId and path to chronos definition file)
	const [, , name, jobId, agendaDefinition] = process.argv;

	// set fancy process title
	process.title = `${process.title} (sub worker: ${name}/${jobId})`;

	// initialize Chronos in "forkedWorker" mode
	const chronos = new Chronos({ name: `subworker-${name}`, forkedWorker: true });
	// connect chronos (but do not start it)
	await chronos.database(process.env.DB_CONNECTION!);

	if (!name || !jobId) {
		throw new Error(`invalid parameters: ${JSON.stringify(process.argv)}`);
	}

	// load job definition
	/** in this case the file is for example ../some/path/definitions.js
   with a content like:
   export default (chronos: Chronos, definitionOnly = false) => {
	chronos.define(
	  'some job',
	  async (notification: {
		attrs: { data: { dealId: string; orderId: TypeObjectId<IOrder> } };
	  }) => {
		// do something
	  }
	);

	if (!definitionOnly) {
		// here you can create scheduled jobs or other things
	}
	});
   */
	if (agendaDefinition) {
		const loadDefinition = await import(agendaDefinition);
		(loadDefinition.default || loadDefinition)(chronos, true);
	}

	// run this job now
	await chronos.runForkedJob(jobId);

	// disconnect database and exit
	process.exit(0);
})().catch(err => {
	console.error('err', err);
	if (process.send) {
		process.send(JSON.stringify(err));
	}
	process.exit(1);
});
