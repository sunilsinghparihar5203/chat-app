import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDot,
  LogOut,
  MessageCircle,
  Radio,
  Search,
  Send,
  Users,
} from 'lucide-react-native';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Profile = {
  id: string;
  display_name: string;
};

type DirectConversation = {
  id: string;
  user_one: string;
  user_two: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ScreenProps = {
  user: User;
  onSignOut: () => void;
};

const palette = {
  background: '#0A1110',
  panel: '#121C1A',
  panelRaised: '#192522',
  line: '#293632',
  text: '#F1F4EB',
  muted: '#8D9A92',
  lime: '#C8F169',
  coral: '#FF8A70',
  white: '#FFFFFF',
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsBooting(false);
      return;
    }

    let isMounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsBooting(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsBooting(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return <SetupScreen />;
  }

  if (isBooting) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {session ? (
        <ChatHub
          user={session.user}
          onSignOut={() => {
            if (supabase) void supabase.auth.signOut();
          }}
        />
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}

function SetupScreen() {
  return (
    <View style={styles.setupScreen}>
      <StatusBar style="light" />
      <BrandMark />
      <View style={styles.setupCopy}>
        <Text style={styles.eyebrow}>REAL-TIME MESSAGING</Text>
        <Text style={styles.setupTitle}>Your signal{ '\n' }starts here.</Text>
        <Text style={styles.setupBody}>
          Connect a Supabase project to turn on accounts, synced conversations, and live messages.
        </Text>
      </View>
      <View style={styles.setupSteps}>
        <SetupStep number="01" title="Create a Supabase project" />
        <SetupStep number="02" title="Run supabase/schema.sql" />
        <SetupStep number="03" title="Add keys from .env.example" />
      </View>
      <View style={styles.setupFoot}>
        <CircleDot color={palette.lime} size={14} />
        <Text style={styles.setupFootText}>BACKEND CONNECTION REQUIRED</Text>
      </View>
    </View>
  );
}

function SetupStep({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.setupStep}>
      <Text style={styles.setupNumber}>{number}</Text>
      <Text style={styles.setupStepText}>{title}</Text>
      <ArrowUpRight color={palette.muted} size={16} />
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.centeredScreen}>
      <StatusBar style="light" />
      <ActivityIndicator color={palette.lime} size="large" />
      <Text style={styles.loadingLabel}>CONNECTING</Text>
    </View>
  );
}

function AuthScreen() {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit() {
    if (!supabase || isSubmitting) return;
    setNotice('');
    setIsSubmitting(true);

    const result = isCreatingAccount
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });

    setIsSubmitting(false);
    if (result.error) {
      setNotice(result.error.message);
    } else if (isCreatingAccount && !result.data.session) {
      setNotice('Check your email to confirm your new account.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.authScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <BrandMark />
        <View style={styles.authIntro}>
          <Text style={styles.eyebrow}>{isCreatingAccount ? 'NEW ACCOUNT' : 'PRIVATE CHANNEL'}</Text>
          <Text style={styles.authTitle}>
            {isCreatingAccount ? 'Find your\npeople.' : 'Good to\nhear you.'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isCreatingAccount ? 'Set up your space on the network.' : 'Sign in to pick up where you left off.'}
          </Text>
        </View>

        {isCreatingAccount && (
          <TextInput
            autoCapitalize="words"
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={palette.muted}
            style={styles.input}
            value={displayName}
          />
        )}
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          autoComplete={isCreatingAccount ? 'new-password' : 'password'}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          placeholder="Password"
          placeholderTextColor={palette.muted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Pressable disabled={isSubmitting} onPress={() => void submit()} style={styles.primaryButton}>
          {isSubmitting ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>{isCreatingAccount ? 'Create account' : 'Sign in'}</Text>
              <ArrowUpRight color={palette.background} size={19} />
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            setNotice('');
            setIsCreatingAccount(!isCreatingAccount);
          }}
          style={styles.authSwitch}
        >
          <Text style={styles.authSwitchText}>
            {isCreatingAccount ? 'Already have an account? ' : 'New to Pulse? '}
            <Text style={styles.authSwitchAction}>{isCreatingAccount ? 'Sign in' : 'Create one'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChatHub({ user, onSignOut }: ScreenProps) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [activeConversation, setActiveConversation] = useState<DirectConversation | null>(null);
  const [activePeer, setActivePeer] = useState<Profile | null>(null);
  const [selectedTab, setSelectedTab] = useState<'chats' | 'people'>('chats');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadHub() {
    if (!supabase) return;
    setIsLoading(true);
    setError('');

    const [peopleResult, conversationResult] = await Promise.all([
      supabase.from('profiles').select('id,display_name').neq('id', user.id).order('display_name'),
      supabase
        .from('conversations')
        .select('id,user_one,user_two,updated_at')
        .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
        .order('updated_at', { ascending: false }),
    ]);

    if (peopleResult.error || conversationResult.error) {
      setError(peopleResult.error?.message ?? conversationResult.error?.message ?? 'Could not load conversations.');
      setIsLoading(false);
      return;
    }

    const nextConversations = (conversationResult.data ?? []) as DirectConversation[];
    setPeople((peopleResult.data ?? []) as Profile[]);
    setConversations(nextConversations);

    if (nextConversations.length > 0) {
      const { data } = await supabase
        .from('messages')
        .select('conversation_id,body,created_at')
        .in('conversation_id', nextConversations.map((conversation) => conversation.id))
        .order('created_at', { ascending: false })
        .limit(100);
      const latestByConversation: Record<string, string> = {};
      for (const message of data ?? []) {
        if (!latestByConversation[message.conversation_id]) {
          latestByConversation[message.conversation_id] = message.body;
        }
      }
      setPreviews(latestByConversation);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadHub();
  }, [user.id]);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    return people.filter((person) => person.display_name.toLowerCase().includes(query));
  }, [people, search]);

  async function openPerson(person: Profile) {
    if (!supabase) return;
    const { data, error: openError } = await supabase.rpc('create_direct_conversation', {
      other_user: person.id,
    });
    if (openError || !data) {
      Alert.alert('Could not open chat', openError?.message ?? 'Please try again.');
      return;
    }

    const [userOne, userTwo] = [user.id, person.id].sort();
    setActivePeer(person);
    setActiveConversation({
      id: data as string,
      user_one: userOne,
      user_two: userTwo,
      updated_at: new Date().toISOString(),
    });
  }

  function openConversation(conversation: DirectConversation) {
    const peerId = conversation.user_one === user.id ? conversation.user_two : conversation.user_one;
    const peer = people.find((person) => person.id === peerId);
    if (!peer) {
      setError('This person is no longer available in the directory.');
      return;
    }
    setActivePeer(peer);
    setActiveConversation(conversation);
  }

  if (activeConversation && activePeer) {
    return (
      <ChatThread
        conversation={activeConversation}
        peer={activePeer}
        user={user}
        onBack={() => {
          setActiveConversation(null);
          setActivePeer(null);
          void loadHub();
        }}
      />
    );
  }

  const visibleConversations = conversations.filter((conversation) => {
    const peerId = conversation.user_one === user.id ? conversation.user_two : conversation.user_one;
    const peer = people.find((person) => person.id === peerId);
    return peer?.display_name.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <View style={styles.hubScreen}>
      <View style={styles.hubTopline}>
        <BrandMark compact />
        <View style={styles.hubTopActions}>
          <View style={styles.connectionPill}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>CONNECTED</Text>
          </View>
          <Pressable accessibilityLabel="Sign out" onPress={onSignOut} style={styles.iconButton}>
            <LogOut color={palette.muted} size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.hubHeading}>
        <Text style={styles.eyebrow}>YOUR NETWORK</Text>
        <Text style={styles.hubTitle}>Messages</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color={palette.muted} size={18} />
        <TextInput
          onChangeText={setSearch}
          placeholder="Search people"
          placeholderTextColor={palette.muted}
          style={styles.searchInput}
          value={search}
        />
      </View>

      <View style={styles.segmentedControl}>
        <TabButton
          icon={<MessageCircle color={selectedTab === 'chats' ? palette.background : palette.muted} size={16} />}
          label="Chats"
          onPress={() => setSelectedTab('chats')}
          selected={selectedTab === 'chats'}
        />
        <TabButton
          icon={<Users color={selectedTab === 'people' ? palette.background : palette.muted} size={16} />}
          label="People"
          onPress={() => setSelectedTab('people')}
          selected={selectedTab === 'people'}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isLoading ? (
        <View style={styles.hubLoading}>
          <ActivityIndicator color={palette.lime} />
        </View>
      ) : selectedTab === 'chats' ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <SectionLabel title="RECENT" count={visibleConversations.length} />
          {visibleConversations.length === 0 ? (
            <EmptyState
              icon={<MessageCircle color={palette.lime} size={21} />}
              title={search ? 'No matching chats' : 'A quiet start'}
              action={search ? undefined : 'Browse people'}
              onAction={search ? undefined : () => setSelectedTab('people')}
            />
          ) : (
            visibleConversations.map((conversation) => {
              const peerId = conversation.user_one === user.id ? conversation.user_two : conversation.user_one;
              const peer = people.find((person) => person.id === peerId);
              if (!peer) return null;
              return (
                <PersonRow
                  key={conversation.id}
                  label={previews[conversation.id] ?? 'Start a conversation'}
                  onPress={() => openConversation(conversation)}
                  person={peer}
                  trailing={<ArrowUpRight color={palette.muted} size={17} />}
                />
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <SectionLabel title="PEOPLE" count={filteredPeople.length} />
          {filteredPeople.length === 0 ? (
            <EmptyState
              icon={<Users color={palette.lime} size={21} />}
              title={search ? 'No one found' : 'No other accounts yet'}
            />
          ) : (
            filteredPeople.map((person) => (
              <PersonRow
                key={person.id}
                label="Pulse member"
                onPress={() => void openPerson(person)}
                person={person}
                trailing={<ArrowUpRight color={palette.lime} size={17} />}
              />
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.hubFooter}>
        <Radio color={palette.lime} size={15} />
        <Text style={styles.hubFooterText}>{user.email ?? 'SIGNED IN'}</Text>
        <Text style={styles.hubFooterText}>REAL-TIME SYNC</Text>
      </View>
    </View>
  );
}

function TabButton({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, selected && styles.tabButtonSelected]}>
      {icon}
      <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText}>{title}</Text>
      <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyAction}>
          <Text style={styles.emptyActionText}>{action}</Text>
          <ArrowUpRight color={palette.lime} size={15} />
        </Pressable>
      ) : null}
    </View>
  );
}

function PersonRow({
  person,
  label,
  onPress,
  trailing,
}: {
  person: Profile;
  label: string;
  onPress: () => void;
  trailing: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={styles.personRow}>
      <Avatar name={person.display_name} />
      <View style={styles.personCopy}>
        <Text numberOfLines={1} style={styles.personName}>{person.display_name}</Text>
        <Text numberOfLines={1} style={styles.personPreview}>{label}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={[styles.avatar, small && styles.avatarSmall]}>
      <Text style={[styles.avatarText, small && styles.avatarTextSmall]}>{initials || '?'}</Text>
    </View>
  );
}

function ChatThread({
  conversation,
  peer,
  user,
  onBack,
}: {
  conversation: DirectConversation;
  peer: Profile;
  user: User;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    void supabase
      .from('messages')
      .select('id,conversation_id,sender_id,body,created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!isMounted) return;
        if (loadError) setError(loadError.message);
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          for (const message of (data ?? []) as ChatMessage[]) {
            byId.set(message.id, message);
          }
          return [...byId.values()].sort(
            (left, right) => left.created_at.localeCompare(right.created_at),
          );
        });
        setIsLoading(false);
      });

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id) ? current : [...current, incoming],
          );
        },
      )
      .subscribe((status, subscriptionError) => {
        setIsLive(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(subscriptionError?.message ?? 'The live channel could not connect.');
        }
      });

    return () => {
      isMounted = false;
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  async function sendMessage() {
    if (!supabase || !draft.trim() || isSending) return;
    const body = draft.trim();
    setDraft('');
    setIsSending(true);
    setError('');

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversation.id, sender_id: user.id, body })
      .select('id,conversation_id,sender_id,body,created_at')
      .single();

    if (sendError) {
      setDraft(body);
      setError(sendError.message);
    } else {
      const sent = data as ChatMessage;
      setMessages((current) =>
        current.some((message) => message.id === sent.id) ? current : [...current, sent],
      );
    }
    setIsSending(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.threadScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={styles.threadHeader}>
        <Pressable accessibilityLabel="Back to messages" onPress={onBack} style={styles.backButton}>
          <ArrowLeft color={palette.text} size={21} />
        </Pressable>
        <Avatar name={peer.display_name} small />
        <View style={styles.threadIdentity}>
          <Text numberOfLines={1} style={styles.threadName}>{peer.display_name}</Text>
          <View style={styles.threadLiveRow}>
            <View style={[styles.liveDot, !isLive && styles.liveDotOff]} />
            <Text style={[styles.threadLiveText, !isLive && styles.threadLiveTextOff]}>
              {isLive ? 'LIVE CHANNEL' : 'CONNECTING'}
            </Text>
          </View>
        </View>
        <View style={styles.threadHeaderMark}>
          <Radio color={palette.lime} size={17} />
        </View>
      </View>

      <View style={styles.threadDateRule}>
        <View style={styles.rule} />
        <Text style={styles.dateLabel}>MESSAGES</Text>
        <View style={styles.rule} />
      </View>

      {isLoading ? (
        <View style={styles.threadLoading}>
          <ActivityIndicator color={palette.lime} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={(message) => message.id}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user.id;
            return (
              <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
                <View style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageTheirs]}>
                  <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.body}</Text>
                  <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.threadEmpty}>
              <View style={styles.emptyIcon}><MessageCircle color={palette.lime} size={21} /></View>
              <Text style={styles.emptyTitle}>First message, first move.</Text>
            </View>
          }
        />
      )}

      {error ? <Text style={styles.threadError}>{error}</Text> : null}
      <View style={styles.composerRow}>
        <TextInput
          editable={!isSending}
          onChangeText={setDraft}
          onSubmitEditing={() => void sendMessage()}
          placeholder="Write a message..."
          placeholderTextColor={palette.muted}
          returnKeyType="send"
          style={styles.composerInput}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Send message"
          disabled={!draft.trim() || isSending}
          onPress={() => void sendMessage()}
          style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
        >
          {isSending ? <ActivityIndicator color={palette.background} /> : <Send color={palette.background} size={18} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <View style={styles.brandCore} />
      </View>
      <Text style={[styles.brandName, compact && styles.brandNameCompact]}>PULSE</Text>
      <Text style={styles.brandIndex}>/ 01</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: palette.background },
  setupScreen: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 26, paddingTop: 72, paddingBottom: 34 },
  setupCopy: { marginTop: 74 },
  eyebrow: { color: palette.lime, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  setupTitle: { color: palette.text, fontSize: 44, fontWeight: '700', lineHeight: 48, marginTop: 14 },
  setupBody: { color: palette.muted, fontSize: 15, lineHeight: 23, marginTop: 15, maxWidth: 310 },
  setupSteps: { marginTop: 38, borderTopColor: palette.line, borderTopWidth: 1 },
  setupStep: { alignItems: 'center', borderBottomColor: palette.line, borderBottomWidth: 1, flexDirection: 'row', gap: 14, minHeight: 56 },
  setupNumber: { color: palette.lime, fontFamily: 'monospace', fontSize: 11 },
  setupStepText: { color: palette.text, flex: 1, fontSize: 14, fontWeight: '600' },
  setupFoot: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 'auto' },
  setupFootText: { color: palette.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  centeredScreen: { alignItems: 'center', backgroundColor: palette.background, flex: 1, justifyContent: 'center', gap: 14 },
  loadingLabel: { color: palette.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  authScreen: { backgroundColor: palette.background, flex: 1 },
  authContent: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 64, paddingBottom: 34 },
  authIntro: { marginBottom: 30, marginTop: 66 },
  authTitle: { color: palette.text, fontSize: 46, fontWeight: '700', lineHeight: 49, marginTop: 13 },
  authSubtitle: { color: palette.muted, fontSize: 14, marginTop: 13 },
  input: { backgroundColor: palette.panel, borderColor: palette.line, borderRadius: 8, borderWidth: 1, color: palette.text, fontSize: 15, height: 54, marginBottom: 12, paddingHorizontal: 16 },
  notice: { color: palette.coral, fontSize: 13, lineHeight: 19, marginVertical: 8 },
  primaryButton: { alignItems: 'center', backgroundColor: palette.lime, borderRadius: 8, flexDirection: 'row', height: 55, justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 18 },
  primaryButtonText: { color: palette.background, fontSize: 15, fontWeight: '800' },
  authSwitch: { alignItems: 'center', marginTop: 24, padding: 8 },
  authSwitchText: { color: palette.muted, fontSize: 13 },
  authSwitchAction: { color: palette.lime, fontWeight: '700' },
  hubScreen: { backgroundColor: palette.background, flex: 1, paddingHorizontal: 22, paddingTop: 58 },
  hubTopline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hubTopActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  connectionPill: { alignItems: 'center', backgroundColor: palette.panel, borderColor: palette.line, borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: 7, height: 30, paddingHorizontal: 10 },
  connectionDot: { backgroundColor: palette.lime, borderRadius: 4, height: 6, width: 6 },
  connectionText: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  iconButton: { alignItems: 'center', borderColor: palette.line, borderRadius: 8, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  hubHeading: { marginBottom: 21, marginTop: 42 },
  hubTitle: { color: palette.text, fontSize: 34, fontWeight: '700', marginTop: 7 },
  searchBox: { alignItems: 'center', backgroundColor: palette.panel, borderColor: palette.line, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 11, height: 48, paddingHorizontal: 14 },
  searchInput: { color: palette.text, flex: 1, fontSize: 14, height: '100%' },
  segmentedControl: { backgroundColor: palette.panel, borderRadius: 8, flexDirection: 'row', gap: 4, marginTop: 16, padding: 4 },
  tabButton: { alignItems: 'center', borderRadius: 6, flex: 1, flexDirection: 'row', gap: 8, height: 40, justifyContent: 'center' },
  tabButtonSelected: { backgroundColor: palette.lime },
  tabButtonText: { color: palette.muted, fontSize: 13, fontWeight: '700' },
  tabButtonTextSelected: { color: palette.background },
  errorText: { color: palette.coral, fontSize: 12, marginTop: 13 },
  hubLoading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  listContent: { paddingBottom: 24, paddingTop: 26 },
  sectionLabel: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  sectionLabelText: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  sectionCount: { color: palette.lime, fontFamily: 'monospace', fontSize: 10 },
  personRow: { alignItems: 'center', borderBottomColor: palette.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 76, paddingVertical: 10 },
  avatar: { alignItems: 'center', backgroundColor: palette.panelRaised, borderColor: '#3A4B44', borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', marginRight: 13, position: 'relative', width: 44 },
  avatarSmall: { borderRadius: 18, height: 36, marginRight: 0, width: 36 },
  avatarText: { color: palette.text, fontSize: 13, fontWeight: '800' },
  avatarTextSmall: { fontSize: 11 },
  personCopy: { flex: 1, gap: 5 },
  personName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  personPreview: { color: palette.muted, fontSize: 12 },
  emptyState: { alignItems: 'center', backgroundColor: palette.panel, borderColor: palette.line, borderRadius: 10, borderWidth: 1, marginTop: 14, paddingHorizontal: 18, paddingVertical: 30 },
  emptyIcon: { alignItems: 'center', backgroundColor: palette.panelRaised, borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  emptyTitle: { color: palette.text, fontSize: 14, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  emptyAction: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 15 },
  emptyActionText: { color: palette.lime, fontSize: 12, fontWeight: '700' },
  hubFooter: { alignItems: 'center', borderTopColor: palette.line, borderTopWidth: 1, flexDirection: 'row', gap: 8, minHeight: 48 },
  hubFooterText: { color: palette.muted, flex: 1, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  threadScreen: { backgroundColor: palette.background, flex: 1, paddingTop: 51 },
  threadHeader: { alignItems: 'center', borderBottomColor: palette.line, borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingBottom: 14, paddingHorizontal: 17 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 30 },
  threadIdentity: { flex: 1, gap: 4 },
  threadName: { color: palette.text, fontSize: 15, fontWeight: '700' },
  threadLiveRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  liveDot: { backgroundColor: palette.lime, borderRadius: 3, height: 6, width: 6 },
  liveDotOff: { backgroundColor: palette.muted },
  threadLiveText: { color: palette.lime, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  threadLiveTextOff: { color: palette.muted },
  threadHeaderMark: { alignItems: 'center', borderColor: palette.line, borderRadius: 8, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  threadDateRule: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 22 },
  rule: { backgroundColor: palette.line, flex: 1, height: 1 },
  dateLabel: { color: palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  threadLoading: { flex: 1, justifyContent: 'center' },
  messageList: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 17, paddingVertical: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 11 },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowTheirs: { justifyContent: 'flex-start' },
  messageBubble: { borderRadius: 12, maxWidth: '82%', paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8 },
  messageMine: { backgroundColor: palette.lime, borderBottomRightRadius: 3 },
  messageTheirs: { backgroundColor: palette.panelRaised, borderBottomLeftRadius: 3 },
  messageText: { color: palette.text, fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: palette.background },
  messageTime: { color: palette.muted, fontSize: 9, marginTop: 5, textAlign: 'right' },
  messageTimeMine: { color: '#59634B' },
  threadEmpty: { alignItems: 'center', alignSelf: 'center', marginVertical: 34 },
  threadError: { color: palette.coral, fontSize: 11, paddingHorizontal: 18, paddingVertical: 5 },
  composerRow: { alignItems: 'center', borderTopColor: palette.line, borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 11, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  composerInput: { backgroundColor: palette.panel, borderColor: palette.line, borderRadius: 8, borderWidth: 1, color: palette.text, flex: 1, fontSize: 14, height: 46, paddingHorizontal: 14 },
  sendButton: { alignItems: 'center', backgroundColor: palette.lime, borderRadius: 8, height: 46, justifyContent: 'center', width: 48 },
  sendButtonDisabled: { opacity: 0.45 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  brandIcon: { alignItems: 'center', borderColor: palette.lime, borderRadius: 7, borderWidth: 1.5, height: 26, justifyContent: 'center', transform: [{ rotate: '45deg' }], width: 26 },
  brandCore: { backgroundColor: palette.coral, borderRadius: 3, height: 8, width: 8 },
  brandName: { color: palette.text, fontSize: 14, fontWeight: '900', letterSpacing: 1.4 },
  brandNameCompact: { fontSize: 12 },
  brandIndex: { color: palette.muted, fontFamily: 'monospace', fontSize: 9, marginLeft: 1 },
});
