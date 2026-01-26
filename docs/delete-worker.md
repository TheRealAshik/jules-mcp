# jules_delete_worker Tool

## Overview
The `jules_delete_worker` tool allows you to delete a Jules worker session via the MCP server. This is useful for cleaning up completed or unwanted worker sessions.

## API Reference
Based on the [Jules API Documentation](https://jules.google/docs/api/reference/sessions/#delete-a-session)

## Usage

### Tool Definition
```json
{
  "name": "jules_delete_worker",
  "description": "Delete a worker session",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": {
        "type": "string",
        "description": "Worker session ID to delete"
      }
    },
    "required": ["session_id"]
  }
}
```

### Example Call
```json
{
  "name": "jules_delete_worker",
  "arguments": {
    "session_id": "your-session-id-here"
  }
}
```

### Response on Success
```json
{
  "status": "success",
  "message": "Worker your-session-id-here deleted"
}
```

### Error Responses

#### Worker Not Found (Local State)
```json
{
  "status": "error",
  "message": "Worker not found: your-session-id-here"
}
```

#### Session Not Found (API)
```json
{
  "status": "error",
  "message": "Session not found: your-session-id-here"
}
```

#### Other Errors
```json
{
  "status": "error",
  "message": "Failed to delete session (HTTP 500): ..."
}
```

## Implementation Details

### Components Modified

1. **`src/jules-client.ts`**
   - Added `deleteSession(sessionId: string)` method
   - Makes DELETE request to `/sessions/{sessionId}`
   - Handles 404 and other error responses

2. **`src/worker-manager.ts`**
   - Added `deleteWorker(sessionId: string)` method
   - Calls `julesClient.deleteSession()`
   - Removes worker from local workers map

3. **`src/index.ts`**
   - Added `jules_delete_worker` tool definition
   - Added handler case for the tool
   - Implemented `handleDeleteWorker()` method

### Workflow

```
User Request
    ↓
handleDeleteWorker()
    ↓
WorkerManager.deleteWorker()
    ↓
├─→ Check if worker exists in local map
│   └─→ If not found: throw error
    ↓
├─→ JulesAPIClient.deleteSession()
│   └─→ DELETE /sessions/{sessionId}
│       └─→ Handle API errors (404, 500, etc.)
    ↓
└─→ Remove from local workers map
    ↓
Success Response
```

## Testing

### Automated Tests
Run the comprehensive test suite:
```bash
npm test -- delete-worker.test.ts
```

The test suite includes:
- ✅ Successfully delete a session
- ✅ Handle 404 error when session not found
- ✅ Handle other errors (500, etc.)
- ✅ Delete a worker and remove from map
- ✅ Throw error when deleting non-existent worker
- ✅ Integration test: create and delete worker flow

### Manual Testing
You can test the functionality manually using the provided script:

```bash
# 1. Set your API key
export JULES_API_KEY="your-api-key"

# 2. Update the test source in the script
# Edit: tests/manual-test-delete-worker.js
# Change: const testSource = 'sources/github/your-org/your-repo';

# 3. Run the manual test
node tests/manual-test-delete-worker.js
```

The manual test will:
1. Create a test worker
2. Check its status
3. Delete the worker
4. Verify deletion
5. Test error handling

## Best Practices

### When to Delete Workers
- ✅ After a worker has completed its task
- ✅ When a worker is stuck or unresponsive
- ✅ To clean up test/experimental workers
- ✅ Before worker limit is reached

### When NOT to Delete Workers
- ❌ While a worker is actively executing
- ❌ Before retrieving important results/outputs
- ❌ Without proper error handling
- ❌ If you need the session history later

## Error Handling

Always wrap delete operations in try-catch blocks:

```typescript
try {
  await workerManager.deleteWorker(sessionId);
  console.log('Worker deleted successfully');
} catch (error) {
  if (error.message.includes('Worker not found')) {
    console.log('Worker already deleted or never existed');
  } else {
    console.error('Failed to delete worker:', error.message);
  }
}
```

## Related Tools

- `jules_create_worker` - Create a new worker session
- `jules_get_status` - Check worker status before deletion
- `jules_get_activities` - Retrieve worker activities before deletion
- `jules_send_message` - Send final instructions before deletion

## API Permissions

Ensure your Jules API key has permissions to:
- ✅ Create sessions (`POST /sessions`)
- ✅ Read sessions (`GET /sessions/{id}`)
- ✅ Delete sessions (`DELETE /sessions/{id}`)

## Troubleshooting

### "Worker not found" Error
- The worker may have been deleted already
- Check if the session ID is correct
- Verify the worker was created in the current WorkerManager instance

### "Session not found" API Error (404)
- The session was deleted from Jules API
- The session ID might be incorrect
- Check if the session expired

### Network Errors
- Verify JULES_API_KEY is set correctly
- Check BASE_URL configuration
- Ensure network connectivity to Jules API

## Version History

- **v1.0.1**: Added `jules_delete_worker` functionality
  - Implemented DELETE endpoint
  - Added comprehensive tests
  - Created manual testing script

## See Also

- [Jules API Documentation](https://jules.google/docs/api/reference/sessions/#delete-a-session)
- [Jules MCP Server README](../README.md)
- [Worker Management Guide](../SKILLS.md)
