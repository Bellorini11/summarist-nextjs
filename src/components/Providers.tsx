"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { store, setAuthOpen, RootState } from "@/store";
import { auth, db, firebaseReady } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type AuthValue = {
  user: User | null;
  loading: boolean;
  premium: boolean;
  subscriptionPlan: "monthly" | "yearly" | null;
  premiumLoading: boolean;
  isGuest: boolean;
  openLogin: () => void;
  logout: () => Promise<void>;
};

type AuthMode = "login" | "register" | "reset";

const AuthContext = createContext<AuthValue | null>(null);

export function useSession() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("Missing provider");
  }

  return value;
}

function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [premium, setPremium] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    "monthly" | "yearly" | null
  >(null);
  const [premiumLoading, setPremiumLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!db || !user || user.isAnonymous) {
      setPremium(false);
      setSubscriptionPlan(null);
      setPremiumLoading(false);
      return;
    }

    setPremium(false);
    setSubscriptionPlan(null);
    setPremiumLoading(true);

    return onSnapshot(
      doc(db, "customers", user.uid),
      (snapshot) => {
        const data = snapshot.data();

        setPremium(
          data?.subscriptionStatus === "active" ||
            data?.subscriptionStatus === "trialing" ||
            data?.premium === true,
        );

        setSubscriptionPlan(
          data?.subscriptionPlan === "yearly"
            ? "yearly"
            : data?.subscriptionPlan === "monthly"
              ? "monthly"
              : null,
        );

        setPremiumLoading(false);
      },
      () => {
        setPremium(false);
        setSubscriptionPlan(null);
        setPremiumLoading(false);
      },
    );
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        premium,
        subscriptionPlan,
        premiumLoading,
        isGuest: Boolean(user?.isAnonymous),
        openLogin: () => dispatch(setAuthOpen(true)),
        logout: async () => {
          if (auth) {
            await signOut(auth);
          }
        },
      }}
    >
      {children}
      <AuthModal />
    </AuthContext.Provider>
  );
}

function AuthModal() {
  const open = useSelector((state: RootState) => state.ui.authOpen);

  const dispatch = useDispatch();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [fieldsReady, setFieldsReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");

    if (nextMode === "register") {
      setEmail("example@gmail.com");
      setPassword("Example123");
      setConfirmPassword("Example123");
    } else {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  }

  function closeModal() {
    if (busy) return;

    dispatch(setAuthOpen(false));
    changeMode("login");
  }

  function finishLogin() {
    dispatch(setAuthOpen(false));
    changeMode("login");
    router.push("/for-you");
  }

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!auth) {
      setError("Firebase is not configured yet.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);

        setSuccess(
          "If an account exists for this email, you will receive password reset instructions.",
        );
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);

        finishLogin();
      } else {
        await signInWithEmailAndPassword(auth, email, password);

        finishLogin();
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function guestLogin() {
    if (!auth) {
      setError("Firebase is not configured yet.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await signInAnonymously(auth);
      finishLogin();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function googleLogin() {
    if (!auth) {
      setError("Firebase is not configured yet.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      finishLogin();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Summarist authentication"
    >
      <div className="relative w-full max-w-[400px] rounded-md bg-white px-7 pb-7 pt-8 shadow-2xl">
        <button
          type="button"
          onClick={closeModal}
          disabled={busy}
          aria-label="Close login"
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
          {mode === "login"
            ? "Log in to Summarist"
            : mode === "register"
              ? "Sign up to Summarist"
              : "Reset your password"}
        </h2>

        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={guestLogin}
              disabled={busy}
              className="mb-4 w-full rounded bg-[#3b5998] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Login as Guest
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={googleLogin}
              disabled={busy}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded bg-[#4285f4] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-white text-base font-bold text-[#4285f4]">
                G
              </span>
              Login with Google
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        {mode === "reset" && (
          <p className="mb-5 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
          </p>
        )}

        <form onSubmit={submit} autoComplete="off" className="space-y-3">
          <input
            type="email"
            placeholder="Email Address"
            aria-label="Email Address"
            autoComplete="off"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
          />

          {mode !== "reset" && (
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="off"
              required
              minLength={mode === "register" ? 6 : 1}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
            />
          )}

          {mode === "register" && (
            <input
              type="password"
              placeholder="Confirm Password"
              aria-label="Confirm Password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
            />
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="text-sm text-green-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-[#2bb673] px-4 py-3 text-sm font-semibold text-white hover:bg-[#239b61] disabled:opacity-50"
          >
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : mode === "register"
                  ? "Create Account"
                  : "Send Reset Email"}
          </button>
        </form>

        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={() => changeMode("reset")}
              className="mt-4 block w-full text-center text-sm text-blue-500 hover:underline"
            >
              Forgot your password?
            </button>

            <div className="my-5 h-px bg-gray-200" />

            <button
              type="button"
              onClick={() => changeMode("register")}
              className="block w-full text-center text-sm font-semibold text-blue-500 hover:underline"
            >
              Don&apos;t have an account?
            </button>
          </>
        )}

        {mode !== "login" && (
          <button
            type="button"
            onClick={() => changeMode("login")}
            className="mt-5 block w-full text-center text-sm font-semibold text-blue-500 hover:underline"
          >
            Back to Login
          </button>
        )}

        {!firebaseReady && (
          <p className="mt-5 text-center text-xs text-amber-700">
            Firebase must be configured before authentication will work.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>{children}</SessionProvider>
    </Provider>
  );
}
