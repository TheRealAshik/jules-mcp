#!/usr/bin/env node

/**
 * Manual test script for jules_delete_worker functionality
 * 
 * This script demonstrates:
 * 1. Creating a worker session
 * 2. Checking worker status
 * 3. Deleting the worker session
 * 4. Verifying the worker is deleted
 * 
 * Before running this script:
 * 1. Set JULES_API_KEY environment variable
 * 2. Ensure you have a valid GitHub source configured
 * 
 * Usage: node manual-test-delete-worker.js
 */

import { JulesAPIClient } from '../src/jules-client.js';
import { WorkerManager } from '../src/worker-manager.js';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.JULES_API_KEY;
const BASE_URL = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com';
const API_VERSION = process.env.JULES_API_VERSION || 'v1alpha';

async function testDeleteWorker() {
    console.log('🧪 Testing jules_delete_worker functionality...\n');

    if (!API_KEY) {
        console.error('❌ Error: JULES_API_KEY environment variable is not set');
        process.exit(1);
    }

    try {
        // Initialize client and worker manager
        console.log('📦 Initializing Jules client...');
        const julesClient = new JulesAPIClient(API_KEY, BASE_URL, API_VERSION);
        const workerManager = new WorkerManager(julesClient);

        // List available sources
        console.log('\n📚 Fetching available sources...');
        const sources = await workerManager.listSources();
        console.log('Available sources:', JSON.stringify(sources, null, 2));

        // You'll need to replace this with an actual source from your account
        const testSource = 'sources/github/your-org/your-repo'; // TODO: Update with your actual source

        console.log(`\n📝 Using source: ${testSource}`);
        console.log('⚠️  Note: Update the testSource in the script with your actual GitHub source\n');

        // Step 1: Create a test worker
        console.log('1️⃣  Creating a test worker...');
        const sessionId = await workerManager.createWorker(
            'This is a test worker to demonstrate the delete functionality. Please respond with a simple "Hello".',
            testSource,
            'Test Worker - Delete Demo',
            'main',
            'FREELANCER'
        );
        console.log(`✅ Worker created with session ID: ${sessionId}\n`);

        // Step 2: Get worker status
        console.log('2️⃣  Checking worker status...');
        let worker = await workerManager.getWorkerStatus(sessionId);
        console.log('Worker details:', JSON.stringify(worker, null, 2));
        console.log(`✅ Worker exists: ${worker !== null}\n`);

        // Wait a bit to let the worker initialize
        console.log('⏱️  Waiting 3 seconds before deletion...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Delete the worker
        console.log('\n3️⃣  Deleting the worker...');
        await workerManager.deleteWorker(sessionId);
        console.log(`✅ Worker ${sessionId} deleted successfully\n`);

        // Step 4: Verify deletion
        console.log('4️⃣  Verifying worker deletion...');
        worker = await workerManager.getWorkerStatus(sessionId);
        console.log(`✅ Worker exists after deletion: ${worker !== null}`);

        if (worker === null) {
            console.log('\n✨ SUCCESS! Worker was successfully deleted from local state\n');
        } else {
            console.log('\n❌ FAILED! Worker still exists in local state\n');
        }

        // Test error handling: Try to delete non-existent worker
        console.log('5️⃣  Testing error handling with non-existent worker...');
        try {
            await workerManager.deleteWorker('non-existent-worker-id');
            console.log('❌ FAILED! Should have thrown an error');
        } catch (error: any) {
            console.log(`✅ Correctly threw error: ${error.message}\n`);
        }

        console.log('🎉 All tests completed successfully!');

    } catch (error: any) {
        console.error('\n❌ Test failed with error:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the test
testDeleteWorker().catch(console.error);
