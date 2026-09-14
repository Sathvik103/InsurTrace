'use strict';

const { Contract } = require('fabric-contract-api');

class VehicleHistory extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async RecordEvent(ctx, vehicleId, eventType, entityId, localDataHash, timestamp) {
        console.info('============= START : RecordEvent ===========');
        const event = {
            docType: 'vehicle_event',
            vehicleId,
            eventType,
            entityId,
            localDataHash,
            timestamp,
            recorderOrg: ctx.clientIdentity.getMSPID()
        };

        const eventKey = ctx.stub.createCompositeKey('Event', [vehicleId, timestamp, entityId]);
        await ctx.stub.putState(eventKey, Buffer.from(JSON.stringify(event)));
        
        console.info('============= END : RecordEvent ===========');
        return eventKey;
    }

    async GetVehicleHistory(ctx, vehicleId) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('Event', [vehicleId]);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async VerifyEvent(ctx, vehicleId, timestamp, entityId) {
        const eventKey = ctx.stub.createCompositeKey('Event', [vehicleId, timestamp, entityId]);
        const eventAsBytes = await ctx.stub.getState(eventKey);
        
        if (!eventAsBytes || eventAsBytes.length === 0) {
            throw new Error(`${eventKey} does not exist`);
        }
        return eventAsBytes.toString();
    }
}

module.exports = VehicleHistory;
