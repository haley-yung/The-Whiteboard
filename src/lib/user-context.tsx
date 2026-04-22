"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "./types";

type Ctx = {
  users: User[];
  currentUser: User;
  setCurrentUserId: (id: string) => void;
};

const UserCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "whiteboard:currentUserId";

export function UserProvider({
  users,
  children,
}: {
  users: User[];
  children: React.ReactNode;
}) {
  const defaultRt = users.find((u) => u.role === "RT") ?? users[0];
  const [currentId, setCurrentId] = useState<string>(defaultRt.id);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && users.some((u) => u.id === stored)) {
      setCurrentId(stored);
    }
  }, [users]);

  const setCurrentUserId = useCallback((id: string) => {
    setCurrentId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  }, []);

  const value = useMemo<Ctx>(() => {
    const currentUser = users.find((u) => u.id === currentId) ?? defaultRt;
    return { users, currentUser, setCurrentUserId };
  }, [users, currentId, defaultRt, setCurrentUserId]);

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser() {
  const v = useContext(UserCtx);
  if (!v) throw new Error("useUser must be used inside UserProvider");
  return v;
}
