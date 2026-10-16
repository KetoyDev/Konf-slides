# Kotlin Over the Air — full speaker script

The stage notes in `index.html` are short cue lists. This file keeps the full prose — read it while rehearsing, not on stage. Headings name the slide in the **original** 10-slide deck; the new deck splits several of them (see the slide map in `README.md`).


## 1 · TITLE

**Open (30s).** "Hi Chennai. Quick show of hands — who has shipped a one-line fix and then waited a week for users to actually get it?" Let the hands go up. "That wait is what this talk is about."

**Who I am.** One sentence: Aditya Shinde, founder of Ketoy.dev. Mention we build KetoyVM, an open-source Kotlin execution runtime, and that it has been live on Google Play since mid-2026.

**Promise for the next 30 minutes.** You will leave knowing (1) what "over the air" means for Kotlin, (2) how it is different from server-driven UI, (3) how the compiler → bundle → runtime pipeline actually works, and (4) how it runs on iOS and at multi-bundle scale.

**Tone.** This is an introduction. Keep it narrative; the deep technical slides come later and we will tell people when to lean in.


## 2 · WHY — the delivery gap, and who is already moving

**Walk the timeline (click to animate).** Day 0 the fix is merged. Build, QA, then store review — Play is usually hours but can be days, App Store is often 24–48 h. Then a staged rollout you deliberately slow down, then the long tail: users who never tap "update". Two weeks to reach most of your base is normal for a mature app.

**Why it hurts.** A wrong price string, a broken onboarding step, a festival campaign that must go live on Diwali morning — none of these can wait for a release train. Teams respond with feature flags and remote config, which only toggle what already shipped.

**Who moved first (fragments).** Airbnb's Ghost Platform, Lyft, Netflix, Spotify, and closer to home Swiggy and Flipkart all pushed large parts of their UI to be server-driven. Cite them as "server-driven UI adopters" — don't over-claim specifics.

**Other ecosystems.** React Native has had CodePush (now Expo EAS Updates) since 2016; Flutter has Shorebird. JavaScript and Dart developers can ship code over the air. Say it plainly: Kotlin had no first-class answer.

**Transition.** "So the obvious question: can we ship Kotlin — real Compose — over the air, without turning it into JSON?" That is slide 3.

*[Confirm the company list with the organisers before stage; keep it to publicly documented SDUI programmes.]*


## 3 · OTA ≠ SDUI

**Left card.** Server-driven UI sends a description. The app contains an interpreter that maps a schema — JSON, protobuf, whatever — onto a fixed set of widgets. It is excellent for layout and copy. But logic lives in the app, the component vocabulary is frozen at release time, and you have invented a DSL you now own forever.

**Right card.** Over-the-air for Kotlin means the unit of delivery is a program. You write a normal Compose screen — real `@Composable`, real `ViewModel`, real `Flow` — it is compiled to a small signed bytecode bundle, and a sandboxed VM inside the app executes it, rendering through the host's own Compose. Every parameter of every Material3 component is available because the compiler lowers the real call, not a hand-mapped subset.

**The line that matters.** SDUI is data; OTA is code. The trust model is the same — the app only exposes what it chooses to expose — but the ceiling is different.

**Anticipate the question.** "Isn't shipping code against store policy?" Hold it — we answer that on the iOS slide. Short version: it is interpreted, sandboxed and signed, the same lane React Native OTA has lived in for years, and we passed Play review with zero violations.


## 4 · ARCHITECTURE — the five layers

**Build the stack left to right (five fragments).**

**01 Source.** Developers write ordinary Kotlin. The only thing that marks a screen as deliverable is a `@KetoyComposable` annotation; the rest is Compose you already know.

**02 Compiler plugin.** A K2 IR extension walks the annotated closure and lowers it to KBC — our own register-based bytecode. Crucially it also validates: a direct Android API call, reflection, file I/O or `GlobalScope` is a compile error with a fix suggestion, not a runtime surprise.

**03 Bundle.** The output is a `.ktx` file: sections for strings, functions, code, manifests; compressed; signed with Ed25519. The production bundle in our Play app is 1.6 KB.

**04 VM.** On device, a register-based interpreter executes KBC. It has a coroutine engine so `suspend` and `Flow` work for real, and it reaches the outside world only through a capability registry the host populated.

