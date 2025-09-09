/* eslint-disable no-console */
import { Db } from 'mongodb';
import * as delay from 'delay';
import { mockMongo } from './helpers/mock-mongodb';

import { Chronos } from '../src';

// chronos instances
let chronos: Chronos;
// mongo db connection db instance
let mongoDb: Db;

const clearJobs = async (): Promise<void> => {
	if (mongoDb) {
		await mongoDb.collection('chronosJobs').deleteMany({});
	}
};

const jobType = 'do work';
const jobProcessor = () => { };

describe('Retry', () => {
	beforeEach(async () => {
		if (!mongoDb) {
			const mockedMongo = await mockMongo();
			mongoDb = mockedMongo.mongo.db();
		}

		return new Promise(resolve => {
			chronos = new Chronos(
				{
					mongo: mongoDb
				},
				async () => {
					await delay(50);
					await clearJobs();
					chronos.define('someJob', jobProcessor);
					chronos.define('send email', jobProcessor);
					chronos.define('some job', jobProcessor);
					chronos.define(jobType, jobProcessor);
					return resolve();
				}
			);
		});
	});

	afterEach(async () => {
		await delay(50);
		await chronos.stop();
		await clearJobs();
		// await mongoClient.disconnect();
		// await jobs._db.close();
	});

	it('should retry a job', async () => {
		let shouldFail = true;

		chronos.processEvery(100); // Shave 5s off test runtime :grin:
		chronos.define('a job', (_job, done) => {
			if (shouldFail) {
				shouldFail = false;
				return done(new Error('test failure'));
			}

			done();
			return undefined;
		});

		chronos.on('fail:a job', (err, job) => {
			if (err) {
				// Do nothing as this is expected to fail.
			}

			job.schedule('now').save();
		});

		const successPromise = new Promise(resolve => {
			chronos.on('success:a job', resolve)
		});

		await chronos.now('a job');

		await chronos.start();
		await successPromise;
	}).timeout(100000);
});
