import { Chronos } from '../../src';

export default (chronos: Chronos, _definitionOnly = false) => {
	chronos.define('some job', async job => {
		console.log('HELLO from a sub worker');
		if (job.attrs.data?.failIt === 'error') {
			throw new Error('intended error :-)');
		} else if (job.attrs.data?.failIt === 'die') {
			process.exit(2);
		}
	});
};
