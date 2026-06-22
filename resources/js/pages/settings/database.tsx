import { Transition } from '@headlessui/react';
import { Form, Head, usePage, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import {
    edit as editDatabase,
    store,
    test,
    activate,
    destroy,
    deactivate,
} from '@/routes/database';

interface DatabaseConnection {
    id: number;
    connection_name: string;
    driver: string;
    host: string;
    port: number;
    database: string;
    username: string;
    is_active: boolean;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Database settings',
        href: editDatabase().url,
    },
];

export default function DatabaseSettings({
    connections,
    status,
    currentDefaultDriver,
}: {
    connections: DatabaseConnection[];
    status?: string;
    currentDefaultDriver: string;
}) {
    const { props } = usePage<
        SharedData & { test_success?: boolean; test_message?: string }
    >();

    const [showForm, setShowForm] = useState(false);
    const [testMessage, setTestMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [connectionTested, setConnectionTested] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const testForm = useForm({
        driver: 'pgsql',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
    });

    const handleTestConnection = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setTestMessage(null);
        setConnectionTested(false);

        router.post(test().url, testForm.data, {
            onSuccess: (page: any) => {
                setTestMessage({
                    type: 'success',
                    message: 'Database connection successful!',
                });
                setConnectionTested(true);
            },
            onError: (errors: any) => {
                const errorMessage =
                    Object.values(errors).flat().join(', ') ||
                    'Failed to test connection';
                setTestMessage({
                    type: 'error',
                    message: String(errorMessage),
                });
                setConnectionTested(false);
            },
        });
    };

    const handleActivateConnection = () => {
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const connectionName = formData.get('connection_name') as string;
        const driver = testForm.data.driver;
        const host = testForm.data.host;
        const port = testForm.data.port;
        const database = testForm.data.database;
        const username = testForm.data.username;
        const password = testForm.data.password;

        router.post(
            store().url,
            {
                connection_name: connectionName,
                driver,
                host,
                port,
                database,
                username,
                password,
            },
            {
                onSuccess: (page: any) => {
                    const connectionId =
                        page.props.newConnectionId || page.props.connection?.id;

                    if (connectionId) {
                        router.post(
                            activate(connectionId).url,
                            {},
                            {
                                onSuccess: () => {
                                    formRef.current?.reset();
                                    setShowForm(false);
                                    setTestMessage(null);
                                    setConnectionTested(false);
                                    testForm.reset();
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 500);
                                },
                            },
                        );
                    } else {
                        // If no ID returned, just reload
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                },
                onError: (errors: any) => {
                    const errorMessage =
                        Object.values(errors).flat().join(', ') ||
                        'Failed to save connection';
                    setTestMessage({
                        type: 'error',
                        message: String(errorMessage),
                    });
                },
            },
        );
    };
    
    useEffect(() => {
        if (props.test_message) {
            setTestMessage({
                type: props.test_success ? 'success' : 'error',
                message: props.test_message,
            });
        }
    }, [props.test_message, props.test_success]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database settings" />

            <h1 className="sr-only">Database Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    {status && (
                        <div className="rounded-md bg-green-50 p-4 text-sm font-medium text-green-800">
                            {status}
                        </div>
                    )}
                    {/* Current active database banner */}
                    <div
                        className={`rounded-md p-4 text-sm font-medium ${
                            currentDefaultDriver === 'sqlite'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-amber-50 text-amber-800'
                        }`}
                    >
                        {currentDefaultDriver === 'sqlite' ? (
                            <>
                                You are currently running on the local SQLite
                                database.
                            </>
                        ) : (
                            <>
                                You are currently connected to an external{' '}
                                {currentDefaultDriver === 'pgsql'
                                    ? 'PostgreSQL'
                                    : 'MySQL'}{' '}
                                database. Deactivate it below to fall back to
                                local SQLite.
                            </>
                        )}
                    </div>

                    {/* Existing Connections */}
                    <div>
                        <Heading
                            variant="small"
                            title="Active connections"
                            description="Manage your database connections"
                        />

                        {connections.length > 0 ? (
                            <div className="mt-6 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Connection Name
                                            </TableHead>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Host</TableHead>
                                            <TableHead>Port</TableHead>
                                            <TableHead>Database</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {connections.map((conn) => (
                                            <TableRow key={conn.id}>
                                                <TableCell className="font-medium">
                                                    {conn.connection_name}
                                                </TableCell>
                                                <TableCell>
                                                    {conn.driver}
                                                </TableCell>
                                                <TableCell>
                                                    {conn.host}
                                                </TableCell>
                                                <TableCell>
                                                    {conn.port}
                                                </TableCell>
                                                <TableCell>
                                                    {conn.database}
                                                </TableCell>
                                                <TableCell>
                                                    {conn.is_active ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="space-x-2">
                                                    {conn.is_active ? (
                                                        <Form
                                                            method="post"
                                                            action={
                                                                deactivate(
                                                                    conn.id,
                                                                ).url
                                                            }
                                                            className="inline"
                                                        >
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                Deactivate (use
                                                                SQLite)
                                                            </Button>
                                                        </Form>
                                                    ) : (
                                                        <>
                                                            <Form
                                                                method="post"
                                                                action={
                                                                    activate(
                                                                        conn.id,
                                                                    ).url
                                                                }
                                                                className="inline"
                                                            >
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    Activate
                                                                </Button>
                                                            </Form>
                                                            <Form
                                                                method="delete"
                                                                action={
                                                                    destroy(
                                                                        conn.id,
                                                                    ).url
                                                                }
                                                                onSubmit={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        !confirm(
                                                                            'Are you sure you want to delete this connection?',
                                                                        )
                                                                    ) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                className="inline"
                                                            >
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </Form>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-md border border-dashed border-gray-300 px-4 py-6 text-center">
                                <p className="text-sm text-gray-600">
                                    No database connections configured yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Add New Connection Form */}
                    <div className="space-y-4 border-t pt-6">
                        {!showForm ? (
                            <Button onClick={() => setShowForm(true)}>
                                Add New Connection
                            </Button>
                        ) : (
                            <form
                                ref={formRef}
                                onSubmit={handleTestConnection}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="connection_name">
                                            Connection Name *
                                        </Label>
                                        <Input
                                            id="connection_name"
                                            name="connection_name"
                                            type="text"
                                            placeholder="e.g., Main Server, Office Database"
                                            required
                                        />
                                        <p className="text-xs text-gray-500">
                                            A unique name to identify this
                                            connection
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="driver">Driver *</Label>
                                        <select
                                            id="driver"
                                            name="driver"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue="pgsql"
                                            onChange={(e) =>
                                                testForm.setData(
                                                    'driver',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="pgsql">
                                                PostgreSQL
                                            </option>
                                            <option value="mysql">MySQL</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="host">Host *</Label>
                                            <Input
                                                id="host"
                                                name="host"
                                                type="text"
                                                placeholder="localhost or IP address"
                                                value={testForm.data.host}
                                                onChange={(e) =>
                                                    testForm.setData(
                                                        'host',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="port">Port *</Label>
                                            <Input
                                                id="port"
                                                name="port"
                                                type="number"
                                                placeholder="5432"
                                                value={testForm.data.port}
                                                onChange={(e) =>
                                                    testForm.setData(
                                                        'port',
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 5432,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="database">
                                            Database Name *
                                        </Label>
                                        <Input
                                            id="database"
                                            name="database"
                                            type="text"
                                            placeholder="database_name"
                                            value={testForm.data.database}
                                            onChange={(e) =>
                                                testForm.setData(
                                                    'database',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="username">
                                                Username *
                                            </Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                type="text"
                                                placeholder="postgres"
                                                value={testForm.data.username}
                                                onChange={(e) =>
                                                    testForm.setData(
                                                        'username',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                Password *
                                            </Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={testForm.data.password}
                                                onChange={(e) =>
                                                    testForm.setData(
                                                        'password',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {testMessage &&
                                    testMessage.type === 'error' && (
                                        <Transition
                                            show={!!testMessage}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <div
                                                className={`rounded-md bg-red-50 p-4 text-sm text-red-800`}
                                            >
                                                {testMessage.message}
                                            </div>
                                        </Transition>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={testForm.processing}
                                    >
                                        {testForm.processing
                                            ? 'Testing...'
                                            : 'Test Connection'}
                                    </Button>

                                    {connectionTested &&
                                        testMessage?.type === 'success' && (
                                            <Button
                                                type="button"
                                                onClick={
                                                    handleActivateConnection
                                                }
                                            >
                                                Activate Connection
                                            </Button>
                                        )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowForm(false);
                                            setTestMessage(null);
                                            setConnectionTested(false);
                                            testForm.reset();
                                            if (formRef.current)
                                                formRef.current.reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                        <h3 className="font-medium text-blue-900">
                            How to use database connections
                        </h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                            <li>
                                Add a new database connection by clicking "Add
                                New Connection"
                            </li>
                            <li>
                                Fill in your PostgreSQL or MySQL server details
                            </li>
                            <li>
                                Click "Test Connection" to verify the
                                credentials are correct
                            </li>
                            <li>
                                Once tested successfully, click "Save
                                Connection"
                            </li>
                            <li>
                                Activate a connection to use it as the primary
                                database
                            </li>
                            <li>
                                Once activated, all data will be stored and
                                retrieved from the selected database across your
                                network
                            </li>
                            <li>Only inactive connections can be deleted</li>
                        </ul>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
