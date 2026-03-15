# Composition Patterns Reference

Detailed examples for compound components, context interfaces, and state decoupling.

---

## Compound Components

Structure a complex component as a context provider plus composable subcomponents. Each subcomponent reads shared state from context. Consumers explicitly compose only the pieces they need.

### Step 1: Define the context

```tsx
import { createContext, use } from "react";

interface EditorState {
  content: string;
  attachments: Attachment[];
  isSubmitting: boolean;
}

interface EditorActions {
  update: (updater: (state: EditorState) => EditorState) => void;
  submit: () => void;
}

interface EditorMeta {
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

interface EditorContextValue {
  state: EditorState;
  actions: EditorActions;
  meta: EditorMeta;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function useEditor(): EditorContextValue {
  const ctx = use(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
```

### Step 2: Build subcomponents

Each subcomponent is small and focused. It reads only what it needs from context.

```tsx
function EditorProvider({ children, state, actions, meta }: {
  children: React.ReactNode;
  state: EditorState;
  actions: EditorActions;
  meta: EditorMeta;
}) {
  return (
    <EditorContext value={{ state, actions, meta }}>
      {children}
    </EditorContext>
  );
}

function EditorFrame({ children }: { children: React.ReactNode }) {
  return <form className="flex flex-col gap-2">{children}</form>;
}

function EditorInput({ placeholder }: { placeholder?: string }) {
  const { state, actions: { update }, meta } = useEditor();
  return (
    <textarea
      ref={meta.inputRef}
      value={state.content}
      placeholder={placeholder}
      onChange={(e) =>
        update((s) => ({ ...s, content: e.target.value }))
      }
    />
  );
}

function EditorToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

function EditorSubmit({ label = "Send" }: { label?: string }) {
  const { state, actions: { submit } } = useEditor();
  return (
    <button onClick={submit} disabled={state.isSubmitting}>
      {state.isSubmitting ? "Sending..." : label}
    </button>
  );
}

function EditorAttachments() {
  const { state } = useEditor();
  if (state.attachments.length === 0) return null;
  return (
    <ul>
      {state.attachments.map((a) => (
        <li key={a.id}>{a.name}</li>
      ))}
    </ul>
  );
}
```

### Step 3: Export as compound component

```tsx
const Editor = {
  Provider: EditorProvider,
  Frame: EditorFrame,
  Input: EditorInput,
  Toolbar: EditorToolbar,
  Submit: EditorSubmit,
  Attachments: EditorAttachments,
};
```

### Step 4: Compose variants

```tsx
// Standard editor
function StandardEditor() {
  return (
    <Editor.Frame>
      <Editor.Input />
      <Editor.Attachments />
      <Editor.Toolbar>
        <BoldButton />
        <ItalicButton />
        <Editor.Submit />
      </Editor.Toolbar>
    </Editor.Frame>
  );
}

// Minimal inline editor
function InlineEditor() {
  return (
    <Editor.Frame>
      <Editor.Input placeholder="Quick note..." />
      <Editor.Submit label="Add" />
    </Editor.Frame>
  );
}

// Reply editor with extra context
function ReplyEditor({ parentId }: { parentId: string }) {
  return (
    <Editor.Frame>
      <QuotedMessage parentId={parentId} />
      <Editor.Input placeholder="Write a reply..." />
      <Editor.Toolbar>
        <Editor.Submit label="Reply" />
      </Editor.Toolbar>
    </Editor.Frame>
  );
}
```

Each variant is explicit. No boolean props. No hidden conditionals. Shared subcomponents, different compositions.

---

## Context Interface Pattern (Dependency Injection)

The `{ state, actions, meta }` interface is a contract. Any provider that fulfills the contract can drive the same UI.

### The interface

```typescript
interface EditorState {
  content: string;
  attachments: Attachment[];
  isSubmitting: boolean;
}

interface EditorActions {
  update: (updater: (state: EditorState) => EditorState) => void;
  submit: () => void;
}

interface EditorMeta {
  inputRef: React.RefObject<HTMLTextAreaElement>;
}
```

### Provider A: Local state (ephemeral forms)

```tsx
function LocalEditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorState>({
    content: "",
    attachments: [],
    isSubmitting: false,
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const actions: EditorActions = {
    update: setState,
    submit: async () => {
      setState((s) => ({ ...s, isSubmitting: true }));
      await saveLocally(state);
      setState((s) => ({ ...s, isSubmitting: false, content: "" }));
    },
  };

  return (
    <Editor.Provider state={state} actions={actions} meta={{ inputRef }}>
      {children}
    </Editor.Provider>
  );
}
```