**05 Renderer.** Rendering is behind a small SPI. On Android that is Compose; on iOS the same bundle renders through SwiftUI or Compose Multiplatform. More on that in slide 8.

**Mantra.** "The app is the OS, the server ships programs." If people remember one sentence, this is it.


## 5 · COMPILER

**This is the slide to lean in on.** Code on the left is a real screen shape from our sample app; the callouts on the right step through it (five fragments, each highlights lines).

**1 — One annotation.** `@KetoyComposable` marks the root. The compiler walks the transitive closure from that root; a helper you call gets compiled, a native sibling function you never call compiles to normal DEX untouched. No separate module required — it can live in the app module.

**2 — State and Flow.** `collectAsState`, `remember { mutableStateOf }`, `viewModel()` — these lower to dedicated opcodes, so they behave like Compose, including recomposition. This is the part SDUI cannot do.

**3 — Component calls.** `LazyColumn`, `Text`, `Modifier.padding` lower to `COMPOSABLE_CALL` against a generated adapter catalog. Parameters are matched by name, not position — when Material3 1.4 inserted a new `autoSize` parameter on `Text`, existing bundles kept working. Mention: 30 Material3 composables, all parameters, generated by KSP.

**4 — Sandbox at compile time.** Show the red line. Calling `Toast.makeText` directly is a compile error: it names the call, explains why it is forbidden, and tells you to expose a capability instead. Forbidden: `android.*`, reflection, `java.io`, `GlobalScope`. The runtime cannot reach these even if you try.

**5 — Embedded compiler.** The KBC compiler is an embedded K2 (Kotlin 2.4.10) running in an isolated Gradle worker with its own classpath. Your app can be on any supported Kotlin or AGP — we verified a consumer on a different Kotlin and AGP 9 — and the bundle still compiles. Decoupling the toolchain was the single biggest adoption blocker we removed.


## 6 · KTX BUNDLE

**Build the byte strip (fragments).** A `.ktx` starts with four magic bytes — K, T, O, Y — then a 14-byte header with the format version, the minimum runtime version and flags. Then sections, each with a type byte and sizes.

**Sections.** A string pool; manifests that declare which adapters, constructors and capabilities the program needs (so the host can refuse at load time rather than crash mid-screen); the function table; CODE, which is the only big section and is DEFLATE-compressed; EXPORTS and IMPORTS for linking between bundles; and PLATFORM_SCOPE so one bundle can say "Android-only". The tail is a 64-byte Ed25519 signature.

**Numbers (fragments).** 1.6 KB is the real About-screen bundle in FinSpare on Google Play. 15 section types, each id pinned by a wire-format freeze test — a renumbered section fails the build. Zero bytes are parsed before the signature verifies: an unsigned or tampered bundle never reaches the reader. The whole SDK is roughly 0.7 MB of download after R8.

**Why DEFLATE.** The first year every bundle was Brotli — and Brotli decoding needs a JVM library, so those bundles were Android-only. Moving to DEFLATE (zlib exists on every platform) is what let the same file run on iOS. Good story about assumptions hiding in defaults.


## 7 · RUNTIME

**The ring.** The VM sits in the middle. Everything it can touch is on the orbit — and every one of those is something the host app registered on purpose: Compose adapters, navigation, Room and DataStore wrappers, Ktor, and the app's own APIs exposed as capabilities. Outside the ring, crossed out: reflection, raw Android APIs, loading DEX, unstructured concurrency. Not "discouraged" — unreachable. There is no opcode for them.

**How a capability works.** The host registers `"observeTodos"` → a function. The bundle's manifest declares it needs `observeTodos`. At load the registry is checked; if anything is missing the bundle is rejected with the missing name. Capabilities are addressed by fully-qualified name; the numeric id is just an allocation.

**Facts (fragments).** 124 opcodes in a register machine. Coroutines are a first-class engine: suspension points, continuation table, `Flow` collection, `withContext` with the host's dispatchers, cancellation that cascades. One VM per process — the bundle is loaded once, screens share it, ViewModel state survives rotation via `SavedStateHandle`. And zero reflection, zero executable memory: on iOS the JIT seam returns null and a test asserts that; on Android an optional Tier-1 DEX JIT exists for hot pure functions.

**If asked about performance.** Bundle parse is sub-50 ms; a composable call is sub-millisecond; the interpreter is fast enough that UI-bound screens are indistinguishable from native in our Play app.


## 8 · iOS

