# Database Settings Feature - Setup & Usage Guide

## Overview

This feature allows users to dynamically configure and switch between database connections at runtime without requiring environment variable changes. This is particularly useful for NativePHP desktop applications that need to connect to different PostgreSQL databases across a network.

## Features

- **Dynamic Database Configuration**: Change database connections without restarting the application
- **Connection Testing**: Validate database credentials before saving
- **Multi-Connection Support**: Store multiple database configurations (only one active at a time)
- **Network-Ready**: Share data across different computers on the same network
- **PostgreSQL & MySQL Support**: Works with both PostgreSQL and MySQL databases

## Installation & Setup

### 1. Run Database Migrations

First, you need to create the `database_connections` table:

```bash
php artisan migrate
```

This will create the `database_connections` table in your SQLite database (or your configured default database).

### 2. Verify Routes

The routes have been automatically added to `routes/settings.php`:

- `GET /settings/database` - View database settings page
- `POST /settings/database` - Store new connection (after testing)
- `POST /settings/database/test` - Test a connection
- `POST /settings/database/{connection}/activate` - Activate a connection
- `DELETE /settings/database/{connection}` - Delete a connection

### 3. Access Permissions

Database settings are restricted to authenticated users with the "manager" role by default. To allow other roles, edit:

```php
// app/Http/Requests/Settings/DatabaseConnectionStoreRequest.php
public function authorize(): bool
{
    return auth()->check() && auth()->user()->isManager();
}
```

## How to Use

### For End Users

1. Navigate to **Settings → Database** in your application
2. Click **Add New Connection**
3. Fill in the database details:
   - **Connection Name**: A unique identifier (e.g., "Main Office Server")
   - **Driver**: Select PostgreSQL or MySQL
   - **Host**: Database server address or IP
   - **Port**: Database port (default: 5432 for PostgreSQL, 3306 for MySQL)
   - **Database**: Database name to connect to
   - **Username**: Database user
   - **Password**: Database password
4. Click **Test Connection** to verify the credentials
5. If successful, click **Save Connection**
6. To use this database, click **Activate** on the connection row
7. Once activated, all data operations will use this database

### Important Notes

- Only one connection can be active at a time
- The active connection is used for all database operations
- Inactive connections can be deleted
- Active connections cannot be deleted (deactivate first)
- Test the connection before activating to ensure it's valid

## Architecture

### Key Components

#### 1. DatabaseConnection Model
**File**: `app/Models/DatabaseConnection.php`

Represents a saved database connection with methods:
- `getActiveConnection()` - Get the currently active connection
- `makeActive()` - Set this connection as active
- `testConnection()` - Test if the connection works

#### 2. DatabaseConnectionController
**File**: `app/Http/Controllers/Settings/DatabaseConnectionController.php`

Handles:
- Displaying the database settings page
- Creating new connections
- Testing connections
- Activating connections
- Deleting connections

#### 3. DatabaseConfigurationService
**File**: `app/Services/DatabaseConfigurationService.php`

Responsible for:
- Loading the active database connection at app boot
- Testing database connections via PDO
- Managing dynamic configuration

#### 4. AppServiceProvider
**File**: `app/Providers/AppServiceProvider.php`

Calls `DatabaseConfigurationService::loadActiveConnection()` in the boot method to load the active connection when the app starts.

#### 5. Frontend Component
**File**: `resources/js/pages/settings/database.tsx`

React/TypeScript component providing:
- List of existing connections
- Form to add new connections
- Connection testing interface
- Activation and deletion controls

## Database Schema

The `database_connections` table stores:

```
- id: Unique identifier
- connection_name: User-friendly name
- driver: 'pgsql' or 'mysql'
- host: Database server hostname/IP
- port: Database port number
- database: Database name
- username: Database user
- password: Encrypted database password
- charset: Character set (default: utf8)
- is_active: Whether this is the active connection
- created_at: Creation timestamp
- updated_at: Last modification timestamp
```

## How It Works

### 1. On Application Boot
- `AppServiceProvider` calls `DatabaseConfigurationService::loadActiveConnection()`
- Service checks if a database connection has been marked as active
- If found, updates the Laravel configuration with the stored credentials
- All subsequent database calls use this connection

### 2. When User Adds a Connection
1. User fills form and tests the connection
2. Test endpoint validates credentials via PDO
3. On success, user clicks "Save Connection"
4. Connection is stored in the `database_connections` table
5. User can then activate it

### 3. When User Activates a Connection
1. Selected connection's `is_active` flag is set to true
2. All other connections' `is_active` flags are set to false
3. On next app reload, the new connection is loaded

## Example Scenarios

### Scenario 1: Local Development with Remote Database
1. Set local SQLite as default
2. Configure connection to remote PostgreSQL server
3. Test and activate when ready
4. All data syncs to remote server

### Scenario 2: Multiple Office Locations
1. Create separate connections for each office's database
2. Each office uses their local connection
3. Use database replication if cross-office sync is needed

### Scenario 3: Fallback Configuration
1. Create connection to primary database
2. Keep local SQLite as fallback
3. Switch to local if network database is unavailable

## Troubleshooting

### Connection Test Fails
- Verify the host/IP is correct and reachable
- Check if the port is correct (5432 for PostgreSQL, 3306 for MySQL)
- Ensure firewall allows the connection
- Verify username and password
- Check if the database exists and the user has access

### Changes Don't Take Effect
- Reload or restart the application
- Check that the connection is marked as "Active"
- Verify there are no syntax errors in database credentials

### Permission Denied
- Ensure the user has the "manager" role
- Modify authorization in `DatabaseConnectionStoreRequest` if needed

## Security Considerations

1. **Password Storage**: Passwords are stored in the SQLite database. Consider implementing encryption for production.
2. **Network Security**: Ensure database connections are over secure networks (VPN, private network)
3. **User Access**: Only managers can modify database settings by default
4. **Audit Trail**: Consider adding audit logging for connection changes

## Future Enhancements

- Add password encryption/decryption
- Add connection edit functionality (currently must delete and recreate)
- Add connection history/audit trail
- Add database migration/sync features
- Add connection health monitoring
- Support for more database drivers (SQLServer, etc.)

## Support

For issues or questions about this feature, check:
1. The Laravel logs: `storage/logs/laravel.log`
2. Database connection status in the Settings UI
3. Network connectivity to the database server
