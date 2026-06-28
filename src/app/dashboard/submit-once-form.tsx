"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

type ServerFormAction = (formData: FormData) => void | Promise<void>;

const SubmitOnceContext = createContext(false);

export function SubmitOnceForm({
  action,
  children,
  className,
}: {
  action: ServerFormAction;
  children: ReactNode;
  className?: string;
}) {
  const submittedRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submittedRef.current) {
      event.preventDefault();
      return;
    }

    submittedRef.current = true;
    setSubmitted(true);
  }

  return (
    <SubmitOnceContext.Provider value={submitted}>
      <form action={action} className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </SubmitOnceContext.Provider>
  );
}

export function SubmitOnceButton({
  children,
  className,
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const submitted = useContext(SubmitOnceContext);
  const isBusy = pending || submitted;

  return (
    <button
      aria-busy={isBusy}
      className={className}
      disabled={isBusy}
      type="submit"
    >
      {isBusy ? pendingLabel : children}
    </button>
  );
}
