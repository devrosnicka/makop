import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from './auth/AuthContext';
import { apiFetch } from './api/client';

type Health = { db: 'ok' | 'error'; serverTime: string };

type Player = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  notes: string | null;
  created_at: string;
};

type NewPlayer = {
  name: string;
  email: string;
  phone: string;
  jersey_number: string;
  position: string;
  notes: string;
};

const emptyNewPlayer: NewPlayer = {
  name: '',
  email: '',
  phone: '',
  jersey_number: '',
  position: '',
  notes: '',
};

// Google login redirects back here with ?error=denied (not on the
// allowlist) or ?error=oauth_failed (flow itself broke). See
// backend/src/routes/auth.ts and docs/specs/manager-auth.md.
function loginErrorMessage(): string | null {
  const error = new URLSearchParams(window.location.search).get('error');
  if (error === 'denied') return 'That Google account is not authorized for makop.';
  if (error === 'oauth_failed') return 'Google sign-in failed. Please try again.';
  return null;
}

function LoginPanel() {
  const loginError = loginErrorMessage();
  return (
    <Card>
      <Stack gap="sm" align="flex-start">
        {loginError && (
          <Alert color="red" title="Sign-in failed" variant="light" w="100%">
            {loginError}
          </Alert>
        )}
        <Text size="sm" c="dimmed">
          Manager sign-in required.
        </Text>
        <Button component="a" href="/api/auth/google">
          Sign in with Google
        </Button>
      </Stack>
    </Card>
  );
}

function SignedInPanel() {
  const { email, logout } = useAuth();
  return (
    <Group justify="space-between">
      <Group gap="xs">
        <Badge variant="light" color="brand">
          Signed in
        </Badge>
        <Text size="sm">{email}</Text>
      </Group>
      <Button variant="subtle" size="xs" onClick={() => void logout()}>
        Log out
      </Button>
    </Group>
  );
}

function RosterPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NewPlayer>({
    initialValues: emptyNewPlayer,
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Name is required.' : null),
    },
  });

  useEffect(() => {
    apiFetch<{ players: Player[] }>('/api/players')
      .then((data) => setPlayers(data.players))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(values: NewPlayer) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<Player>('/api/players', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setPlayers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      form.reset();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await apiFetch(`/api/players/${id}`, { method: 'DELETE' });
      setPlayers((prev) => prev.filter((player) => player.id !== id));
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <Card>
      <Stack gap="md">
        <Title order={3}>Player roster</Title>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
        {loading ? (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading...
            </Text>
          </Group>
        ) : (
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Position</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Notes</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {players.map((player) => (
                <Table.Tr key={player.id}>
                  <Table.Td ff="monospace">{player.jersey_number ?? ''}</Table.Td>
                  <Table.Td>{player.name}</Table.Td>
                  <Table.Td>{player.position}</Table.Td>
                  <Table.Td>{player.email}</Table.Td>
                  <Table.Td>{player.phone}</Table.Td>
                  <Table.Td>{player.notes}</Table.Td>
                  <Table.Td>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => void handleDelete(player.id)}
                    >
                      Delete
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {players.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed">
                      No players yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}

        <form onSubmit={form.onSubmit((values) => void handleAdd(values))}>
          <Stack gap="sm">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              <TextInput label="Name" required {...form.getInputProps('name')} />
              <TextInput label="Email" {...form.getInputProps('email')} />
              <TextInput label="Phone" {...form.getInputProps('phone')} />
              <TextInput label="Jersey #" {...form.getInputProps('jersey_number')} />
              <TextInput label="Position" {...form.getInputProps('position')} />
              <TextInput label="Notes" {...form.getInputProps('notes')} />
            </SimpleGrid>
            <Group justify="flex-end">
              <Button type="submit" loading={submitting}>
                Add player
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}

function HealthPanel() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <Card>
      <Stack gap="xs">
        <Title order={4}>Backend status</Title>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
        {!error && !health && <Loader size="sm" />}
        {health && (
          <Group gap="lg">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                DB
              </Text>
              <Badge color={health.db === 'ok' ? 'green' : 'red'} variant="light">
                {health.db}
              </Badge>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Server time
              </Text>
              <Text size="sm" ff="monospace">
                {health.serverTime}
              </Text>
            </Group>
          </Group>
        )}
      </Stack>
    </Card>
  );
}

export default function App() {
  const { loading, authenticated } = useAuth();

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1}>makop</Title>
          <Text c="dimmed">Team management for a Sunday-league small-sided football team.</Text>
        </Stack>

        {loading ? (
          <Loader size="sm" />
        ) : authenticated ? (
          <>
            <SignedInPanel />
            <RosterPanel />
          </>
        ) : (
          <LoginPanel />
        )}

        <HealthPanel />
      </Stack>
    </Container>
  );
}