### Provider B: Global synced state (collaborative)

```tsx
function CollaborativeEditorProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  const { state, update, submit } = useCollaborativeDocument(documentId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Editor.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Editor.Provider>
  );
}
```

### Provider C: Server action state

```tsx
function ServerEditorProvider({
  entityId,
  children,
}: {
  entityId: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<EditorState>(initialState);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const actions: EditorActions = {
    update: setState,
    submit: async () => {
      setState((s) => ({ ...s, isSubmitting: true }));
      await serverAction(entityId, state.content);
      setState((s) => ({ ...s, isSubmitting: false, content: "" }));
    },
  };

  return (
    <Editor.Provider state={state} actions={actions} meta={{ inputRef }}>
      {children}
    </Editor.Provider>
  );
}
```

### Same UI, different providers

```tsx
// Ephemeral note
<LocalEditorProvider>
  <InlineEditor />
</LocalEditorProvider>

// Collaborative document
<CollaborativeEditorProvider documentId="abc">
  <StandardEditor />
</CollaborativeEditorProvider>

// Server-persisted reply
<ServerEditorProvider entityId="xyz">
  <ReplyEditor parentId="123" />
</ServerEditorProvider>
```

The UI does not know or care how state is managed. Swap the provider, keep the UI.

---

## State Decoupling Pattern

The provider is the only place that knows how state is managed. UI components consume the context interface. They never import state management libraries directly.

### Wrong: UI coupled to implementation

```tsx
function InlineEditor({ documentId }: { documentId: string }) {
  // UI component knows about Zustand store
  const state = useDocumentStore(documentId);
  const { submit } = useDocumentSync(documentId);

  return (
    <Editor.Frame>
      <Editor.Input value={state.content} onChange={state.setContent} />
      <Editor.Submit onPress={submit} />
    </Editor.Frame>
  );
}
```

Problems:
- Cannot test without Zustand
- Cannot reuse with different state sources
- Every state library change touches UI files

### Right: State isolated in provider

```tsx
// Provider knows about Zustand
function DocumentProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  const { state, update, submit } = useDocumentStore(documentId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Editor.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Editor.Provider>
  );
}

// UI only knows about the context interface
function InlineEditor() {
  return (
    <Editor.Frame>
      <Editor.Input />
      <Editor.Submit />
    </Editor.Frame>
  );
}

// Compose
function DocumentPage({ documentId }: { documentId: string }) {
  return (
    <DocumentProvider documentId={documentId}>
      <InlineEditor />
    </DocumentProvider>
  );
}
```

Benefits:
- UI components are pure and testable
- State library can change without touching UI
- Same UI works with local state, global state, or server state

---

## Lifting State: Anti-Pattern Gallery

### Anti-pattern 1: State trapped inside, sibling needs it

```tsx
function Dialog() {
  return (
    <>
      <InlineEditor />       {/* state lives here */}
      <Preview />            {/* needs editor content -- impossible */}
      <SubmitButton />       {/* needs submit action -- impossible */}
    </>
  );
}
```

### Anti-pattern 2: useEffect to sync state upward

```tsx
function Dialog() {
  const [content, setContent] = useState("");
  return (
    <>
      <InlineEditor onContentChange={setContent} />
      <Preview content={content} />
    </>
  );
}

function InlineEditor({ onContentChange }) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    onContentChange(state.content); // sync on every keystroke
  }, [state.content]);
}
```

Problem: double state, effect cascade, stale closures.

### Anti-pattern 3: Reading state from ref on submit

```tsx
function Dialog() {
  const stateRef = useRef(null);
  return (
    <>
      <InlineEditor stateRef={stateRef} />
      <SubmitButton onPress={() => submit(stateRef.current)} />
    </>
  );
}
```

Problem: no reactivity, ref reads are timing-dependent.

### Correct: Lift to provider

```tsx
function Dialog() {
  return (
    <EditorProvider>
      <InlineEditor />
      <Preview />              {/* reads state from context */}
      <SubmitButton />         {/* calls actions.submit from context */}
    </EditorProvider>
  );
}

function Preview() {
  const { state } = useEditor();
  return <div>{state.content}</div>;
}

function SubmitButton() {
  const { actions } = useEditor();
  return <button onClick={actions.submit}>Submit</button>;
}
```

Components that need shared state do not have to be visually nested inside each other. They just need to be within the same provider boundary.