**The headline.** The exact `.ktx` the Android app ships — same bytes, verified against the same public key — renders and takes a tap on iOS. We did not build a second compiler or a second format; we moved the VM, the bundle format and the coroutine engine to Kotlin Multiplatform `commonMain`.

**Three phones (fragments).** Left: Android, Compose, the thing on Google Play. Middle: iOS through SwiftUI — the VM emits a neutral view tree and a Swift walker turns it into real `VStack`, `Text`, `Button`: Dynamic Type, VoiceOver, native scroll physics, no Skia in the binary. Right: iOS through Compose Multiplatform — Material3 drawn on Skia, with all 30 catalog components generated identically to Android (a build-time parity test diffs the generated sources).

**Why two iOS backends?** Because Compose Multiplatform cannot produce SwiftUI views — it draws on a canvas. If you want native chrome you need a translation, and nobody upstream has one. The render SPI makes keeping both cheap; a host picks one.

**The policy question (fragment pills).** Apple guideline 2.5.2 forbids executing downloaded code that changes the app's purpose. The tolerated lane — React Native OTA, Judo, config-driven SDUI — is interpreted content inside the app's stated purpose. Our three properties are enforced by architecture, not prose: interpreted only (the JIT seam returns null on iOS and a test asserts it), sandboxed (capability registry), signed (verification before parsing). On Google Play the app passed review with zero policy violations.

**Honest caveats.** SwiftUI backend has a few components still reported unsupported by name (`Canvas`); the App Store submission is a product step we have not done from the library repo. Say so if asked.


## 9 · MULTI-BUNDLE + SCALE

**Graph (fragments 1–3).** Real apps are not one screen. Each feature team ships its own bundle — `checkout.ktx` exports `CartSummary`, `offers.ktx` exports `OfferCard` — and `main.ktx` imports them. Linking is by name through EXPORTS / IMPORTS and a `CALL_EXTERNAL` opcode, resolved at activation. Fragment 2: platform-specific code is a graph concern too. A shared bundle imports a "platform seam"; an `android` slice and an `ios` slice each export it, and a platform scope on the bundle tells the host which one it may run. That is `expect`/`actual` at the bundle boundary, not `if (platform)` inside bytecode. Fragment 3: the whole set is described by one signed graph manifest, activated atomically — never half a graph.

**Ladder (fragments 4–7).** Canary: a rollout percent over a deterministic install bucket, so the same device always lands in the same cohort and you can pause at 1 %. Kill switch and pinned content hash: bundles are content-addressed, keys can be rotated and revoked. Automatic rollback: if a freshly activated bundle crashes, the next launch goes to last-known-good, and a terminal blocklist stops it from looping. And the native fallback: `KetoyScreen` always takes the composable you shipped in the APK — no bundle, bad signature, app too old — you get the native screen, not an error page.

**Control plane.** Deliberately none. Rollout percent, kill switch and cohort live in your own remote config or CDN; Ketoy reads a signed `active.json`. A crash in a config SDK must never be the thing that disarms the kill switch.

**Proof points.** All of this is verified on hardware: a Pixel 6a device suite and the iOS simulator run on every phase. Mention FinSpare: live on Google Play, About screen delivered OTA, review passed clean.


## 10 · TAKEAWAYS + THANKS

**Four takeaways (fragments), ten seconds each.**

1. OTA ships code; SDUI ships data. If you only need layout and copy, SDUI is fine. If you need logic, state and the full component surface, you need a program.

2. The developer experience is the point: one annotation on normal Compose code, and the compiler is the gatekeeper — forbidden APIs fail the build with a fix.

3. Security is structural: signature before parsing, a capability registry instead of reflection, interpreted only. This is what makes the store conversation a short one.

4. Multiplatform: the same bytes on Android and iOS, and the native screen you shipped in the APK is always the fallback — adopting it is additive, never a rewrite.

**Close.** Repo and docs on screen. Replace the QR placeholder with a real QR to the repo before the event. Invite people to try the getting-started guide tonight — it is a fifteen-minute setup — and to find us after for the demo on a real device.

**Q&A prompts to be ready for:** performance numbers (slide 7 notes), App Store status (slide 8 notes), how capabilities are versioned (by fully-qualified name; ids are allocations; merged registry fails the build on collisions), what happens on an old app version (`minAppVersion` in the bundle; the host refuses and falls back natively).
