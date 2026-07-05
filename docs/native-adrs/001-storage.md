# ADR 001: Native Storage Architecture

- **Status:** Proposed
- **Context:** The native app requires a clear strategy for storing local data. Currently, `@react-native-async-storage/async-storage` and `expo-secure-store` are installed. However, Phase 1 requirements (e.g., `sadhana-engine` offline tracking) demand a storage adapter (D005) since Dexie/IndexedDB are not React Native compatible.
- **Decision:** 
  1. Use `expo-secure-store` for all sensitive cryptographic keys, auth session tokens, and identity secrets.
  2. Use `@react-native-async-storage/async-storage` for non-sensitive, simple key-value UI state (e.g., theme preferences, onboarded flags).
  3. Introduce a structured SQL-based storage adapter using SQLite (`expo-sqlite`) for complex offline-first capabilities (e.g., Sadhana tracking), abstracting it so shared TS packages can inject the storage layer.
- **Alternatives considered:**
  - **MMKV:** Extremely fast but requires JSI and custom C++ setup, which can complicate Expo Go / Dev Client transitions if not careful.
  - **WatermelonDB:** Heavyweight ORM; overkill for Phase 1.
- **Security/privacy impact:** Sensitive tokens remain encrypted via the OS keychain/keystore. Non-sensitive data is sandboxed but unencrypted.
- **Store-compliance impact:** Standard practices, no direct compliance issues.
- **Implementation tasks:**
  - Define a generic storage interface in shared packages (`sadhana-engine`).
  - Implement `SadhanaSQLiteAdapter` in the native repo.
  - Ensure `expo-sqlite` is added.
  - See `docs/native-adrs/007-sadhana-storage-adapter.md` for the adapter contract and sync boundary.
- **Verification plan:** Write unit tests for the SQLite adapter ensuring it fulfills the `sadhana-engine` storage contract.
- **Open questions:** 
  - Does the Web implementation require a strictly identical interface to the native SQLite adapter?
